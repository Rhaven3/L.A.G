const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');


function createTurnButtons() {
	return new ActionRowBuilder().addComponents(

		new ButtonBuilder()
			.setCustomId('precTurn')
			.setLabel('Prec')
			.setStyle(ButtonStyle.Secondary)
			.setEmoji('⬅️'),

		new ButtonBuilder()
			.setCustomId('passTurn')
			.setLabel('Pass')
			.setStyle(ButtonStyle.Secondary)
			.setEmoji('💠'),

		new ButtonBuilder()
			.setCustomId('nextTurn')
			.setLabel('Next')
			.setStyle(ButtonStyle.Secondary)
			.setEmoji('➡️'),
	);
}

function createAddPlayerMenu() {
	return new ActionRowBuilder().addComponents(

		new ButtonBuilder()
			.setCustomId('addPJ')
			.setLabel('Ajouter un PJ')
			.setStyle(ButtonStyle.Success),

		new ButtonBuilder()
			.setCustomId('addPNJ')
			.setLabel('Ajouter un PNJ')
			.setStyle(ButtonStyle.Success),
	);
}

function createSelectPlayerMenu() {
	const stringSelectMenu = new StringSelectMenuBuilder()
		.setCustomId('selectPlayer')
		.setPlaceholder('Choisit un personnage');

	return {
		stringSelectRow: new ActionRowBuilder().addComponents(stringSelectMenu),

		buttonSelectRow: new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('addState')
				.setLabel('Ajouter un Statut')
				.setStyle(ButtonStyle.Secondary),

			new ButtonBuilder()
				.setCustomId('takenTurn')
				.setLabel('Tour Pris !')
				.setStyle(ButtonStyle.Primary),

			new ButtonBuilder()
				.setCustomId('removePlayer')
				.setLabel('Supprimer Personnage')
				.setStyle(ButtonStyle.Danger),
		),
		stringSelectMenu,
	};
}

function addPlayerSelectMenu(selectMenu, player) {
	selectMenu.addOptions(
		new StringSelectMenuOptionBuilder()
			.setValue(`${player.name}`)
			.setLabel(`${player.name}`));
}

function formatTurnOrderMessage(players, turnNumber) {
	let turnOrderMessage = `## __Tour ${turnNumber} :__\n`;

	players.forEach(player => {
		if (player.isCurrentTurn) {
			turnOrderMessage += ':star: ';
		} else if (player.passTurnFlag) {
			turnOrderMessage += ':diamond_shape_with_a_dot_inside: ';
		} else {
			turnOrderMessage += '- ';
		}

		turnOrderMessage += `**${player.name}** \`\`[ ${player.initiative} ]\`\` *${player.healthState}* \n`;
	});

	return turnOrderMessage;
}

module.exports = {
	createTurnButtons,
	createSelectPlayerMenu,
	createAddPlayerMenu,
	addPlayerSelectMenu,
	formatTurnOrderMessage,
};
