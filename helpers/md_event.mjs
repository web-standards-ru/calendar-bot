import moment from 'moment';

import WSEvent from "../types/wsevent.mjs";

export default function (event) {
    if (!(event instanceof WSEvent)) {
        throw new TypeError(event);
    }
    return `[${event.name}${event.isOnline ? ' (онлайн)' : ''}](${event.link})\n${event.city}, ${moment(event.start).utc().format('DD MMMM YYYY')}`;
}