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
 * @param {string} channel идентификатор канал
 * @param {string} [proxy=null] url прокси
 * @param {requestCallback} [stringifyMsg=null] конвертация события в строку, которая будет отправлена в канал
 * @returns {Promise} результат http запроса {status: number, body: string}
 */
const sendEvent = (event, token, channel, proxy=null, stringifyMsg=null) => {
    return new Promise((resolve, reject) => {
        if(!(event instanceof WSEvent)) {
            return reject(TypeError('event must be WSEvent'))
        }

        if(!(typeof token == 'string' && !!token)) {
            return reject(TypeError('bot token not set'))
        }

        if(!(typeof channel == 'string' && !!channel)) {
            return reject(TypeError('bot channel not set'))
        }

        const msg = encodeURIComponent(typeof stringifyMsg == 'function' 
            ? stringifyMsg(event) 
                : `${event.name}\n\n${moment(event.start).utc().format("DD.MM.YYYY")}\n${event.city}\n${event.link}`);
        const endpoint = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${channel}&text=${msg}`;
        const opts = url.parse(endpoint);

        if(!!proxy) {
            const agent = new SocksProxyAgent(proxy);
            opts.agent = agent;
        }

        https.get(opts, (res) => {
            let body = '';
            res.on('data', function(chunk) {
                body += chunk;
            });
            res.on('end', () => {
               resolve({status: res.statusCode, body: body});
            });
        })
        .on('error', reject);
    });
};


module.exports.sendEvent = sendEvent;
