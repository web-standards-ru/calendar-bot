import assert from "assert";
import https from 'https';
import unzipper from 'unzipper';

import uuid from 'uuidv4';
import YAML from 'yaml';
import moment from 'moment';

import getEvents from "../helpers/get_events.mjs";
import {
    URL_EVENTS
} from "../helpers/get_events.mjs";
import WSEvent from "../types/wsevent.mjs";
import {
    DATE_FORMAT
} from "../types/wsevent.mjs";

import {
    openDb,
    getEvent,
    EventStatus,
    postEvent,
    deleteEvent
} from "../db.mjs";

import mdEvent from "../helpers/md_event.mjs";

/describe('WSEvent', () => {
    before(function (done) {
        this.timeout(10000);
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
        }).on('error', done);
    })

    it('#fromYaml()', function () {
        for (const fileName in this.eventFiles) {
            const data = this.eventFiles[fileName];

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
            assert.equal(event.isOnline, yamlData.online || false);
        }
    });

});

describe('Github repo', async () => {
    it('get events', async function () {
        this.timeout(10000);
        const eventFiles = await getEvents();
        assert.equal(typeof eventFiles, 'object');
        assert.ok(Object.keys(eventFiles).length > 0);
        assert.ok(Object.values(eventFiles).filter(event => !(event instanceof WSEvent)).length == 0);
    });
});

describe('Db', () => {
    before(async function () {
        this.eventText = `
name: test
date: 01.01.2020
city: Москва
link: https://test.dev/
        `;
        this.eventFileName = 'test';
        this.event = WSEvent.fromYaml(this.eventText);
        this.eventMD = mdEvent(this.event);
        this.eventMDUpdate = `${this.eventMD} / update`;

        this.msgId = 1;

        this.db = await openDb(`/tmp/${uuid.uuid()}.db`);
        await this.db.migrate();
    });

    after(async function () {
        await this.db.close();
    });

    it('get uncreated', async function () {
        const {
            action
        } = await getEvent(this.eventFileName, this.event, this.eventMD, this.db);
        assert.equal(action, EventStatus.notFound);
    });

    it('post', async function () {
        await postEvent(this.eventFileName, this.event, this.eventMD, this.msgId, this.db);
        const {
            action
        } = await getEvent(this.eventFileName, this.event, this.eventMD, this.db);
        assert.equal(action, EventStatus.ok);
    });

    it('get changed', async function () {
        const {
            action,
            messageId
        } = await getEvent(this.eventFileName, this.event, this.eventMDUpdate, this.db);
        assert.equal(action, EventStatus.needUpdate);
        assert.equal(typeof messageId, 'number');
    });

    it('delete', async function () {
        await deleteEvent(this.eventFileName, this.event, this.eventMDUpdate, this.msgId, this.db);
        const {
            action
        } = await getEvent(this.eventFileName, this.event, this.eventMDUpdate, this.db);
        assert.equal(action, EventStatus.needPost);
    });

    it('post changed', async function () {
        await postEvent(this.eventFileName, this.event, this.eventMDUpdate, this.msgId, this.db);
        const {
            action
        } = await getEvent(this.eventFileName, this.event, this.eventMDUpdate, this.db);
        assert.equal(action, EventStatus.ok);
    });

    it('get not changed', async function () {
        const {
            action
        } = await getEvent(this.eventFileName, this.event, this.eventMDUpdate, this.db);
        assert.equal(action, EventStatus.ok);
    });

    it('get changed', async function () {
        const {
            action
        } = await getEvent(this.eventFileName, this.event, this.eventMD, this.db);
        assert.equal(action, EventStatus.needUpdate);
    });
});

/*
describe('WSEvent', () => {

    it('sendEvent()', async function () {
        if (!process.env.TOKEN) {
            throw new Error('Not set env TOKEN');
        }

        if (!process.env.CHANNEL) {
            throw new Error('Not set env CHANNEL');
        }

        const eventsToSend = Object.keys(this.eventFiles)
            .map(fileName => WSEvent.fromYaml(this.eventFiles[fileName]))
            .sort((le, re) => re.start.valueOf() - le.start.valueOf())
            .slice(0, 10);

        for (const event of eventsToSend) {
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
            const response = await deleteMessage(parseInt(msgId), process.env.TOKEN, process.env.CHANNEL, process.env.PROXY)

            const body = JSON.parse(response.body);
            assert.equal(response.status, 200);
            assert.ok(body.ok);
        }
    }).timeout(-1);
});*/