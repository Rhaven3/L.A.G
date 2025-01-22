const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('initiative')
		.setDescription('Créer un trackeur d\'initative'),
	async execute(interaction) {
		// Recup des fiches
		/* Fiche Test, Kamui (https://docs.google.com/spreadsheets/d/1prz0Z_pkGGR73TxwDsROvSVeEVoHJwfKa1TEDNQQ_fE/edit?gid=0#gid=0)
		* - Initiative
		* : F15
		* - Nom
		* : A2 & B2
		* - HP
		* : ? Calculer dans une autre fiche, à réfléchir
		*/
		// *************  Players Exemple (API Sheet pas encore fonctionnell)
		// ****************************************************************
		const players = [
			{ initiative: 14, name: 'Player 1', passTurnFlag: false },
			{ initiative: 7, name: 'Player 2', passTurnFlag: false },
			{ initiative: -41, name: 'Player 3', passTurnFlag: false },
			{ initiative: 32, name: 'Player 4', passTurnFlag: false },
		];
		players.sort((a, b) => b.initiative - a.initiative);
		// ****************************************************************
		const buttonTimeInteraction = 3_600_000;
		let currentTurn = 0;
		let turnOrderMessage = '';
		let turnNumber = 1;
		calculateTurnOrder();

		// action rows
		const nextTurnButton = new ButtonBuilder()
			.setCustomId('nextTurn')
			.setLabel('Next')
			.setStyle(ButtonStyle.Success);

		const precTurnButton = new ButtonBuilder()
			.setCustomId('precTurn')
			.setLabel('Prec')
			.setStyle(ButtonStyle.Secondary);

		const passTurnButton = new ButtonBuilder()
			.setCustomId('passTurn')
			.setLabel('Pass')
			.setStyle(ButtonStyle.Primary);

		const row = new ActionRowBuilder()
			.addComponents(precTurnButton, passTurnButton, nextTurnButton);


		// Affichage du Turn Order + Button
		const response = await interaction.reply({
			content: turnOrderMessage,
			components: [row],
			withResponse: true,
		});


		// Button Next
		const NextCollector = response.resource.message.createMessageComponentCollector({
			filter: button => button.customId === 'nextTurn',
			time: buttonTimeInteraction,
		});

		NextCollector.on('collect', async (button) => {
			await button.deferUpdate();

			nextTurn();
			calculateTurnOrder();
			await interaction.editReply({
				content: turnOrderMessage,
				components: [row],
				withResponse: true,
			});
		});
		NextCollector.on('end', (collected, reason) => {
			if (reason === 'time') {
				interaction.followup({ content: 'Le temps est écoulé, plus de réponses.', components: [] });
			}
			console.log(`NextCollecteur terminé. Raisons: ${reason}`);
		});

		function nextTurn() {
			

			if (currentTurn == players.length - 1) {
				turnNumber++;
				currentTurn = 0;
			} else {
				currentTurn++;
			}
		}


		// Button Prec
		const PrecCollector = response.resource.message.createMessageComponentCollector({
			filter: button => button.customId === 'precTurn',
			time: buttonTimeInteraction,
		});

		PrecCollector.on('collect', async (button) => {
			await button.deferUpdate();

			precTurn();
			calculateTurnOrder();
			await interaction.editReply({
				content: turnOrderMessage,
				components: [row],
				withResponse: true,
			});
		});
		PrecCollector.on('end', (collected, reason) => {
			console.log(`PrecCollecteur terminé. Raisons: ${reason}`);
		});

		function precTurn() {
			if (currentTurn == 0) {
				turnNumber--;
				currentTurn = players.length - 1;
			} else {
				currentTurn--;
			}
		}


		// Button Pass
		const PassCollector = response.resource.message.createMessageComponentCollector({
			filter: button => button.customId === 'passTurn',
			time: buttonTimeInteraction,
		});

		PassCollector.on('collect', async (button) => {
			await button.deferUpdate();

			passTurn();
			calculateTurnOrder();
			await interaction.editReply({
				content: turnOrderMessage,
				components: [row],
				withResponse: true,
			});
		});
		PassCollector.on('end', (collected, reason) => {
			console.log(`PassCollecteur terminé. Raisons: ${reason}`);
		});

		function passTurn() {
			for (const player of players) {
				if (players.indexOf(player) == currentTurn) player.passTurnFlag = true;
			}
			nextTurn();
		}


		function calculateTurnOrder() {
			turnOrderMessage = `__Tour ${turnNumber}:__\n`;
			for (const player of players) {
				(players.indexOf(player) == currentTurn) ?
					turnOrderMessage += ':star: ' :
					(player.passTurnFlag) ?
						turnOrderMessage += ':diamond_'
					turnOrderMessage += '- ' ;
				turnOrderMessage += `${player.name} \`\`${player.initiative}\`\` \n`;
			}
		}

		/*
		function getCurrentPlayer(playerList) {
			for (const player of playerList) {
				if (playerList.indexOf(player) == currentTurn) {
					return player;
				} else {return null;}
			}
		}
		*/

	},
};