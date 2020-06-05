import url from 'url';
import https from 'https';
import SocksProxyAgent from 'socks-proxy-agent';

const { TOKEN, CHANNEL, PROXY } = process.env;

if (!TOKEN) {
    throw new Error('Not set env TOKEN');
}

if (!CHANNEL) {
    throw new Error('Not set env CHANNEL');
}

if(PROXY) {
    console.log(`Proxy for requests: ${PROXY}`);
}
else {
    console.log('Proxy not set');
}

/**
 * HTTP запрос.
 *
 * @param {string} endpoint - URL.
 * @returns {{ status: number, body: object|string, headers: object }} - Результат запроса.
 */
function request(endpoint) {
    return new Promise((resolve, reject) => {
        const opts = url.parse(endpoint);

        if (PROXY) {
            opts.agent = new SocksProxyAgent(PROXY);
        }

        https
            .get(opts, res => {
                let body = '';
                res.on('data', chunk => (body += chunk));
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        body:
                            'content-type' in res.headers &&
                            res.headers['content-type'] === 'application/json'
                                ? JSON.parse(body)
                                : body,
                        headers: res.headers,
                    });
                });
            })
            .on('error', reject);
    });
}

/**
 * Отправка сообщения в telegram-канал.
 *
 * @param {string} markdown - Markdown описание события.
 * @param {boolean} [disableWebPagePreview=true]  - Параметр disable_web_page_preview.
 * @returns {{ status: number, body: object|string, headers: object }} - Результат запроса.
 */
async function send(markdown, disableWebPagePreview = true) {
    if (!(typeof markdown == 'string' && !!markdown)) {
        throw TypeError(`markdown ${markdown}`);
    }

    return await request(
        `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${CHANNEL}&text=${encodeURIComponent(
            markdown,
        )}&parse_mode=markdown&disable_web_page_preview=${
            disableWebPagePreview ? 'True' : 'False'
        }`,
    );
}

/**
 * Удаление сообщения из telegram-канала.
 *
 * @param {number} msgId - Id сообщения.
 * @returns {{ status: number, body: object|string, headers: object }} - Результат запроса.
 */
async function remove(msgId) {
    if (typeof msgId !== 'number') {
        throw TypeError(`msgId ${msgId}`);
    }

    return await request(
        `https://api.telegram.org/bot${TOKEN}/deleteMessage?chat_id=${CHANNEL}&message_id=${msgId}`,
    );
}

const sleep = delay => new Promise(resolve => setTimeout(resolve, delay));

const MAX_RETRY = 100;

/**
 * Декортатор, гарантирующий повторный запрос при 429 ответе.
 *
 * @param {Function} fn - Функция обработки запроса.
 * @returns {{ status: number, body: object|string, headers: object }} - Результат запроса.
 */
function retry(fn) {
    return async function () {
        for (let nTry = 0; nTry < MAX_RETRY; nTry++) {
            const res = await fn.apply(fn.prototype, arguments);
            if (res.status === 429) {
                await sleep(
                    'retry-after' in res.headers
                        ? parseInt(res.headers['retry-after']) * 1e3
                        : 100,
                );
                continue;
            }
            return res;
        }
    };
}

export const sendMsg = retry(send);
export const removeMsg = retry(remove);
