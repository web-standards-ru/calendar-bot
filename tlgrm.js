"use strict";

const https = require('https');
const url = require('url');
const moment = require('moment');
const SocksProxyAgent = require('socks-proxy-agent');

const WSEvent = require('./wsevent.js');

/**
 * Отправка события в телеграм канал
 * @param {WSEvent} event событие
 * @param {string} token токен бота
 * @param {string} channel идентификатор канала
 * @param {string} [proxy=null] url прокси
 * @param {requestCallback} [stringifyMsg=null] конвертация события в строку, которая будет отправлена в канал
 * @param {boolean} [disable_web_page_preview=true] disable_web_page_preview / отключение сниппетов
 * @param {string} [proxy='markdown'] parse_mode тип сообщения
 * @returns {Promise} результат http запроса {status: number, body: string}
 */
const sendEvent = (event, token, channel, proxy = null, stringifyMsg = null, disable_web_page_preview = true, parse_mode = 'markdown') => {
    return new Promise((resolve, reject) => {
        if (!(event instanceof WSEvent)) {
            return reject(TypeError('event must be WSEvent'))
        }

        if (!(typeof token == 'string' && !!token)) {
            return reject(TypeError('bot token not set'))
        }

        if (!(typeof channel == 'string' && !!channel)) {
            return reject(TypeError('bot channel not set'))
        }

        moment.locale('ru');
        const msg = encodeURIComponent(typeof stringifyMsg == 'function' ?
            stringifyMsg(event) :
            `[${event.name}${event.isOnline ? ' (онлайн)' : ''}](${event.link})\n${event.city}, ${moment(event.start).utc().format('DD MMMM YYYY')}`);
        const endpoint = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${channel}&text=${msg}&parse_mode=${parse_mode}&disable_web_page_preview=${disable_web_page_preview ? 'True' : 'False'}`;
        const opts = url.parse(endpoint);

        if (!!proxy) {
            const agent = new SocksProxyAgent(proxy);
            opts.agent = agent;
        }

        https.get(opts, (res) => {
                let body = '';
                res.on('data', function (chunk) {
                    body += chunk;
                });
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        body: body
                    });
                });
            })
            .on('error', reject);
    });
};

/**
 * Удаление сообщения из телеграм канала
 * @param {number} msgId id сообщения
 * @param {string} token токен бота
 * @param {string} channel идентификатор канала
 * @param {string} [proxy=null] url прокси
 * @returns {Promise} результат http запроса {status: number, body: string}
 */
const deleteMessage = (msgId, token, channel, proxy = null) => {
    return new Promise((resolve, reject) => {
        if (!(typeof token == 'string' && !!token)) {
            return reject(TypeError('bot token not set'))
        }

        if (!(typeof channel == 'string' && !!channel)) {
            return reject(TypeError('bot channel not set'))
        }

        if (typeof msgId != 'number') {
            return reject(TypeError('msgId error'))
        }

        const endpoint = `https://api.telegram.org/bot${token}/deleteMessage?chat_id=${channel}&message_id=${msgId}`;
        const opts = url.parse(endpoint);

        if (!!proxy) {
            const agent = new SocksProxyAgent(proxy);
            opts.agent = agent;
        }

        https.get(opts, (res) => {
                let body = '';
                res.on('data', function (chunk) {
                    body += chunk;
                });
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        body: body
                    });
                });
            })
            .on('error', reject);
    });
};


module.exports.sendEvent = sendEvent;
module.exports.deleteMessage = deleteMessage;
