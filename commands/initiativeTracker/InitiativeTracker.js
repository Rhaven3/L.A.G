const { SlashCommandBuilder } = require('discord.js');
const { playerDataRange, buttonTime, modalTime, idSheetSpliter } = require('../../config/config');
const { getPlayerData } = require('../../utils/googleSheets');
const { nextTurn, precTurn, passTurn, calculateTurnOrder } = require('./turnManager');
const { createTurnButtons, createSelectPlayerMenu, createAddPlayerMenu, addPlayerSelectMenu, formatTurnOrderMessage } = require('./uiComponents');
const { createAddPJModal, createAddPNJModal, handleAddPJSubmit, handleAddPNJSubmit } = require('./uiHandlers');


const data = new SlashCommandBuilder()
	.setName('initiative')
	.setDescription('Créer un trackeur d\'initative')
	.addStringOption(option =>
		option.setName('idsheets')
			.setDescription('ajouté l\'id des fiches que vous souhaité utilisé, séparé d\'une virgule '),
	);

async function execute(interaction) {
	await interaction.deferReply();

	let currentTurn = 0;
	let turnOrderMessage = '';
	let turnNumber = 1;

	// récup fiche
	const players = await retrievePlayerData(interaction.options.getString('idsheets').split(idSheetSpliter));
	players.sort((a, b) => b.initiative - a.initiative);

	// Component Row
	const rowTurn = createTurnButtons();

	const selectPlayerMenu = createSelectPlayerMenu();
	const rowSelect = selectPlayerMenu.stringSelectRow;
	const rowButtonSelect = selectPlayerMenu.buttonSelectRow;

	const rowButtonAdd = createAddPlayerMenu();

	// populate stringSelect
	players.forEach(player => addPlayerSelectMenu(selectPlayerMenu.stringSelectMenu, player));

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
		updateTurnOrderMessage();
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
		updateTurnOrderMessage();
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
		updateTurnOrderMessage();
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
		const addPJModal = createAddPJModal();
		await button.showModal(addPJModal);

		await button.awaitModalSubmit({
			filter: (interactionModal) => interactionModal.customId === 'addPJModal',
			time: modalTime,
		}).then(async (interactionModal) => {
			handleAddPJSubmit(interactionModal, retrievePlayerData, players, selectPlayerMenu.stringSelectMenu);
			await interactionModal.deferUpdate();
			updateTurnOrderMessage();
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
		const addPNJModal = createAddPNJModal();
		await button.showModal(addPNJModal);

		await button.awaitModalSubmit({
			filter: (interactionModal) => interactionModal.customId === 'addPNJModal',
			time: modalTime,
		})
			.then(async (interactionModal) => {
				handleAddPNJSubmit(interactionModal, players, selectPlayerMenu.stringSelectMenu);
				await interactionModal.deferUpdate();
				updateTurnOrderMessage();
			})
			.catch(err => console.log('no modal submit interaction was collected \n erreur: ' + err));
	});
	addPNJCollector.on('end', (collected, reason) => {
		console.log(`addPNJCollecteur terminé. Raisons: ${reason}`);
	});


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
	};

	async function updateTurnOrderMessage() {
		const updatedPlayers = await calculateTurnOrder(players, currentTurn, turnNumber, true, refreshPlayerData);
		turnOrderMessage = formatTurnOrderMessage(updatedPlayers, turnNumber);

		await interaction.editReply({
			content: turnOrderMessage,
			components: actionRowsMessageComponents,
			withResponse: true,
		});
	}
};


module.exports = {
	data,
	execute,
};


async function retrievePlayerData(playersID) {
	const playersPJ = [];
	for (const id of playersID) {
	  const playerData = await getPlayerData(id, playerDataRange);
	  playersPJ.push({
			initiative: playerData[16][15] ?? -999,
			name: playerData[0][0] ?? 'Inconnu au bataillon',
			healthState: playerData[2][0] ?? ':x:',
			id,
			isPNJ: false,
			passTurnFlag: false,
	  });
	}
	return playersPJ;
};

async function refreshPlayerData(player) {
	const playerData = await getPlayerData(id, playerDataRange);
	player.initiative = playerData[16][15] ?? -999;
	player.name = playerData[0][0] ?? 'Inconnu au bataillon';
	player.healthState = playerData[2][0] ?? ':x:';
	return player;
};