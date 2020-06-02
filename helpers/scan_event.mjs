import getEvents from '../helpers/get_events.mjs';

import {
    openDb,
    getEvent,
    EventStatus,
    postEvent,
    deleteEvent,
} from '../db.mjs';

import mdEvent from '../helpers/md_event.mjs';

import { sendMsg, removeMsg } from '../helpers/telegram.mjs';

import WSEvent from '../types/wsevent.mjs';

const ProcessEventStatus = {
    ok: 1,
    posted: 2,
    updated: 3,
};

async function processEvent(fileName, event, db) {
    if (typeof fileName != 'string' || !fileName) {
        throw new TypeError(fileName);
    }

    if (!(event instanceof WSEvent)) {
        throw new TypeError(event);
    }

    const markdown = mdEvent(event);

    const { action, messageId } = await getEvent(fileName, event, markdown, db);

    if (action == EventStatus.ok) {
        return ProcessEventStatus.ok;
    }

    if (action == EventStatus.notFound || action == EventStatus.needPost) {
        const { status, body } = await sendMsg(markdown);
        if (status != 200) {
            throw new Error(
                `Error send msg ${status} / ${JSON.stringify(body)}`,
            );
        }
        await postEvent(fileName, event, markdown, body.result.message_id, db);
        return ProcessEventStatus.posted;
    }

    if (action == EventStatus.needUpdate) {
        const resRemove = await removeMsg(messageId);
        if (resRemove.status == 200) {
            await deleteEvent(fileName, event, markdown, messageId, db);
        } else {
            console.warn(
                `Error remove msg ${messageId}: ${status} / ${JSON.stringify(
                    body,
                )}`,
            );
        }

        const { status, body } = await sendMsg(markdown);
        if (status != 200) {
            throw new Error(
                `Error send msg ${status} / ${JSON.stringify(body)}`,
            );
        }
        await postEvent(fileName, event, markdown, body.result.message_id, db);
        return ProcessEventStatus.updated;
    }
}

export default async function () {
    const events = await getEvents();

    let posted = 0;
    let ok = 0;
    let updated = 0;

    const fileNames = Object.keys(events).sort(
        (e1, e2) => events[e1].start.valueOf() - events[e2].start.valueOf(),
    );

    const db = await openDb();

    try {
        for (const fileName of fileNames) {
            const result = await processEvent(fileName, events[fileName]);
            if (result == ProcessEventStatus.ok) {
                console.log(`Event ${fileName} ok`);
                ok += 1;
            } else if (result == ProcessEventStatus.posted) {
                console.log(`Event ${fileName} posted`);
                posted += 1;
            } else if (result == ProcessEventStatus.updated) {
                console.log(`Event ${fileName} updated`);
                updated += 1;
            } else {
                throw new TypeError(`Unknow result ${result}`);
            }
        }
    } finally {
        await db.close();
    }

    return {
        events: {
            all: fileNames.length,
            posted,
            ok,
            updated,
        },
    };
}
