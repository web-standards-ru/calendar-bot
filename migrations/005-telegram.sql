--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE telegram
(
    event_id INTEGER,
    event_action_id INTEGER,
    created INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    link TEXT NOT NULL,
    start INTEGER NOT NULL,
    finish INTEGER NOT NULL,
    online BIT NOT NULL,
    markdown TEXT NOT NULL,
    message_id INTEGER NOT NULL,

    FOREIGN KEY(event_id) REFERENCES events(id),
    FOREIGN KEY(event_action_id) REFERENCES event_actions(id)
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE telegram;