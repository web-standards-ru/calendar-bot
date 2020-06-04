import fs from 'fs';

import yargs from 'yargs';

import { sendMsg } from './helpers/telegram.mjs';

import WSEvent from './types/wsevent.mjs';

/**
 * CLI-интерфейс.
 */
export default async function () {
    const events = yargs.argv._.map(file =>
        sendMsg(
            WSEvent.fromYaml(fs.readFileSync(file, 'utf-8')),
            yargs.argv.token,
            yargs.argv.channel,
            yargs.argv.proxy,
        ),
    );

    if (events.length == 0) {
        console.error('Events is empty!');
        process.exit(0);
    }

    try {
        const results = await Promise.all(events);
        if (!results.every(res => res.status == 200)) {
            console.error(results);
            process.exit(2);
        } else {
            console.log(results);
            process.exit(0);
        }
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
