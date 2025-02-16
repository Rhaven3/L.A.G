const { playerDataRange } = require('../../config/config');
const { getPlayerData } = require('../../tools/googleSheets');
const { nextTurn, precTurn, passTurn, calculateTurnOrder } = require('./turnManager');
const { addPlayerSelectMenu, formatTurnOrderMessage } = require('./uiComponents');
const { createAddPJModal, createAddPNJModal, handleAddPJSubmit, handleAddPNJSubmit } = require('./uiHandlers');

class InitiativeTracker {
	constructor() {
		this.players = [];
		this.currentTurn = 0;
		this.turnNumber = 1;
	}

	// Method to add a player to the initiative tracker
	async addPlayers(playersID) {
		const newPlayers = await retrievePlayerData(playersID);
		this.players.push(...newPlayers);
		this.players.sort((a, b) => b.initiative - a.initiative);
	}

	// Method to remove a player from the initiative tracker
	removePlayer(playerID) {
		this.players = this.players.filter(player => player.id !== playerID);
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
		const turnOrder = await calculateTurnOrder(this.players, this.currentTurn, this.turnNumber, refreshPlayerData, refresh);
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
			console.log(`${interactionModal.customId} was submitted!`);
			await interactionModal.deferUpdate();
			handleAddPNJSubmit(interactionModal, this.players, this.selectPlayerMenu.stringSelectMenu);
			interactionCallback();
		}).catch(err => console.log('no addPNJmodal submit interaction was collected \n erreur: ' + err));
	}
}


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
	const playerData = await getPlayerData(player.id, playerDataRange);
	player.initiative = playerData[16][15] ?? -999;
	player.name = playerData[0][0] ?? 'Inconnu au bataillon';
	player.healthState = playerData[2][0] ?? ':x:';
	return player;
};

module.exports = InitiativeTracker;