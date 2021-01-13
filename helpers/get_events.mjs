import https from 'https';
import unzipper from 'unzipper';

import WSEvent from '../types/wsevent.mjs';

export const URL_EVENTS =
    'https://codeload.github.com/web-standards-ru/calendar/zip/master';

/**
 * Получени списка событий из master ветки репозитория web-standards-ru/calendar на github.
 *
 * @returns {{ filename: WSEvent }} - События.
 */
export default function () {
    return new Promise((resolve, reject) => {
        const eventFiles = {};
        https
            .get(URL_EVENTS, response => {
                response
                    .pipe(unzipper.Parse())
                    .on('entry', entry => {
                        if (/calendar-master\/events\/.+/.test(entry.path)) {
                            const chunks = [];

                            entry.on('data', chunk => chunks.push(chunk));
                            entry.on('error', reject);
                            entry.on(
                                'end',
                                () =>
                                    (eventFiles[entry.path] = WSEvent.fromYaml(
                                        Buffer.concat(chunks).toString('utf8'),
                                    )),
                            );
                        } else {
                            entry.autodrain();
                        }
                    })
                    .on('finish', () => resolve(eventFiles));
            })
            .on('error', reject);
    });
}
