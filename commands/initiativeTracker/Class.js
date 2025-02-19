const { playerDataRange, defaultInitiative, defaultName, defaultState } = require('../../config/config');
const { getPlayerData } = require('../../tools/googleSheets');
const { nextTurn, precTurn, passTurn, calculateTurnOrder } = require('./turnManager');
const { addPlayerSelectMenu, formatTurnOrderMessage } = require('./uiComponents');
const { createAddPJModal, createAddPNJModal, handleAddPJSubmit, handleAddPNJSubmit, createAddStateModal, handleAddStateSubmit } = require('./uiHandlers');

class InitiativeTracker {
	constructor() {
		this.players = [];
		this.currentTurn = 0;
		this.turnNumber = 1;
		this.selectedPlayer = null;
	}

	// Method to add a player to the initiative tracker
	async addPlayers(playersID) {
		const newPlayers = await retrievePlayerData(playersID);
		this.players.push(...newPlayers);
		this.players.sort((a, b) => b.initiative - a.initiative);
	}


	// Method to create Components Row
	createComponentsRow(rowTurn, rowButtonAdd, selectPlayerMenu) {
		this.rowTurn = rowTurn;

		this.selectPlayerMenu = selectPlayerMenu;
		this.rowSelect = selectPlayerMenu.stringSelectRow;
		this.rowButtonSelect = selectPlayerMenu.buttonSelectRow;

		this.rowButtonAdd = rowButtonAdd;

		// Populate stringSelect
		this.players.forEach(player => {
			addPlayerSelectMenu(this.selectPlayerMenu.stringSelectMenu, player);
		});

		// Ensure the StringSelectMenu has between 1 and 25 options
		if (this.selectPlayerMenu.stringSelectMenu.options.length < 1 || this.selectPlayerMenu.stringSelectMenu.options.length > 25) {
			this.rowSelect = null;
		}

		return [this.rowTurn, this.rowButtonAdd, this.rowSelect, this.rowButtonSelect].filter(row => row !== null);
	}


	// Method to advance to the next turn
	nextTurn() {
		({
			currentTurn: this.currentTurn,
			turnNumber: this.turnNumber,
		} = nextTurn(this.players, this.currentTurn, this.turnNumber));
	}

	// Method to go to the previous turn
	previousTurn() {
		({
			currentTurn: this.currentTurn,
			turnNumber: this.turnNumber,
		} = precTurn(this.players, this.currentTurn, this.turnNumber));
	}

	// Method to pass the current turn
	passTurn() {
		({
			currentTurn: this.currentTurn,
			turnNumber: this.turnNumber,
		} = passTurn(this.players, this.currentTurn, this.turnNumber));
	}


	// Method to update the turn order message
	async updateUI(refresh = true) {
		const turnOrder = await calculateTurnOrder(this.players, this.currentTurn, this.turnNumber, refresh);
		const turnOrderMessage = formatTurnOrderMessage(turnOrder, this.turnNumber);
		return turnOrderMessage;
	}

	// Simplified method to use a collector
	useCollector(response, name, idComponent, time, callback) {
		const collector = response.createMessageComponentCollector({
			filter: button => button.customId === idComponent,
			time,
		});

		collector.on('collect', callback);
		collector.on('end', (collected, reason) => {
			if (reason === 'time') {
				interaction.followUp({ content: 'Le temps est écoulé, plus de réponses.', components: [] });
			}
			console.log(`${name} terminé. Raisons: ${reason}`);
		});
	}

	// Method to add a PJ
	async addPJ(interaction, time, idModal, interactionCallback) {
		const addPJModal = createAddPJModal();
		await interaction.showModal(addPJModal);

		await interaction.awaitModalSubmit({
			filter: interactionModal => interactionModal.customId === idModal,
			time,
		}).then(async interactionModal => {
			await handleAddPJSubmit(interactionModal, retrievePlayerData, this.players, this.selectPlayerMenu.stringSelectMenu);
			await interactionModal.deferUpdate();
			interactionCallback();
		}).catch(err => console.log('no addPJmodal submit interaction was collected \n erreur: ' + err));
	}

	// Method to add a PNJ
	async addPNJ(interaction, time, idModal, interactionCallback) {
		const addPNJModal = createAddPNJModal();
		await interaction.showModal(addPNJModal);

		await interaction.awaitModalSubmit({
			filter: interactionModal => interactionModal.customId === idModal,
			time,
		}).then(async interactionModal => {
			await interactionModal.deferUpdate();
			handleAddPNJSubmit(interactionModal, this.players, this.selectPlayerMenu.stringSelectMenu, PNJ);
			interactionCallback();
		}).catch(err => console.log('no addPNJmodal submit interaction was collected \n erreur: ' + err));
	}

	// Method to add a State to a player
	async addState(interaction, time, idModal, interactionCallback) {
		const addStateModal = createAddStateModal(this.selectedPlayer, this.players);
		await interaction.showModal(addStateModal);

		await interaction.awaitModalSubmit({
			filter: interactionModal => interactionModal.customId === idModal,
			time,
		}).then(async interactionModal => {
			await interactionModal.deferUpdate();
			handleAddStateSubmit(interactionModal, this.players, this.selectedPlayer);
			interactionCallback();
		}).catch(err => console.log('no addStatemodal submit interaction was collected \n erreur: ' + err));
	}

	// Method to select a player
	async selectPlayer(playerName) {
		this.selectedPlayer = this.players.find(player => player.name === playerName);
	}

	// Method to take a Turn for a player
	// This method finds the selected player and processes their turn.
	async takeTurn() {
		if (this.selectedPlayer) {
			const selectedIndex = this.players.indexOf(this.selectedPlayer);
			this.players[selectedIndex].passTurnFlag = false;
		}
	}

	// Method to remove a player from the initiative tracker
	removePlayer() {
		if (this.selectedPlayer) {
			this.players = this.players.filter(player => player.id !== this.selectedPlayer.id);
		}
	}
}

class PNJ {
	constructor(initiative = defaultInitiative, name = defaultName) {
		this.initiative = initiative;
		this.name = name;
		this.passTurnFlag = false;
		this.passTurnNumer;
		this.healthState = '<:pnj_emoji:1336728073802092637>';
		this.state;
		this.isPNJ = true;
	}
}

class PJ extends PNJ {
	constructor(id, initiative = defaultInitiative, name = defaultName, healthState = defaultState) {
		super(initiative, name);
		this.id = id;
		this.healthState = healthState;
		this.state;
		this.isPNJ = false;
		this.passTurnFlag = false;
		this.passTurnNumer;
	}

	async setPlayerData() {
		const playerData = await getPlayerData(this.id, playerDataRange);
		this.initiative = playerData[16][15] ?? defaultInitiative;
		this.name = playerData[0][0] ?? defaultName;
		this.healthState = playerData[2][0] ?? defaultState;
	}
}


async function retrievePlayerData(playersID) {
	const playersPJ = [];
	for (const id of playersID) {
		const newPlayer = new PJ(id);
		await newPlayer.setPlayerData();
		playersPJ.push(newPlayer);
	}
	return playersPJ;
};


module.exports = {
	InitiativeTracker,
	PNJ,
	PJ,
};