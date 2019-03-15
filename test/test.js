"use strict";

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const unzip = require('unzip');
const https = require('https');

const WSEvent = require('../wsevent.js');

const assert = require('assert');

const testDir = path.join(__dirname, 'events');

const urlEvents = 'https://codeload.github.com/web-standards-ru/calendar/zip/master';
const fileEvents = path.join(testDir, 'master.zip');
if(!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir);
}

const eventsDir = path.join(testDir, 'calendar-master/events')

describe('WSEvent', () => {
  //download events yaml from github 
  before( function(done){
    const file = fs.createWriteStream(fileEvents);
    const request = https.get(urlEvents, (response) => {
      response.pipe(file);
      file.on('finish', function() {
        file.close(() => {
          fs.createReadStream(fileEvents).pipe(unzip.Extract({ path: testDir }))
          .on('close', () => {
            done();
          });
        });
      });
    });
  });

  describe('#fromYaml()', () => {
      const files = fs.readdirSync(eventsDir).filter((file) => { return /\.ya?ml$/.test(file.toLowerCase()); });
        
      for(const file of files) {
          it(file, () => {
              const data = fs.readFileSync(path.join(eventsDir, file), 'utf-8');
              
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
