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
	await updateTurnOderReply(false);
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
			await updateTurnOderReply();
		},
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
			await updateTurnOderReply();
		},
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
			await updateTurnOderReply();
		},
	);

	// Add PJ Button
	initiativeTracker.useCollector(
		turnOrderResponse,
		'addPJCollector',
		'addPJ',
		buttonTime,
		(button) => initiativeTracker.addPJ(button, modalTime, 'addPJModal', async () => {
			await updateTurnOderReply();
		}),
	);

	// Add PNJ Button
	initiativeTracker.useCollector(
		turnOrderResponse,
		'addPNJCollector',
		'addPNJ',
		buttonTime,
		(button) => initiativeTracker.addPNJ(button, modalTime, 'addPNJModal', async () => {
			await updateTurnOderReply();
		}),
	);


	// Update Turn Order
	async function updateTurnOderReply(refresh = true) {
		if (!ComponentRows || !Array.isArray(ComponentRows)) {
			console.error('ComponentRows is not an array or is undefined');
			return;
		}

		const updatedUI = await initiativeTracker.updateUI(refresh);
		if (updatedUI) {
			await interaction.editReply({
				content: updatedUI,
				components: ComponentRows,
				withResponse: true,
			});
		}
	}
};


module.exports = {
	data,
	execute,
};