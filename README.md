# Бот для календаря событий

Публикует свежие события [из календаря](https://github.com/web-standards-ru/calendar) в чат [@webstandards_events](https://t.me/webstandards_events) в Телеграме.

## Установка

```bash
npm install --save @web-standards-ru/calendar-bot
```

## Использование

### В скрипте

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

### В командной строке

```bash
node . --token=111 --channel=@wsdc_test --proxy=socks://127.0.0.1:9050 events/2016-11-24-moscowjs1.yml events/2016-11-24-moscowjs2.yml
```

Без установки

```bash
npx github:web-standards-ru/calendar-bot --token=111 --channel=@wsdc_test --proxy=socks://127.0.0.1:9050 events/2016-11-24-moscowjs1.yml events/2016-11-24-moscowjs2.yml
```

Аргументы:

- `token` — токены бота
- `channel` — имя канала
- `proxy` — адрес прокси (если Телеграм заблокирован, опционально)
- все последние аргументы — пути к YAML-файлам событий

Коды ответов:

- `0` — успешно
- `1` — неуспешно
- `2` — HTTP-ответ не 200

## Тесты

Для запуска тестов:

```javascript
TOKEN='{bot_token}' CHANNEL='@{channel_name}' PROXY='{proxy_url}' npm run test
```

- `TOKEN` — токен бота в Телеграме
- `CHANNEL` — имя канала, например `@test_channel` (бот должен быть админом)
- `PROXY` — адрес прокси, например `socks://127.0.0.1:9050` для локального демона

## История версий

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
