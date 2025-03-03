const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { buttonTimeMilliSecond, modalTimeMilliSecond, idSheetSpliter } = require('../../config/config');
const { createTurnButtons, createSelectPlayerMenu, createAddPlayerMenu, createConfirmButton } = require('./uiComponents');
const { InitiativeTracker } = require('./Class');

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
		buttonTimeMilliSecond,
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
		buttonTimeMilliSecond,
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
		buttonTimeMilliSecond,
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
		buttonTimeMilliSecond,
		(button) => initiativeTracker.addPJ(button, modalTimeMilliSecond, 'addPJModal', async () => {
			await updateTurnOderReply();
		}),
	);

	// Add PNJ Button
	initiativeTracker.useCollector(
		turnOrderResponse,
		'addPNJCollector',
		'addPNJ',
		buttonTimeMilliSecond,
		(button) => initiativeTracker.addPNJ(button, modalTimeMilliSecond, 'addPNJModal', async () => {
			await updateTurnOderReply();
		}),
	);


	// Select Player Menu
	// Select Player
	initiativeTracker.useCollector(
		turnOrderResponse,
		'selectPlayerCollector',
		'selectPlayer',
		buttonTimeMilliSecond,
		async (select) => {
			await select.deferUpdate();
			await initiativeTracker.selectPlayer(select.values[0]);
			console.log(`Selected Player: ${initiativeTracker.selectedPlayer.name}`);
		},
	);

	// Add State Button
	initiativeTracker.useCollector(
		turnOrderResponse,
		'addStateCollector',
		'addState',
		buttonTimeMilliSecond,
		(button) => initiativeTracker.addState(button, modalTimeMilliSecond, 'addStateModal', async () => {
			await updateTurnOderReply();
		}),
	);

	// Taken Turn Button
	initiativeTracker.useCollector(
		turnOrderResponse,
		'takenTurnCollector',
		'takenTurn',
		buttonTimeMilliSecond,
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
		buttonTimeMilliSecond,
		async (button) => {
			await button.deferUpdate();
			// Confirm
			const confirmComponnentsRow = createConfirmButton();
			const confirmResponse = await interaction.followUp({
				content: `Êtes-vous sûr de supprimé ${initiativeTracker.selectedPlayer.name} ?`,
				flags: MessageFlags.Ephemeral,
				components: [confirmComponnentsRow],
				withResponse: true,
			});

			// Collector Yes Confirm
			initiativeTracker.useCollector(
				confirmResponse,
				'yConfirmCollector',
				'yConfirm',
				buttonTimeMilliSecond,
				async (buttonConfirm) => {
					await buttonConfirm.deferUpdate();
					initiativeTracker.removePlayer();
					updateTurnOderReply();
					await buttonConfirm.deleteReply();
				},
			);

			// Collector No Confirm
			initiativeTracker.useCollector(
				confirmResponse,
				'nConfirmCollector',
				'nConfirm',
				buttonTimeMilliSecond,
				async (buttonConfirm) => {
					await buttonConfirm.deferUpdate();
					await buttonConfirm.deleteReply();
				},
			);
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