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
const WSEvent = require('@web-standards-ru/calendar-bot/wsevent.js');

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
node . --token=111 --channel=@wsdc_test --proxy=socks://127.0.0.1:9050 events/2016-11-24-moscowjs1.yml events/2016-11-24-moscowjs2.yml
```

Without install

```bash
npx github:web-standards-ru/calendar-bot --token=111 --channel=@wsdc_test --proxy=socks://127.0.0.1:9050 events/2016-11-24-moscowjs1.yml events/2016-11-24-moscowjs2.yml
```

Args:

- token - bots token
- channel - channel name
- proxy - url for proxy (for example Telegram blocker in you country), not necessarily
- all last args - paths for yaml event files

Returning code:

- 0 - successed
- 1 - sending exception
- 2 - not 200 http response code

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
- **1.0.0**:
    - add cli
- **1.0.1**:
    - cli as default
- **1.0.2**:
    - upd README
- **1.0.3**:
    - add bin in package
- **1.0.4**:
    - multi-send files
- **1.0.5**:
    - return 0 if events is empty

