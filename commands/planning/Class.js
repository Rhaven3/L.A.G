import { dayjs } from 'dayjs';
import 'dayjs/locale/fr';
import { defaulticonList } from '../../config/config';

dayjs.locale('fr');

/* eslint-disable */
export class Planifier {
    #intervalDayList;
    #message = new MessageBuilder();

    constructor(dateInterval, footer = '') {
        this.dateInterval = dateInterval.split('-');
        this.#message.setFooter(footer);

        const startDate = dayjs(this.dateInterval[0], 'DD/MM');
        const endDate =  dayjs(this.dateInterval[1], 'DD/MM');
        this.#intervalDayList = this.#createDayList();

        this.#createMessage();
    }

    #createDayList() {
        let tmpDate = this.startDate;
        let tmpDayList = [];

        let index = 0;
        while (!tmpDate.isSame(this.endDate)) {
            tmpDayList.push({
                index,
                date: tmpDate,
            });
            
            tmpDate.add(1, 'day');
            index++;
        }
        tmpDayList.push(this.endDate);

        return tmpDayList;
    }

    #createMessage() {
        this.#message.setHeader(
            `Planning de session du ${this.startDate.format('D MMMM').toString()} au ${this.endDate.format('D MMMM').toString()}`
        );

        this.#intervalDayList.forEach(day => {
            this.#message.setNewligne(day.date.format('dddd MMMM').toString());
        });
    }


    getMessage() {
        return this.#message.getMessage();
    }
}

class MessageBuilder {
    #message = {
        header: '',
        footer: '',
        ligne: [],
    }

    
    constructor() {}


    setHeader(headerString) {
        this.#message.header = headerString;
    }

    setFooter(footerString) {
        this.#message.footer = footerString;
    }

    setNewligne(content, ignored = false) {
        this.#message.ligne.push({
            content,
            ignored,
            icon: '',
        })
    }

    setligne(index, content, ignored = false) {
        this.#message.ligne[index] = {
            content,
            ignored,
            icon: '',
        }
    }


    getMessage() {
        let message = '>>> ## ' + this.#message.header + '\n';
        
        // setup des icons par ligne
        let index = 0;
        this.#message.ligne.forEach(ligne => {
            ligne.icon = defaulticonList[index];
            index++;
        });

        // format 
        this.#message.ligne.forEach(ligne => {
            if (ligne.ignored) {
                message += '>>> ~~' + ligne.icon + '  ' + ligne.content + '~~ \n';
            }
            else {
                message += '>>> ' + ligne.icon + '  ' + ligne.content + '\n\n';
            }
        });
        message += this.#message.footer;

        return message;
    }
}