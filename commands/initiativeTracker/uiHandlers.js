const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { addPlayerStringSelect } = require('./uiComponents');
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

// Handle Player (PJ) Submission
async function handleAddPJSubmit(interactionModal, getPlayersData_Callback, players, selectPlayerMenu) {
	try {
		console.log(`${interactionModal.customId} was submitted!`);
		const newPlayers = await getPlayersData_Callback(players);
		newPlayers.forEach(player => addPlayerStringSelect(selectPlayerMenu.stringSelectMenu, player));

		players.push(...newPlayers);
		players.sort((a, b) => b.initiative - a.initiative);
	} catch (err) {
		console.log('Error handling PJ submission:', err);
	}
}

// Handle PNJ Submission
async function handleAddPNJSubmit(interactionModal, players, selectPlayerMenu) {
	try {
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
		addPlayerStringSelect(selectPlayerMenu.stringSelectMenu, newPNJ);
		players.sort((a, b) => b.initiative - a.initiative);
	} catch (err) {
		console.log('Error handling PNJ submission:', err);
	}
}

module.exports = {
	createAddPJModal,
	createAddPNJModal,
	handleAddPJSubmit,
	handleAddPNJSubmit,
};
