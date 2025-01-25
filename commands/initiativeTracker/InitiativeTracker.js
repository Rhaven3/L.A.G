const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { google } = require('googleapis');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('initiative')
		.setDescription('Créer un trackeur d\'initative')
		.addStringOption(option =>
			option.setName('idsheets')
				.setDescription('ajouté l\'id des fiches que vous souhaité utilisé, séparé d\'une virgule ')
				.setRequired(true),
		),
	async execute(interaction) {
		await interaction.deferReply();

		// *************  Players Exemple (API Sheet pas encore fonctionnell)
		// ****************************************************************
		/*
		const players = [
			{ initiative: 14, name: 'Player 1', healthState: '', passTurnFlag: false, passTurnNumber: 0 },
			{ initiative: 7, name: 'Player 2', healthState: '', passTurnFlag: false, passTurnNumber: 0 },
			{ initiative: -41, name: 'Player 3', healthState: '', passTurnFlag: false, passTurnNumber: 0 },
			{ initiative: 32, name: 'Player 4', healthState: '', passTurnFlag: false, passTurnNumber: 0 },
		];
		players.sort((a, b) => b.initiative - a.initiative);
		*/
		// ****************************************************************
		const buttonTimeInteraction = 3_600_000;
		let currentTurn = 0;
		let turnOrderMessage = '';
		let turnNumber = 1;

		// API SHEET
		const auth = new google.auth.GoogleAuth({
			keyFile: 'project-it-credentials.json',
			scopes: 'https://www.googleapis.com/auth/spreadsheets',
		});
		const client = await auth.getClient();
		// Instance sheet API
		const googleSheets = google.sheets({ version: 'v4', auth: client });

		// récup fiche
		const players = await retrievePlayerData();
		players.sort((a, b) => b.initiative - a.initiative);
		calculateTurnOrder();

		// action rows
		const nextTurnButton = new ButtonBuilder()
			.setCustomId('nextTurn')
			.setLabel('Next')
			.setStyle(ButtonStyle.Success);

		const precTurnButton = new ButtonBuilder()
			.setCustomId('precTurn')
			.setLabel('Prec')
			.setStyle(ButtonStyle.Secondary);

		const passTurnButton = new ButtonBuilder()
			.setCustomId('passTurn')
			.setLabel('Pass')
			.setStyle(ButtonStyle.Primary);

		const row = new ActionRowBuilder()
			.addComponents(precTurnButton, passTurnButton, nextTurnButton);


		// Affichage du Turn Order + Button
		const response = await interaction.editReply({
			content: turnOrderMessage,
			components: [row],
			withResponse: true,
		});


		// Button Next
		const NextCollector = response.createMessageComponentCollector({
			filter: button => button.customId === 'nextTurn',
			time: buttonTimeInteraction,
		});

		NextCollector.on('collect', async (button) => {
			await button.deferUpdate();

			nextTurn();
			calculateTurnOrder();
			await interaction.editReply({
				content: turnOrderMessage,
				components: [row],
				withResponse: true,
			});
		});
		NextCollector.on('end', (collected, reason) => {
			if (reason === 'time') {
				interaction.followUp({ content: 'Le temps est écoulé, plus de réponses.', components: [] });
			}
			console.log(`NextCollecteur terminé. Raisons: ${reason}`);
		});

		function nextTurn() {

			if (currentTurn == players.length - 1) {
				turnNumber++;
				currentTurn = 0;
			} else {
				currentTurn++;
			}
		}

		// Button Prec
		const PrecCollector = response.createMessageComponentCollector({
			filter: button => button.customId === 'precTurn',
			time: buttonTimeInteraction,
		});

		PrecCollector.on('collect', async (button) => {
			await button.deferUpdate();

			precTurn();
			calculateTurnOrder();
			await interaction.editReply({
				content: turnOrderMessage,
				components: [row],
				withResponse: true,
			});
		});
		PrecCollector.on('end', (collected, reason) => {
			console.log(`PrecCollecteur terminé. Raisons: ${reason}`);
		});

		function precTurn() {
			if (currentTurn == 0) {
				turnNumber--;
				currentTurn = players.length - 1;
			} else {
				currentTurn--;
			}
		}


		// Button Pass
		const PassCollector = response.createMessageComponentCollector({
			filter: button => button.customId === 'passTurn',
			time: buttonTimeInteraction,
		});

		PassCollector.on('collect', async (button) => {
			await button.deferUpdate();

			passTurn();
			calculateTurnOrder();
			await interaction.editReply({
				content: turnOrderMessage,
				components: [row],
				withResponse: true,
			});
		});
		PassCollector.on('end', (collected, reason) => {
			console.log(`PassCollecteur terminé. Raisons: ${reason}`);
		});

		function passTurn() {
			for (const player of players) {
				if (players.indexOf(player) == currentTurn) {
					player.passTurnFlag = true;
					player.passTurnNumber = turnNumber;
				}
			}
			nextTurn();
		}

		async function retrievePlayerData() {
			let players = [];
			const playersId = interaction.options.getString('idsheets').split(',');

			for (const id of playersId) {
			  const getInit = await googleSheets.spreadsheets.values.get({
					auth,
					spreadsheetId: id,
					range: 'Etat!P17',
			  });
			  const getName = await googleSheets.spreadsheets.values.get({
					auth,
					spreadsheetId: id,
					range: 'Etat!A1',
			  });
			  const getHealth = await googleSheets.spreadsheets.values.get({
					auth,
					spreadsheetId: id,
					range: 'Etat!A3',
			  });

			  players.push({
					initiative: getInit.data.values[0][0],
					name: getName.data.values[0][0],
					healthState: getHealth.data.values[0][0],
			  });
			}
			return players;
		  }

		function calculateTurnOrder() {
			turnOrderMessage = `__Tour ${turnNumber}:__\n`;
			for (const player of players) {
				if (players.indexOf(player) == currentTurn) {
					turnOrderMessage += ':star: ';
					if (player.passTurnNumber + 1 == turnNumber && player.passTurnFlag) player.passTurnFlag = false;

				} else if (player.passTurnFlag) {
					turnOrderMessage += ':diamond_shape_with_a_dot_inside: ';

				} else {
					turnOrderMessage += '- ' ;
				}
				turnOrderMessage += `**${player.name}** \`\`[ ${player.initiative} ]\`\` *${player.healthState}* \n`;
			}
		}

	},
};