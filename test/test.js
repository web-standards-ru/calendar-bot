"use strict";

const path = require('path');
const https = require('https');

const unzipper = require('unzipper');
const YAML = require('yaml');
const moment = require('moment');

const DATE_FORMAT = 'DDMMYYYYHHmm';

const WSEvent = require('../wsevent.js');
const {
    sendEvent,
    deleteMessage
} = require('../tlgrm.js');

const assert = require('assert');

const URL_EVENTS = 'https://codeload.github.com/web-standards-ru/calendar/zip/master';

describe('WSEvent', () => {
    before(function (done) {
        this.timeout(60000);
        this.eventFiles = {};
        this.msgs = {};

        https.get(URL_EVENTS, response => {
            response.pipe(unzipper.Parse())
                .on('entry', entry => {
                    if (/calendar-master\/events\/.+/.test(entry.path)) {
                        const chunks = [];

                        entry.on('data', chunk => chunks.push(chunk))
                        entry.on('error', done)
                        entry.on('end', () => this.eventFiles[entry.path] = Buffer.concat(chunks).toString('utf8'));
                    } else {
                        entry.autodrain();
                    }
                })
                .on('finish', done);
        }).on('error', (err) => {
            done(err);
        });
    })

    it('#fromYaml()', function () {
        for (const fileName in this.eventFiles) {
            const data = this.eventFiles[fileName];

            console.log(data)

            const event = WSEvent.fromYaml(data);

            const yamlData = YAML.parse(data);

            const dateSplit = yamlData.date.split('-');
            const timeSplit = (yamlData.time || '00:00 23:59').split(/[ -]/);

            const timeFirst = timeSplit[0].split(':');
            if (timeFirst.length == 2) {
                if (timeFirst[0].length < 2) {
                    timeFirst[0] = `0${timeFirst[0]}`;
                } else if (timeFirst[0].length > 2) {
                    timeFirst[0] = '00';
                }
                if (timeFirst[1].length < 2) {
                    timeFirst[1] = `0${timeFirst[0]}`;
                } else if (timeFirst[1].length > 2) {
                    timeFirst[1] = '00';
                }
                timeSplit[0] = `${timeFirst[0]}${timeFirst[1]}`;
            }

            const timeSecond = timeSplit[0].split(':');
            if (timeSecond.length == 2) {
                if (timeSecond[0].length < 2) {
                    timeSecond[0] = `0${timeSecond[0]}`;
                } else if (timeSecond[0].length > 2) {
                    timeSecond[0] = '23';
                }
                if (timeSecond[1].length < 2) {
                    timeSecond[1] = `0${timeSecond[0]}`;
                } else if (timeSecond[1].length > 2) {
                    timeSecond[1] = '59';
                }
                timeSplit[1] = `${timeSecond[0]}${timeSecond[1]}`;
            }


            let start = moment.utc(`${dateSplit[0]} ${timeSplit[0] || '0000'}`.replace(/\D/g, ''), DATE_FORMAT).toDate();
            let finish = moment.utc(`${dateSplit[1] || dateSplit[0]} ${timeSplit[1] || '2359'}`.replace(/\D/g, ''), DATE_FORMAT).utc().toDate();

            assert.equal(event instanceof WSEvent, true);
            assert.equal(event.name, yamlData.name);
            assert.equal(event.city, yamlData.city);
            assert.equal(event.link, yamlData.link);
            assert.equal(event.start.valueOf(), start.valueOf());
            assert.equal(event.finish.valueOf(), finish.valueOf());
            assert.equal(event.finish > event.start, true);
        }
    });

    it('sendEvent()', async function () {
        if (!!!process.env.TOKEN) {
            throw new Error('Not set env TOKEN');
        }

        if (!!!process.env.CHANNEL) {
            throw new Error('Not set env CHANNEL');
        }

        for (const fileName in this.eventFiles) {
            const data = this.eventFiles[fileName];

            const event = WSEvent.fromYaml(data);

            const response = await sendEvent(event, process.env.TOKEN, process.env.CHANNEL, process.env.PROXY)

            const body = JSON.parse(response.body);
            assert.equal(response.status, 200);
            assert.ok(body.ok);
            this.msgs[body.result.message_id] = {
                text: body.text
            };
        }
    }).timeout(-1);

    it('deleteMessage()', async function () {
        for (const msgId in this.msgs) {
            const response = await deleteMessage(msgId, process.env.TOKEN, process.env.CHANNEL, process.env.PROXY)

            const body = JSON.parse(response.body);
            assert.equal(response.status, 200);
            assert.ok(body.ok);
        }
    }).timeout(-1);
});