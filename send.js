'use strict';

const fs = require('fs');

const argv = require('yargs').argv;

const {sendEvent} = require('./tlgrm');

const WSEvent = require('./wsevent');

sendEvent(WSEvent.fromYaml(fs.readFileSync(argv.file, 'utf-8')), argv.token, argv.channel, argv.proxy)
    .then((res) => {
        if(res.code != 200) {
            console.error(res);
            return process.exit(2);
        }

        console.log(res);
        process.exit(0);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });