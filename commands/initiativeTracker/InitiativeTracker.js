const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { google } = require('googleapis');

const buttonTime = 3_600_000;
const modalTime = 3_600_00;
const idSheetSpliter = ', ';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('initiative')
		.setDescription('Créer un trackeur d\'initative')
		.addStringOption(option =>
			option.setName('idsheets')
				.setDescription('ajouté l\'id des fiches que vous souhaité utilisé, séparé d\'une virgule '),
		),
	async execute(interaction) {
		await interaction.deferReply();

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
			.setLabel('Ajouter un Statut')
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
			.setLabel('Ajouter un PJ')
			.setStyle(ButtonStyle.Success);

		const addPNJButton = new ButtonBuilder()
			.setCustomId('addPNJ')
			.setLabel('Ajouter un PNJ')
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
			time: buttonTime,
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
			time: buttonTime,
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
			time: buttonTime,
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
			  const getDataPlayer = await googleSheets.spreadsheets.values.get({
					auth,
					spreadsheetId: id,
					range: 'Etat!A1:P17',
			  });

			  playersPJ.push({
					initiative: getDataPlayer.data.values[16][15],
					name: getDataPlayer.data.values[0][0],
					healthState: getDataPlayer.data.values[2][0],
			  });
			}
			return playersPJ;
		}


		// Add PJ Button
		const addPJCollector = response.createMessageComponentCollector({
			filter: button => button.customId === 'addPJ',
			time: buttonTime,
		});

		addPJCollector.on('collect', async (button) => {
			const addPJModal = new ModalBuilder()
				.setCustomId('addPJModal')
				.setTitle('Ajouter un PJ');

			// text input
			PJInput = new TextInputBuilder()
				.setCustomId('idPJInput')
				.setLabel('L\'id des fiches de personnages [' + idSheetSpliter + ']')
				.setStyle(TextInputStyle.Paragraph)
				.setPlaceholder('idSheet1' + idSheetSpliter + 'idSheet2' + idSheetSpliter + '...')
				.setRequired(true);

			const actionRowModal = new ActionRowBuilder().addComponents(PJInput);
			addPJModal.addComponents(actionRowModal);

			await button.showModal(addPJModal);

			await button.awaitModalSubmit({
				filter: (interactionModal) => interactionModal.customId === 'addPNJModal',
				time: modalTime,
			})
				.then(async (interactionModal) => {
					console.log(`${interactionModal.customId} was submitted!`);

					players.push({
						initiative: '',
						name: '',
						healthState: '',
					});
					players.sort((a, b) => b.initiative - a.initiative);
					calculateTurnOrder();
					await interactionModal.deferUpdate();
					await interaction.editReply({
						content: turnOrderMessage,
						components: actionRowsMessageComponents,
						withResponse: true,
					});
				})
				.catch(err => console.log('no modal submit interaction was collected \n erreur: ' + err));
		});
		addPJCollector.on('end', (collected, reason) => {
			console.log(`addPJCollecteur terminé. Raisons: ${reason}`);
		});

		/*
		function addPlayerData(playerList, newPlayers) {
			*
		}
		*/


		// Add PNJ Button
		const addPNJCollector = response.createMessageComponentCollector({
			filter: button => button.customId === 'addPNJ',
			time: buttonTime,
		});

		addPNJCollector.on('collect', async (button) => {
			const addPNJModal = new ModalBuilder()
				.setCustomId('addPNJModal')
				.setTitle('Ajouter un PNJ');

			// text input
			PNJNameInput = new TextInputBuilder()
				.setCustomId('idPNJNameInput')
				.setLabel('Nom du PNJ')
				.setStyle(TextInputStyle.Short)
				.setPlaceholder('Bob')
				.setRequired(true);

			PNJInitInput = new TextInputBuilder()
				.setCustomId('idPNJInitInput')
				.setLabel('Son Initiative')
				.setStyle(TextInputStyle.Short)
				.setPlaceholder('69')
				.setRequired(true);

			const actionRowModal = new ActionRowBuilder().addComponents(PNJNameInput);
			const actionRowModal1 = new ActionRowBuilder().addComponents(PNJInitInput);
			addPNJModal.addComponents(actionRowModal, actionRowModal1);

			await button.showModal(addPNJModal);

			await button.awaitModalSubmit({
				filter: (interactionModal) => interactionModal.customId === 'addPNJModal',
				time: modalTime,
			})
				.then(async (interactionModal) => {
					console.log(`${interactionModal.customId} was submitted!
						initiative: ${interactionModal.fields.getTextInputValue('idPNJInitInput')}
						name: ${interactionModal.fields.getTextInputValue('idPNJNameInput')}`);

					players.push({
						initiative: interactionModal.fields.getTextInputValue('idPNJInitInput'),
						name: interactionModal.fields.getTextInputValue('idPNJNameInput'),
						healthState: '<:pnj_emoji:1336728073802092637>',
					});
					players.sort((a, b) => b.initiative - a.initiative);
					calculateTurnOrder();
					await interactionModal.deferUpdate();
					await interaction.editReply({
						content: turnOrderMessage,
						components: actionRowsMessageComponents,
						withResponse: true,
					});
				})
				.catch(err => console.log('no modal submit interaction was collected \n erreur: ' + err));
		});
		addPNJCollector.on('end', (collected, reason) => {
			console.log(`addPNJCollecteur terminé. Raisons: ${reason}`);
		});


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