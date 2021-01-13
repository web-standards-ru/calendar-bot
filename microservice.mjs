import './config.mjs';

import createServer from './server.mjs';

import { openDb } from './db.mjs';

/**
 * Создание БД и применение миграций.
 *
 */
async function createdDb() {
    const db = await openDb();
    await db.migrate();
    await db.close();
}

createdDb().finally(createServer);
