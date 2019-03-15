"use strict";

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const WSEvent = require('../wsevent.js');

const assert = require('assert');

const testDir = path.join(__dirname, 'events');

describe('WSEvent', () => {
  describe('#fromYaml()', () => {
    //TODO: get events from github
    const files = fs.readdirSync(testDir).filter((file) => { return /\.ya?ml$/.test(file.toLowerCase()); });

    for(const file of files) {
        it(file, () => {
            const data = fs.readFileSync(path.join(testDir, file), 'utf-8');
            
            const event = WSEvent.fromYaml(data);     
            
            const yaml_data = YAML.parse(data);

            //TODO: check start - finish
            console.log(yaml_data.date, yaml_data.time);
            console.log(event.start, event.finish);

            assert.equal(event instanceof WSEvent, true);
            assert.equal(event.name, yaml_data.name);
            assert.equal(event.city, yaml_data.city);
            assert.equal(event.link, yaml_data.link);
        });
    }
  });
});