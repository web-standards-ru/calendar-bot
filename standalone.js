"use strict";

const fs = require('fs-extra');
const path = require('path');
const unzip = require('unzip');
const https = require('https');
const moment = require('moment');

const WSEvent = require('./wsevent.js');
const {
    sendEvent,
    deleteMessage
} = require('./tlgrm.js');

const testDir = path.join(__dirname, 'events');
const urlEvents = 'https://codeload.github.com/web-standards-ru/calendar/zip/master';
const eventsDir = path.join(testDir, 'calendar-master/events');
const sendersDir = path.join(__dirname, 'senders');

const fileEvents = path.join(testDir, 'master.zip');
if (fs.existsSync(testDir)) {
    fs.removeSync(testDir);
}
fs.mkdirSync(testDir);

if (!fs.existsSync(sendersDir)) {
    fs.mkdirSync(sendersDir);
}

const download = () => {
    return new Promise((resolve, reject) => {
        //download events yaml from github 
        const file = fs.createWriteStream(fileEvents);
        https.get(urlEvents, (response) => {
            response.pipe(file);
            file.on('finish', function () {
                file.close(() => {
                    fs.createReadStream(fileEvents).pipe(unzip.Extract({
                            path: testDir
                        }))
                        .on('close', () => {
                            resolve();
                        });
                });
            });
        });
    });
};

function* generatorEvents(events) {
    let pos = 0;
    while (pos < events.length) {
        yield events[pos++];
    }
}

const formatEvent = (event) => {
    moment.locale('ru');
    return `[${event.name}](${event.link})\n${event.city}, ${moment(event.start).utc().format('DD MMMM YYYY')}`;
};

download()
    .then(() => {
        const events = fs.readdirSync(eventsDir)
            .filter((file) => {
                console.log(file);
                return /\.ya?ml$/.test(file.toLowerCase());
            })
            .map((file) => {
                const e = WSEvent.fromYaml(fs.readFileSync(path.join(eventsDir, file), 'utf-8'));
                e.file = file;
                return e;
            })
            .sort((event1, event2) => {
                return event1.start.valueOf() - event2.start.valueOf();
            });
        send(generatorEvents(events));
    })
    .catch((err) => {
        console.warn(err);
    });

const send = (gen) => {
    const item = gen.next();
    if (item.done) {
        return console.log('end', new Date);
    }

    const tmpFile = path.join(sendersDir, `${item.value.file}.res`);

    const msg = formatEvent(item.value);

    const _send = () => {
        const start = new Date();
        sendEvent(item.value, process.env.TOKEN, process.env.CHANNEL, process.env.PROXY, formatEvent)
            .then((res) => {
                const {
                    status,
                    body
                } = res;
                const data = JSON.parse(body);
                if (status != 200 || !data.ok) {
                    throw new Error(`Error send: ${body}`);
                }
                const to = (new Date()).valueOf() - start.valueOf();
                console.log('Send', item.value.name, to);
                fs.writeFileSync(tmpFile, JSON.stringify({
                    messageId: data.result.message_id,
                    text: msg,
                    dt: (new Date()).toString(),
                    to: to
                }));
            })
            .catch((err) => {
                console.warn(err);
            })
            .finally(() => {
                send(gen);
            });
    };

    if (fs.existsSync(tmpFile)) {
        const fileData = JSON.parse(fs.readFileSync(tmpFile));
        if (fileData.text != msg) {
            console.log('Rm', fileData.messageId, fileData.text, msg);
            deleteMessage(fileData.messageId, process.env.TOKEN, process.env.CHANNEL, process.env.PROXY)
                .then((res) => {
                    if (res.status != 200 || !JSON.parse(res.body).ok) {
                        throw new Error(`Error rm: ${res.status} ${res.body}`);
                    }
                })
                .catch((err) => {
                    console.warn('Error rm', fileData.messageId, err);
                })
                .finally(_send);
        } else {
            console.log('Yet sending', item.value.name);
            return send(gen);
        }
    } else {
        _send();
    }
};