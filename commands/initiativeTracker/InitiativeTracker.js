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


	// Turn Buttons
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


	// Add Player Menu
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


	// Select Player Menu
	// Select Player
	initiativeTracker.useCollector(
		turnOrderResponse,
		'selectPlayerCollector',
		'selectPlayer',
		buttonTime,
		async (select) => {
			await select.deferUpdate();
			await initiativeTracker.selectPlayer(select.values[0]);
			console.log(`Selected Player: ${initiativeTracker.selectedPlayer}`);
		},
	);

	// Add State Button
	initiativeTracker.useCollector(
		turnOrderResponse,
		'addStateCollector',
		'addState',
		buttonTime,
		(button) => initiativeTracker.addState(button, modalTime, 'addStateModal', async () => {
			await updateTurnOderReply();
		}),
	);

	// Taken Turn Button
	initiativeTracker.useCollector(
		turnOrderResponse,
		'takenTurnCollector',
		'takenTurn',
		buttonTime,
		async (button) => {
			await button.deferUpdate();
			initiativeTracker.takeTurn();
			updateTurnOderReply();
		},
	);

	// Remove Player Button
	initiativeTracker.useCollector(
		turnOrderResponse,
		'removePlayerCollector',
		'removePlayer',
		buttonTime,
		async (button) => {
			await button.deferUpdate();
			initiativeTracker.removePlayer();
			updateTurnOderReply();
		},
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