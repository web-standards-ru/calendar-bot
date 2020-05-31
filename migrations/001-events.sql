--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE events
(
    id INTEGER PRIMARY KEY NOT NULL,
    file_name TEXT NOT NULL UNIQUE,
    created REAL NOT NULL DEFAULT (julianday('now')),
    updated REAL NOT NULL DEFAULT (julianday('now'))
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE events;