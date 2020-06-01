import sqlite3 from 'sqlite3';
import {
    open
} from 'sqlite';

import WSEvent from "./types/wsevent.mjs";

export const EventStatus = {
    ok: 1,
    notFound: 2,
    needPost: 3,
    needUpdate: 4
};

const {
    DB_BAME = '/var/lib/calendar_bot.db'
} = process.env;

export async function openDb(filename = DB_BAME) {
    return open({
        filename: filename,
        driver: sqlite3.Database
    })
}

export async function getEvent(fileName, event, markdown, db = null) {
    if (typeof fileName != 'string' || !!!fileName) {
        throw new TypeError(fileName);
    }

    if (!(event instanceof WSEvent)) {
        throw new TypeError(event);
    }

    if (typeof markdown != 'string' || !!!markdown) {
        throw new TypeError(markdown);
    }

    if (!!!db) {
        db = await openDb();
    }

    const rows = await db.all(`
select
    ea.name
    ,t.markdown
    ,t.message_id
    ,t.created
from
    events as e
    left outer join telegram as t on e.id = t.event_id
    left outer join event_actions as ea on ea.id = t.event_action_id
where 
    e.file_name = ?
order by
    t.created desc,
    t.id desc
limit 1;    
    `, fileName);

    if (rows.length == 0) {
        return {
            action: EventStatus.notFound
        }
    }

    if (rows[0].message_id === null) {
        return {
            action: EventStatus.needPost
        }
    }

    if (markdown === rows[0].markdown && rows[0].name == 'post') {
        return {
            action: EventStatus.ok
        }
    }

    if (markdown === rows[0].markdown && rows[0].name == 'delete') {
        return {
            action: EventStatus.needPost
        }
    }


    return {
        action: EventStatus.needUpdate,
        messageId: rows[0].message_id
    }
}

export async function postEvent(fileName, event, markdown, messageId, db = null) {
    if (typeof fileName != 'string' || !!!fileName) {
        throw new TypeError(fileName);
    }

    if (!(event instanceof WSEvent)) {
        throw new TypeError(event);
    }

    if (typeof markdown != 'string' || !!!markdown) {
        throw new TypeError(markdown);
    }

    if (typeof messageId != 'number') {
        throw new TypeError(markdown);
    }

    if (!!!db) {
        db = await openDb();
    }

    const {
        changes
    } = await db.run(`
insert into events (file_name)
values             (?)
ON CONFLICT(file_name) DO UPDATE SET
    updated = julianday('now');
`, fileName);

    if (changes !== 1) {
        throw new Error(`Error changes ${changes}`);
    }

    {
        const {
            changes
        } = await db.run(`
insert into telegram (
    event_id,
    event_action_id,
    name,
    city,
    link,
    start,
    finish,
    online,
    markdown,
    message_id)
values (
    (select id from events where file_name = ?),
    (select id from event_actions where name = 'post'),
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?
    );
`,
            fileName,
            event.name,
            event.city,
            event.link,
            event.start.valueOf(),
            event.finish.valueOf(),
            event.isOnline,
            markdown,
            messageId);

        if (changes !== 1) {
            throw new Error(`Error changes ${changes}`);
        }
    }
}

export async function deleteEvent(fileName, event, markdown, messageId, db = null) {
    if (typeof fileName != 'string' || !!!fileName) {
        throw new TypeError(fileName);
    }

    if (!(event instanceof WSEvent)) {
        throw new TypeError(event);
    }

    if (typeof markdown != 'string' || !!!markdown) {
        throw new TypeError(markdown);
    }

    if (typeof messageId != 'number') {
        throw new TypeError(markdown);
    }

    if (!!!db) {
        db = await openDb();
    }

    const {
        changes
    } = await db.run(`
insert into telegram (
    event_id,
    event_action_id,
    name,
    city,
    link,
    start,
    finish,
    online,
    markdown,
    message_id)
values (
    (select id from events where file_name = ?),
    (select id from event_actions where name = 'delete'),
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?
    );
`,
        fileName,
        event.name,
        event.city,
        event.link,
        event.start.valueOf(),
        event.finish.valueOf(),
        event.isOnline,
        markdown,
        messageId
    );

    if (changes !== 1) {
        throw new Error(`Error changes ${changes}`);
    }
};