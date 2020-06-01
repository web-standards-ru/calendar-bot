import YAML from 'yaml';
import moment from 'moment';

export const DATE_FORMAT = 'DDMMYYYYHHmm';

/**
 * Класс, описывающий событие
 */
export default class WSEvent {
    /**
     * Конструктор WSEvent
     * @constructor
     * @param {string} name название события
     * @param {string} city город события
     * @param {string} link url на сайт о событии
     * @param {date} start начало события
     * @param {date} finish окончание события
     * @param {boolean} isOnline онлайн ли событие
     */
    constructor(name, city, link, start, finish, isOnline) {
        this._name = name;
        this._city = city;
        this._link = link;
        this._start = start;
        this._finish = finish;
        this._isOnline = isOnline;

        if (this._finish <= this._start) {
            throw new TypeError(`Finish ${this.finish} /  <= start ${this.start}`);
        }

        if(!!!this._city && !this.isOnline) {
            throw new TypeError(`Not set city`)
        }

        if(!!!this._link) {
            throw new TypeError(`Not set link`)
        }
    }

    /**
     * Название события
     * @returns {string} название события
     */
    get name() {
        return this._name;
    }

    /**
     * Город события
     * @returns {string} город события
     */
    get city() {
        return this._city;
    }

    /**
     * Url на сайт о событии
     * @returns {string} url на сайт о событии
     */
    get link() {
        return this._link;
    }

    /**
     * Начало события
     * @returns {date} начало события
     */
    get start() {
        return this._start;
    }

    /**
     * Окончание события
     * @returns {date} окончание события
     */
    get finish() {
        return this._finish;
    }

    /**
     * Онлайн ли событие
     * @returns {boolean} онлайн ли событие
     */
    get isOnline() {
        return this._isOnline;
    }

    /**
     * Создание WSEvent из yaml-строки
     * @static
     * @param {string} yaml yaml строка с событием
     * @returns {WSEvent} новое событие
     */
    static fromYaml(yaml) {
        const yamlData = YAML.parse(yaml);

        const dateSplit = yamlData.date.split('-');
        const timeSplit = (yamlData.time || '00:00 23:59').split(/[ -]/);
        const timeFirst = timeSplit[0].split(':');
        if (timeFirst.length == 2) {
            if (timeFirst[0].length < 2) {
                timeFirst[0] = `0${timeFirst[0]}`;
            } else if (timeFirst[0].length > 2) {
                timeFirst[0] = '00';
            }
            if (timeFirst[1].length < 2) {
                timeFirst[1] = `0${timeFirst[0]}`;
            } else if (timeFirst[1].length > 2) {
                timeFirst[1] = '00';
            }
            timeSplit[0] = `${timeFirst[0]}${timeFirst[1]}`;
        }

        const timeSecond = timeSplit[0].split(':');
        if (timeSecond.length == 2) {
            if (timeSecond[0].length < 2) {
                timeSecond[0] = `0${timeSecond[0]}`;
            } else if (timeSecond[0].length > 2) {
                timeSecond[0] = '23';
            }
            if (timeSecond[1].length < 2) {
                timeSecond[1] = `0${timeSecond[0]}`;
            } else if (timeSecond[1].length > 2) {
                timeSecond[1] = '59';
            }
            timeSplit[1] = `${timeSecond[0]}${timeSecond[1]}`;
        }

        const start = moment.utc(`${dateSplit[0]} ${timeSplit[0] || '0000'}`.replace(/\D/g, ''), DATE_FORMAT).toDate();
        const finish = moment.utc(`${dateSplit[1] || dateSplit[0]} ${timeSplit[1] || '2359'}`.replace(/\D/g, ''), DATE_FORMAT).utc().toDate();

        return new WSEvent(yamlData.name, yamlData.city, yamlData.link || yamlData.url, start, finish, yamlData.online || false);
    }
}