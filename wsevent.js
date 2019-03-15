"use strict";

const YAML = require('yaml');
const moment = require('moment');

const DATE_FORMAT = 'DDMMYYYYHHmm';

class WSEvent {
    constructor(name, city, link, start, finish) {
        this._name = name;
        this._city = city;
        this._link = link;
        this._start = start;
        this._finish = finish;

        if(this._finish <= this._start) {
            throw new Error('Finish <= start');
        }
    }

    get name() {
        return this._name;
    }

    get city() {
        return this._city;
    }

    get link() {
        return this._link;
    }

    get start() {
        return this._start;
    }

    get finish() {
        return this._finish;
    }

    static fromYaml(yaml) {
        const yaml_data = YAML.parse(yaml);
        
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

        return new WSEvent(yaml_data.name, yaml_data.city, yaml_data.link, start, finish);
    }

}

module.exports = WSEvent;
