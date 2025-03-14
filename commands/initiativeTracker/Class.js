import { defaultInitiative, defaultName, defaultState } from '../../config/config.js';
import { getPlayerData } from '../../tools/googleSheets.js';
import { nextTurn, precTurn, passTurn, calculateTurnOrder } from './turnManager.js';
import { addPlayerSelectMenu, formatTurnOrderMessage } from './uiComponents.js';
import { getGuildSettings } from '../guildSetting/settingsManager.js';
import { createAddPJModal, createAddPNJModal, handleAddPJSubmit, handleAddPNJSubmit, createAddStateModal, handleAddStateSubmit } from './uiHandlers.js';

class InitiativeTracker {
	constructor(interaction) {
		this.players = [];
		this.currentTurn = 0;
		this.turnNumber = 1;
		this.selectedPlayer = null;
		this.typeSheet = getGuildSettings(interaction.guild.id).sheetTtrpgType;
	}

	// Method to add a player to the initiative tracker
	async addPlayers(playersID) {
		const newPlayers = await retrievePlayerData(playersID, this.typeSheet);
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
			await handleAddPJSubmit(interactionModal, retrievePlayerData, this.typeSheet, this.players, this.selectPlayerMenu.stringSelectMenu);
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
		const addStateModal = createAddStateModal(this.selectedPlayer);
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
		this.selectedPlayer.passTurnFlag = false;
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
		this.state = '';
		this.isPNJ = true;
	}
}

class PJ extends PNJ {
	constructor(id, initiative = defaultInitiative, name = defaultName, healthState = defaultState) {
		super(initiative, name);
		this.id = id;
		this.healthState = healthState;
		this.state = '';
		this.isPNJ = false;
		this.passTurnFlag = false;
		this.passTurnNumer;
	}

	async setPlayerData(typeSheet) {
		let playerDataRange = '';
		switch (typeSheet) {
		case 'arcadia':
			playerDataRange = 'Etat!A1:P17';
			break;

		case 'stardust':
			playerDataRange = '\'Etat Général\'!A2:J24';
			break;
		default:
			playerDataRange = 'Etat!A1:P17';
			break;
		}

		const playerData = await getPlayerData(this.id, playerDataRange);
		switch (typeSheet) {
		case 'arcadia':
			this.initiative = playerData[16][15] ?? defaultInitiative;
			this.name = playerData[0][0] ?? defaultName;
			this.healthState = playerData[2][0] ?? defaultState;
			break;

		case 'stardust':
			this.initiative = playerData[22][9] ?? defaultInitiative;
			this.name = playerData[0][0] ?? defaultName;
			this.healthState = (playerData[1][6] && playerData[2][7]) ? `${playerData[1][6]} / ${playerData[2][7]}` : defaultState;
			break;

		default:
			this.initiative = playerData[16][15] ?? defaultInitiative;
			this.name = playerData[0][0] ?? defaultName;
			this.healthState = playerData[2][0] ?? defaultState;
			break;
		}
	}
}


async function retrievePlayerData(playersID, typeSheet) {
	const playersPJ = [];
	for (const id of playersID) {
		const newPlayer = new PJ(id);
		await newPlayer.setPlayerData(typeSheet);
		playersPJ.push(newPlayer);
	}
	return playersPJ;
};


export { InitiativeTracker, PNJ, PJ };