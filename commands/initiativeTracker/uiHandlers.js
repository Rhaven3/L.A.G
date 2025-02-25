const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { addPlayerSelectMenu } = require('./uiComponents');
const { idSheetSpliter } = require('../../config/config');

// Create a modal for adding a new player
function createAddPJModal() {
	const modal = new ModalBuilder()
		.setCustomId('addPJModal')
		.setTitle('Ajouter un PJ');

	const PJInput = new TextInputBuilder()
		.setCustomId('idPJInput')
		.setLabel(`L'id des fiches de personnages [${idSheetSpliter}]`)
		.setStyle(TextInputStyle.Paragraph)
		.setPlaceholder(`idSheet1${idSheetSpliter}idSheet2${idSheetSpliter}...`)
		.setRequired(true);

	const actionRow = new ActionRowBuilder().addComponents(PJInput);
	modal.addComponents(actionRow);

	return modal;
}

// Create a modal for adding a new PNJ
function createAddPNJModal() {
	const modal = new ModalBuilder()
		.setCustomId('addPNJModal')
		.setTitle('Ajouter un PNJ');

	const PNJNameInput = new TextInputBuilder()
		.setCustomId('idPNJNameInput')
		.setLabel('Nom du PNJ')
		.setStyle(TextInputStyle.Short)
		.setPlaceholder('Bob')
		.setRequired(true);

	const PNJInitInput = new TextInputBuilder()
		.setCustomId('idPNJInitInput')
		.setLabel('Son Initiative')
		.setStyle(TextInputStyle.Short)
		.setPlaceholder('69')
		.setRequired(true);

	const actionRow1 = new ActionRowBuilder().addComponents(PNJNameInput);
	const actionRow2 = new ActionRowBuilder().addComponents(PNJInitInput);
	modal.addComponents(actionRow1, actionRow2);

	return modal;
}

// Create a modal for adding a statut to a Player
function createAddStateModal(selectedplayer) {
	const modal = new ModalBuilder()
		.setCustomId('addStateModal')
		.setTitle(`Ajouter un statut à ${selectedplayer.name}`);

	// state Value
	let state = '';
	if (selectedplayer.state) state = selectedplayer.state;

	const stateInput = new TextInputBuilder()
		.setCustomId('idStateInput')
		.setLabel('Le.s statut.s que vous voulez ajouter')
		.setStyle(TextInputStyle.Short)
		.setPlaceholder('Paralysé, Petrifié, :zap:, :drop_of_blood:, ...')
		.setValue(state)
		.setRequired(false);

	const actionRow1 = new ActionRowBuilder().addComponents(stateInput);

	modal.addComponents(actionRow1);
	return modal;
}

// Handle Player (PJ) Submission
async function handleAddPJSubmit(interactionModal, getPlayersData_Callback, players, selectPlayerMenu) {
	try {
		console.log(`${interactionModal.customId} was submitted!`);
		const newPlayers = await getPlayersData_Callback(interactionModal.fields.getTextInputValue('idPJInput').split(idSheetSpliter));
		newPlayers.forEach(player => {

			// Check if the player already exists
			const playerExist = players.find(p => p.name === player.name);
			if (playerExist) {
				console.log('Player already exists');
				return;
			}

			players.push(player);
			addPlayerSelectMenu(selectPlayerMenu, player);
		});

		players.sort((a, b) => b.initiative - a.initiative);
	} catch (err) {
		console.log('Error handling PJ submission:', err);
	}
}

// Handle PNJ Submission
async function handleAddPNJSubmit(interactionModal, players, selectPlayerMenu, PNJ) {
	try {
		console.log(`${interactionModal.customId} was submitted!
            initiative: ${interactionModal.fields.getTextInputValue('idPNJInitInput')}
            name: ${interactionModal.fields.getTextInputValue('idPNJNameInput')}`);

		// verif si le PNJ existe déjà
		const PNJExist = players.find(player => player.name === interactionModal.fields.getTextInputValue('idPNJNameInput'));
		if (PNJExist) {
			console.log('PNJ already exist');
			return;
		}

		const newPNJ = new PNJ(
			interactionModal.fields.getTextInputValue('idPNJInitInput'),
			interactionModal.fields.getTextInputValue('idPNJNameInput'),
		);

		players.push(newPNJ);
		addPlayerSelectMenu(selectPlayerMenu, newPNJ);
		players.sort((a, b) => b.initiative - a.initiative);
	} catch (err) {
		console.log('Error handling PNJ submission:', err);
	}
}

// Handle addState submit
function handleAddStateSubmit(interactionModal, players, selectedPlayer) {
	try {
		console.log(`${interactionModal.customId} was submitted!`);
		const PlayerExist = players.find(player => player.name === selectedPlayer.name);
		if (!PlayerExist) {
			console.log('Selected Player didn\'t exist ?!');
			return;
		}

		selectedPlayer.state = interactionModal.fields.getTextInputValue('idStateInput');
	} catch (error) {
		console.log(`Error handling State submission for ${selectedPlayer.name}: ${error}`);
	}
}


module.exports = {
	createAddPJModal,
	createAddPNJModal,
	createAddStateModal,
	handleAddPJSubmit,
	handleAddPNJSubmit,
	handleAddStateSubmit,
};
