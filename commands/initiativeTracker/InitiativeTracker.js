const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { playerDataRange, buttonTime, modalTime, idSheetSpliter } = require('../config/config');
const { nextTurn, precTurn, passTurn } = require('./turnManager');
const { getPlayerData } = require('../utils/googleSheets');
const { createTurnButtons, createSelectPlayerMenu, createAddPlayerMenu } = require('./uiComponents');

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

		// Component Row
		const rowTurn = createTurnButtons();

		const selectPlayerMenu = createSelectPlayerMenu();
		const rowSelect = selectPlayerMenu.stringSelectRow;
		const rowButtonSelect = selectPlayerMenu.buttonSelectRow;

		const rowButtonAdd = createAddPlayerMenu();


		// récup fiche
		const players = await retrievePlayerData(interaction.options.getString('idsheets').split(idSheetSpliter));
		players.sort((a, b) => b.initiative - a.initiative);
		calculateTurnOrder();


		// Affichage du Turn Order + Button
		const actionRowsMessageComponents = [rowTurn, rowButtonAdd, rowSelect, rowButtonSelect];

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

			handleTurn('next');
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


		// Button Prec
		const PrecCollector = response.createMessageComponentCollector({
			filter: button => button.customId === 'precTurn',
			time: buttonTime,
		});

		PrecCollector.on('collect', async (button) => {
			await button.deferUpdate();

			handleTurn('prec');
			await interaction.editReply({
				content: turnOrderMessage,
				components: actionRowsMessageComponents,
				withResponse: true,
			});
		});
		PrecCollector.on('end', (collected, reason) => {
			console.log(`PrecCollecteur terminé. Raisons: ${reason}`);
		});


		// Button Pass
		const PassCollector = response.createMessageComponentCollector({
			filter: button => button.customId === 'passTurn',
			time: buttonTime,
		});

		PassCollector.on('collect', async (button) => {
			await button.deferUpdate();

			handleTurn('pass');
			await interaction.editReply({
				content: turnOrderMessage,
				components: actionRowsMessageComponents,
				withResponse: true,
			});
		});
		PassCollector.on('end', (collected, reason) => {
			console.log(`PassCollecteur terminé. Raisons: ${reason}`);
		});


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
				filter: (interactionModal) => interactionModal.customId === 'addPJModal',
				time: modalTime,
			})
				.then(async (interactionModal) => {
					console.log(`${interactionModal.customId} was submitted!`);
					const newPlayers = retrievePlayerData(interactionModal.fields.getTextInputValue('idPJInput').split(idSheetSpliter));

					players.push(...await newPlayers);
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

					const newPNJ = {
						initiative: interactionModal.fields.getTextInputValue('idPNJInitInput'),
						name: interactionModal.fields.getTextInputValue('idPNJNameInput'),
						healthState: '<:pnj_emoji:1336728073802092637>',
						isPNJ: true,
						passTurnFlag: false,
					};
					players.push(newPNJ);
					addPlayerStringSelect(selectPlayer, newPNJ);

					players.sort((a, b) => b.initiative - a.initiative);
					await calculateTurnOrder(true);
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


		async function calculateTurnOrder(refresh = false) {
			turnOrderMessage = `## __Tour ${turnNumber} :__\n`;
			for (const player of players) {
				if (refresh && !player.isPNJ) await refreshPlayerData(player);

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


		async function retrievePlayerData(playersID) {
			const playersPJ = [];
			for (const id of playersID) {
			  const playerData = await getPlayerData(id, playerDataRange);
			  playersPJ.push({
					initiative: playerData[16]?.[15] ?? -999,
					name: playerData[0]?.[0] ?? 'Inconnu au bataillon',
					healthState: playerData[2]?.[0] ?? ':x:',
					id,
					isPNJ: false,
					passTurnFlag: false,
			  });
			}
			for (const player of playersPJ) addPlayerStringSelect(selectPlayer, player);

			return playersPJ;
		}


		async function refreshPlayerData(player) {
			const getDataPlayer = await googleSheets.spreadsheets.values.get({
				auth,
				spreadsheetId: player.id,
				range: playerDataRange,
		  });

		  player.initiative = getDataPlayer.data.values[16][15];
		  player.name = getDataPlayer.data.values[0][0];
		  player.healthState = getDataPlayer.data.values[2][0];

		  return player;
		}


		function addPlayerStringSelect(stringSelect, player) {
			stringSelect.addOptions(new StringSelectMenuOptionBuilder()
				.setValue(`${player.name}`)
				.setLabel(`${player.name}`));
		}


		async function handleTurn(action) {
			switch (action) {
			case 'next':
				({ currentTurn, turnNumber } = nextTurn(players, currentTurn, turnNumber));
				break;
			case 'prec':
				({ currentTurn, turnNumber } = precTurn(players, currentTurn, turnNumber));
				break;
			case 'pass':
				({ currentTurn, turnNumber } = passTurn(players, currentTurn, turnNumber));
				break;
			}
			await calculateTurnOrder(true);
		}
	},
};