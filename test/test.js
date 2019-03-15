"use strict";

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const unzip = require('unzip');
const https = require('https');
const moment = require('moment');

const DATE_FORMAT = 'DDMMYYYYHHmm';

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
  
              //console.log(yaml_data.date, yaml_data.time);
              //console.log(event.start, event.finish);

              const dateSplit = yaml_data.date.split('-');
              const timeSplit = (yaml_data.time || '00:00 23:59').split(/[ -]/);

              const timeFirst = timeSplit[0].split(':');
              if(timeFirst.length == 2) {
                  if(timeFirst[0].length < 2) {
                      timeFirst[0] = `0${timeFirst[0]}`;
                  }
                  else if(timeFirst[0].length > 2) {
                      timeFirst[0] = '00';
                  }
                  if(timeFirst[1].length < 2) {
                      timeFirst[1] = `0${timeFirst[0]}`;
                  }
                  else if(timeFirst[1].length > 2) {
                      timeFirst[1] = '00';
                  } 
                  timeSplit[0] = `${timeFirst[0]}${timeFirst[1]}`;
              }

              const timeSecond = timeSplit[0].split(':');
              if(timeSecond.length == 2) {
                  if(timeSecond[0].length < 2) {
                      timeSecond[0] = `0${timeSecond[0]}`;
                  }
                  else if(timeSecond[0].length > 2) {
                      timeSecond[0] = '23';
                  }
                  if(timeSecond[1].length < 2) {
                      timeSecond[1] = `0${timeSecond[0]}`;
                  }
                  else if(timeSecond[1].length > 2) {
                      timeSecond[1] = '59';
                  } 
                  timeSplit[1] = `${timeSecond[0]}${timeSecond[1]}`;
              }


              let start = moment.utc(`${dateSplit[0]} ${timeSplit[0] || '0000'}`.replace(/\D/g, ''), DATE_FORMAT).toDate();
              let finish = moment.utc(`${dateSplit[1] || dateSplit[0]} ${timeSplit[1] || '2359'}`.replace(/\D/g, ''), DATE_FORMAT).utc().toDate();

              console.log(yaml_data.date, yaml_data.time)
              console.log(start, `${dateSplit[0]} ${timeSplit[0] || '0000'}`);
              console.log(finish, `${dateSplit[1] || dateSplit[0]} ${timeSplit[1] || '2359'}`);
  
              assert.equal(event instanceof WSEvent, true);
              assert.equal(event.name, yaml_data.name);
              assert.equal(event.city, yaml_data.city);
              assert.equal(event.link, yaml_data.link);
              assert.equal(event.start.valueOf(), start.valueOf());
              assert.equal(event.finish.valueOf(), finish.valueOf());
              assert.equal(event.finish > event.start, true);
          });
      }
  });
});
