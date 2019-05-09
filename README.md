calendar-bot
Telegram bot for web-standards-ru-calendar

## Instaling

```bash
npm i -S @web-standards-ru/calendar-bot
```

## Usage

### In script
```javascript
const moment = require('moment');

const sendToChannel = require('@web-standards-ru/calendar-bot/tlgrm.js');
const WSEvent = require('@web-standards-ru/calendar-bot//wsevent.js');

sendToChannel(WSEvent.fromYaml(`name: Яндекс Субботник
date: 10.12.2016
city: Москва
link: https://events.yandex.ru/events/yasubbotnik/10-dec-2016/
`), 'token', 'channel', 'proxy', (event) => {
    //this is a default value when this function is not set
    moment.locale('ru');
    return `[${event.name}](${event.link})\n${event.city}, ${moment(event.start).utc().format('DD MMMM YYYY')}`);
})
    .then((res) => {
        const { status, body } = res;
        //check status == 200
    })
    .catch((err) => {
        console.warn(err);
    });

```

### As cli

```bash
npx . --file=events/2016-11-24-moscowjs.yml --token=111 --channel=@wsdc_test --proxy=socks://127.0.0.1:9050
```

Args:

- file - path fot yaml event file
- token - bots token
- channel - channel name
- proxy - url for proxy (for example Telegram blocker in you country), not necessarily
Returning code is 0 for successed.
"use strict";

## Tests

For test run

```javascript
TOKEN='{bot_token}' CHANNEL='@{channel_name}' PROXY='{proxy_url}' npm run test
```

- *TOKEN* - token telegrams bost
- *CHANNEL* - channel name, for e.g. @test_channel (telegram bot must be a an administrator)
- *PROXY* - proxy url, for e.g. socks://127.0.0.1:9050 for a local tor daemon

## Versions

- **0.0.1**
- **0.0.2**:
    - fix date to utc
- **0.0.3**:
    - add deleteMessage()
- **0.0.4**:
    - add standalone script

