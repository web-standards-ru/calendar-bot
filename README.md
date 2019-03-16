# web-standards-ru-calendar-telegram
Telegram bot for web-standards-ru-calendar

## Usage

```javascript
const moment = require('moment');

const sendToChannel = require('web-standards-ru-calendar-telegram');

sendToChannel(`name: Яндекс Субботник
date: 10.12.2016
city: Москва
link: https://events.yandex.ru/events/yasubbotnik/10-dec-2016/
`, 'token', 'channel', 'proxy', (event) => {
    //this is a default value when this function is not set
    return `${event.name}\n\n${moment(event.start).format("DD.MM.YYYY")}\n${event.city}\n${event.link}`;
})
    .then((res) => {
        const { status, body } = res;
        //check status == 200
    })
    .catch((err) => {
        console.warn(err);
    });

```

## Tests

For test run

```javascript
TOKEN='{bot_token}' CHANNEL='@{channel_name}' PROXY='{proxy_url}' npm run test
```

- *TOKEN* - token telegrams bost
- *CHANNEL* - channel name, for e.g. @test_channel (telegram bot must be a an administrator)
- *PROXY* - proxy url, for e.g. socks://127.0.0.1:9050 for a local tor daemon

## Versions

- *0.0.1*