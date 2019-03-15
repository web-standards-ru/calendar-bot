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
        const timeSplit = (yaml_data.time || '00:00 23:59').split(' ');

        let start = moment.utc(`${dateSplit[0]} ${timeSplit[0] || '0000'}`.replace(/\D/g, ''), DATE_FORMAT).toDate();
        let finish = moment.utc(`${dateSplit[1] || dateSplit[0]} ${timeSplit[1] || '2359'}`.replace(/\D/g, ''), DATE_FORMAT).utc().toDate();

        return new WSEvent(yaml_data.name, yaml_data.city, yaml_data.link, start, finish);
    }

}

module.exports = WSEvent;
