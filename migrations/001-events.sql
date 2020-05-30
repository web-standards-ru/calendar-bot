--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE events
(
    id INTEGER PRIMARY KEY NOT NULL,
    file_name TEXT NOT NULL UNIQUE,
    created INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    updated INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE events;