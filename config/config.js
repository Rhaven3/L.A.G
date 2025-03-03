const { Client, GatewayIntentBits } = require('discord.js');

module.exports = {
	// Instance Client
	client: new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.MessageContent,
		],
		allowedMentions: { parse: [] },
		presence: { status: 'online' },
	}),

	// Initiative
	playerDataRange: 'Etat!A1:P17',
	buttonTime: 3_600_000,
	modalTime: 3_600_000,
	idSheetSpliter: ', ',
	numberTurnByPass: 1,
	defaultInitiative: -999,
	defaultName: 'Inconnu au bataillon',
	defaultState: ':x:',
};
