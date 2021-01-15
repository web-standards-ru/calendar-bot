#!/usr/bin/env node

'use strict';

const fs = require('fs');

const argv = require('yargs').argv;

const {
    sendEvent
} = require('./tlgrm');

const WSEvent = require('./wsevent');

const events = argv._.map((file) => {
    return sendEvent(WSEvent.fromYaml(fs.readFileSync(file, 'utf-8')), argv.token, argv.channel, argv.proxy);
});

if (events.length == 0) {
    console.error('Events is empty!');
    process.exit(0);
}

Promise.all(events)
    .then((results) => {
        if (!results.every((res) => {
                return res.status == 200;
            })) {
            console.error(results);
            return process.exit(2);
        }

        console.log(results);
        process.exit(0);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
