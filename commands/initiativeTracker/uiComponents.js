const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

/*
* Peut être recréer des variable pour les boutons
* pour la rapidité d'exec
*/

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
	return ActionRowBuilder().addComponents(

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
	const selectPlayerMenu = {
		stringSelectRow: new ActionRowBuilder().addComponents(
		    new StringSelectMenuBuilder()
			    .setCustomId('selectPlayer')
			    .setPlaceholder('Choisit un personnage'),
	        ),
		buttonSelectRow: new ActionRowBuilder().addComponents(
			new ButtonBuilder()
			    .setCustomId('addState')
			    .setLabel('Ajouter un Statut')
			    .setStyle(ButtonStyle.Danger),
			new ButtonBuilder()
			    .setCustomId('takenTurn')
			    .setLabel('Tour Pris !')
			    .setStyle(ButtonStyle.Primary),
		),
	};
	return selectPlayerMenu;
}


module.exports = { createTurnButtons, createSelectPlayerMenu, createAddPlayerMenu };
