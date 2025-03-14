import { Client, GatewayIntentBits } from 'discord.js';

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    allowedMentions: { parse: [] },
    presence: { status: 'online' },
});

export const buttonTimeMilliSecond = 3_600_000;
export const modalTimeMilliSecond = 3_600_000;
export const idSheetSpliter = ', ';
export const numberTurnByPass = 1;
export const defaultInitiative = -999;
export const defaultName = 'Inconnu au bataillon';
export const defaultState = ':x:';
export const defaultSheetTtrpgType = 'Arcadia';

export const defaulticonList = [
    '', '', '', '', '', '', '',
    '', '', '', '', '', '', '',
    '', '', '', '', '', '', '',
    '', '', '', '', '', '', '',
];

