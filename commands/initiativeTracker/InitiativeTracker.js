const { SlashCommandBuilder } = require('discord.js');
const { buttonTime, modalTime, idSheetSpliter } = require('../../config/config');
const { createTurnButtons, createSelectPlayerMenu, createAddPlayerMenu } = require('./uiComponents');
const InitiativeTracker = require('./Class');

const data = new SlashCommandBuilder()
	.setName('initiative')
	.setDescription('Créer un trackeur d\'initative')
	.addStringOption(option =>
		option.setName('idsheets')
			.setDescription('ajouté l\'id des fiches que vous souhaité utilisé, séparé d\'une virgule '),
	);

async function execute(interaction) {
	await interaction.deferReply();

	const initiativeTracker = new InitiativeTracker();


	// récup fiche
	await initiativeTracker.addPlayers(interaction.options.getString('idsheets').split(idSheetSpliter));

	// Component Row
	const ComponentRows = initiativeTracker.createComponentsRow(
		createTurnButtons(),
		createAddPlayerMenu(),
		createSelectPlayerMenu(),
	);

	// Affichage du Turn Order + Button
	await updateTurnOderReply();
	const turnOrderResponse = await interaction.fetchReply();

	// Button Next
	initiativeTracker.useCollector(
		turnOrderResponse, 
		'NextCollector',
		'nextTurn',
		buttonTime,
		async (button) => {
			await button.deferUpdate();
			initiativeTracker.nextTurn();
			updateTurnOderReply();
		}
	);

	// Button Prec
	initiativeTracker.useCollector(
		turnOrderResponse,
		'PrecCollector',
		'precTurn',
		buttonTime,
		async (button) => {
			await button.deferUpdate();
			initiativeTracker.previousTurn();
			updateTurnOderReply();
		}
	);

	// Button Pass
	initiativeTracker.useCollector(
		turnOrderResponse,
		'PassCollector',
		'passTurn',
		buttonTime,
		async (button) => {
			await button.deferUpdate();
			initiativeTracker.passTurn();
			updateTurnOderReply();
		}
	);

	// Add PJ Button
	initiativeTracker.useCollector(
		turnOrderResponse,
		'addPJCollector',
		'addPJ',
		buttonTime,
		(button) => initiativeTracker.addPJ(button, modalTime, 'addPJModal', () => {
			updateTurnOderReply();
		})
	);

	// Add PNJ Button
	initiativeTracker.useCollector(
		turnOrderResponse,
		'addPNJCollector',
		'addPNJ',
		buttonTime,
		(button) => initiativeTracker.addPNJ(button, modalTime, 'addPNJModal', () => {
			updateTurnOderReply();
		})
	);


	// Update Turn Order
	async function updateTurnOderReply() {
		await interaction.editReply({
			content: await initiativeTracker.updateUI(),
			components: ComponentRows,
			withResponse: true,
		});
	}
};


module.exports = {
	data,
	execute,
};