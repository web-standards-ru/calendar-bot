"use strict";


const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const unzip = require('unzip');
const https = require('https');
const moment = require('moment');

const WSEvent = require('./wsevent.js');
const { sendEvent } = require('./tlgrm.js');

/**
 * Отправка события в телеграм канал
 * @param {string} yaml yaml строка с событием
 * @param {string} token токен бота
 * @param {string} channel идентификатор канал
 * @param {string} [proxy=null] url прокси
 * @param {requestCallback} [stringifyMsg=null] конвертация события в строку, которая будет отправлена в канал
 * @returns {Promise} результат http запроса {status: number, body: string}
 */
module.exports = (yaml, token, channel, proxy=null, stringifyMsg=null) => {
    return sendEvent(WSEvent.fromYaml(yaml), token, channel, proxy, stringifyMsg);
};
