import '../config.mjs';

import assert from 'assert';
import https from 'https';
import unzipper from 'unzipper';

import uuid from 'uuidv4';
import YAML from 'yaml';
import moment from 'moment';

import chai from 'chai';
import chaiHttp from 'chai-http';
chai.use(chaiHttp);

import getEvents from '../helpers/get_events.mjs';
import { URL_EVENTS } from '../helpers/get_events.mjs';
import WSEvent from '../types/wsevent.mjs';
import { DATE_FORMAT } from '../types/wsevent.mjs';

import {
    openDb,
    getEvent,
    EventStatus,
    postEvent,
    deleteEvent,
} from '../db.mjs';

import mdEvent from '../helpers/md_event.mjs';

import { sendMsg, removeMsg } from '../helpers/telegram.mjs';

import createServer from '../server.mjs';

const { API_TOKEN } = process.env;

if (!API_TOKEN) {
    throw new Error('Not set env API_TOKEN');
}

describe('WSEvent', () => {
    before(function (done) {
        this.timeout(10000);
        this.eventFiles = {};
        this.msgs = {};

        https
            .get(URL_EVENTS, response => {
                response
                    .pipe(unzipper.Parse())
                    .on('entry', entry => {
                        if (/calendar-master\/events\/.+/.test(entry.path)) {
                            const chunks = [];

                            entry.on('data', chunk => chunks.push(chunk));
                            entry.on('error', done);
                            entry.on(
                                'end',
                                () =>
                                    (this.eventFiles[
                                        entry.path
                                    ] = Buffer.concat(chunks).toString('utf8')),
                            );
                        } else {
                            entry.autodrain();
                        }
                    })
                    .on('finish', done);
            })
            .on('error', done);
    });

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

            const start = moment
                .utc(
                    `${dateSplit[0]} ${timeSplit[0] || '0000'}`.replace(
                        /\D/g,
                        '',
                    ),
                    DATE_FORMAT,
                )
                .toDate();
            const finish = moment
                .utc(
                    `${dateSplit[1] || dateSplit[0]} ${
                        timeSplit[1] || '2359'
                    }`.replace(/\D/g, ''),
                    DATE_FORMAT,
                )
                .utc()
                .toDate();

            assert.equal(event instanceof WSEvent, true);
            assert.equal(event.name, yamlData.name);
            assert.equal(event.city, yamlData.city);
            assert.equal(event.link, yamlData.link || yamlData.url);
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
        assert.ok(
            Object.values(eventFiles).filter(
                event => !(event instanceof WSEvent),
            ).length == 0,
        );
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
        const { action } = await getEvent(
            this.eventFileName,
            this.event,
            this.eventMD,
            this.db,
        );
        assert.equal(action, EventStatus.notFound);
    });

    it('post', async function () {
        await postEvent(
            this.eventFileName,
            this.event,
            this.eventMD,
            this.msgId,
            this.db,
        );
        const { action } = await getEvent(
            this.eventFileName,
            this.event,
            this.eventMD,
            this.db,
        );
        assert.equal(action, EventStatus.ok);
    });

    it('get changed', async function () {
        const { action, messageId } = await getEvent(
            this.eventFileName,
            this.event,
            this.eventMDUpdate,
            this.db,
        );
        assert.equal(action, EventStatus.needUpdate);
        assert.equal(typeof messageId, 'number');
    });

    it('delete', async function () {
        await deleteEvent(
            this.eventFileName,
            this.event,
            this.eventMDUpdate,
            this.msgId,
            this.db,
        );
        const { action } = await getEvent(
            this.eventFileName,
            this.event,
            this.eventMDUpdate,
            this.db,
        );
        assert.equal(action, EventStatus.needPost);
    });

    it('post changed', async function () {
        await postEvent(
            this.eventFileName,
            this.event,
            this.eventMDUpdate,
            this.msgId,
            this.db,
        );
        const { action } = await getEvent(
            this.eventFileName,
            this.event,
            this.eventMDUpdate,
            this.db,
        );
        assert.equal(action, EventStatus.ok);
    });

    it('get not changed', async function () {
        const { action } = await getEvent(
            this.eventFileName,
            this.event,
            this.eventMDUpdate,
            this.db,
        );
        assert.equal(action, EventStatus.ok);
    });

    it('get changed', async function () {
        const { action } = await getEvent(
            this.eventFileName,
            this.event,
            this.eventMD,
            this.db,
        );
        assert.equal(action, EventStatus.needUpdate);
    });
});

describe('Telegram API', () => {
    before(async function () {
        this.eventText = `
name: test
date: 01.01.2020
city: Москва
link: https://test.dev/
        `;
        this.event = WSEvent.fromYaml(this.eventText);
        this.eventMD = mdEvent(this.event);
    });

    it('send', async function () {
        const { status, body } = await sendMsg(this.eventMD);
        assert.equal(status, 200);
        assert.ok(body.ok);
        this.messageId = body.result.message_id;
        assert.equal(typeof this.messageId, 'number');
    });

    it('delete', async function () {
        const { status, body } = await removeMsg(this.messageId);
        assert.equal(status, 200);
        assert.ok(body.ok);
    });

    it('many request 100', async function () {
        this.timeout(-1);
        for (let i = 0; i < 100; ++i) {
            const resSend = await sendMsg(this.eventMD);
            assert.equal(resSend.status, 200);
            assert.ok(resSend.body.ok);
            const msgId = resSend.body.result.message_id;
            assert.equal(typeof msgId, 'number');

            const resRemove = await removeMsg(msgId);
            assert.equal(resRemove.status, 200);
            assert.ok(resRemove.body.ok);
        }
    });
});

describe('Microservice', function () {
    before(async function () {
        const { app, server } = createServer();

        this.app = app;
        this.server = server;

        const db = await openDb();
        await db.migrate();
        await db.close();
    });

    after(function () {
        this.server.close();
    });

    describe('API', () => {
        it('error token', done => {
            chai.request(this.app)
                .get(`/?token=${API_TOKEN}1`)
                .end((err, res) => {
                    assert.equal(res.status, 400);
                    done(err);
                });
        });

        it('first request', function (done) {
            this.timeout(-1);

            chai.request(this.app)
                .get(`/?token=${API_TOKEN}`)
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.equal(res.body.events.posted, res.body.events.all);
                    assert.equal(res.body.events.ok, 0);
                    assert.equal(res.body.events.updated, 0);
                    assert.equal(
                        res.body.events.ok +
                            res.body.events.posted +
                            res.body.events.updated,
                        res.body.events.all,
                    );
                    done(err);
                });
        });

        it('repeat request', function (done) {
            this.timeout(20000);

            chai.request(this.app)
                .get(`/?token=${API_TOKEN}`)
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.equal(res.body.events.posted, 0);
                    assert.equal(res.body.events.updated, 0);
                    assert.equal(res.body.events.ok, res.body.events.all);
                    assert.equal(
                        res.body.events.ok +
                            res.body.events.posted +
                            res.body.events.updated,
                        res.body.events.all,
                    );
                    done(err);
                });
        });
    });
});
