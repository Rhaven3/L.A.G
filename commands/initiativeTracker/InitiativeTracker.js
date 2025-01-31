const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { google } = require('googleapis');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('initiative')
		.setDescription('Créer un trackeur d\'initative')
		.addStringOption(option =>
			option.setName('idsheets')
				.setDescription('ajouté l\'id des fiches que vous souhaité utilisé, séparé d\'une virgule ')
				.setPlaceholder('idSheet1' + idSheetSpliter + 'idSheet2' + idSheetSpliter + '...')
				.setRequired(true),
		),
	async execute(interaction) {
		await interaction.deferReply();

		const buttonTimeInteraction = 3_600_000;
		const idSheetSpliter = ', ';
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

		// action rows Turn
		const nextTurnButton = new ButtonBuilder()
			.setCustomId('nextTurn')
			.setLabel('Next')
			.setStyle(ButtonStyle.Secondary)
			.setEmoji('➡️');

		const precTurnButton = new ButtonBuilder()
			.setCustomId('precTurn')
			.setLabel('Prec')
			.setStyle(ButtonStyle.Secondary)
			.setEmoji('⬅️');

		const passTurnButton = new ButtonBuilder()
			.setCustomId('passTurn')
			.setLabel('Pass')
			.setStyle(ButtonStyle.Secondary)
			.setEmoji('💠');


		const row = new ActionRowBuilder()
			.addComponents(precTurnButton, passTurnButton, nextTurnButton);

		// action rows Select

		const selectPlayer = new StringSelectMenuBuilder()
			.setCustomId('selectPlayer')
			.setPlaceholder('Choisit un personnage');

		populateStringSelect(selectPlayer);

		const rowSelect = new ActionRowBuilder()
			.addComponents(selectPlayer);

		// action rows Button Select
		const addStateButton = new ButtonBuilder()
			.setCustomId('addState')
			.setLabel('Ajouté un Statut')
			.setStyle(ButtonStyle.Danger);

		const takenTurnButton = new ButtonBuilder()
			.setCustomId('takenTurn')
			.setLabel('Tour Pris !')
			.setStyle(ButtonStyle.Primary);


		const rowButtonSelect = new ActionRowBuilder()
			.addComponents(addStateButton, takenTurnButton);

		// action rows Add
		const addPJButton = new ButtonBuilder()
			.setCustomId('addPJ')
			.setLabel('Ajouté un PJ')
			.setStyle(ButtonStyle.Success);

		const addPNJButton = new ButtonBuilder()
			.setCustomId('addPNJ')
			.setLabel('Ajouté un PNJ')
			.setStyle(ButtonStyle.Success);

		const rowButtonAdd = new ActionRowBuilder()
			.addComponents(addPJButton, addPNJButton);

		// Affichage du Turn Order + Button

		const actionRowsMessageComponents = [row, rowButtonAdd, rowSelect, rowButtonSelect];

		const response = await interaction.editReply({
			content: turnOrderMessage,
			components: actionRowsMessageComponents,
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
				components: actionRowsMessageComponents,
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
				components: actionRowsMessageComponents,
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
				components: actionRowsMessageComponents,
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
			const playersPJ = [];
			const playersId = interaction.options.getString('idsheets').split(idSheetSpliter);

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

			  playersPJ.push({
					initiative: getInit.data.values[0][0],
					name: getName.data.values[0][0],
					healthState: getHealth.data.values[0][0],
			  });
			}
			return playersPJ;
		}


		// Add PJ Button
		const addPJCollector = response.createMessageComponentCollector({
			filter: button => button.customId === 'passTurn',
			time: buttonTimeInteraction,
		});

		addPJCollector.on('collect', async (button) => {
			await interaction.shoModal(addPJModal);
		});
		addPJCollector.on('end', (collected, reason) => {
			console.log(`addPJCollecteur terminé. Raisons: ${reason}`);
		});

		/*
		* A MODIFIER !!!
		* Les modal sont une interaction et un event appart entière !
		* à voir
		*/
		// Modal Response
		const addPJModal = new ModalBuilder()
			.setCustomId('addPJModal')
			.setTitle('Ajouter un PJ');

		// text input
		idPJInput = new TextInputBuilder()
			.setCustomId('idPJInput')
			.setLabel('L\'id des fiches de personnages que vous voulez rajouter [, ]')
			.setStyle(TextInputStyle.Paragraph)
			.setPlaceholder('idSheet1' + idSheetSpliter + 'idSheet2' + idSheetSpliter + '...')
			.setRequired(true);

		const actionRowModal = ActionRowBuilder().addComponents(idPJInput);
		addPJModal.addComponents(actionRowModal);


		function calculateTurnOrder() {
			turnOrderMessage = `## __Tour ${turnNumber} :__\n`;
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

		function populateStringSelect(stringSelect) {
			for (const player of players) {
				stringSelect.addOptions(new StringSelectMenuOptionBuilder()
					.setLabel(`${player.name}`)
					.setValue(`${player.name}`));
			};
		}

	},
};