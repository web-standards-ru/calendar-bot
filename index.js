"use strict";


const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const unzip = require('unzip');
const https = require('https');
const moment = require('moment');

const WSEvent = require('./wsevent.js');
const { sendEvent } = require('./tlgrm.js');

module.exports = (yaml, token, channel, proxy=null, stringifyMsg=null) => {
    return sendEvent(WSEvent.fromYaml(yaml), token, channel, proxy, stringifyMsg);
};
