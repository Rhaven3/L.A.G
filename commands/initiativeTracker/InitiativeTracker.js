const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('initiative')
		.setDescription('Créer un trackeur d\'initative'),
	async execute(interaction) {
		await interaction.reply(`
			\`\`\`Discord.JS\n
			En Cours de construction...\n
			\`\`\`
			`);
		// Recup des fiches
		/* Fiche Test, Kamui (https://docs.google.com/spreadsheets/d/1prz0Z_pkGGR73TxwDsROvSVeEVoHJwfKa1TEDNQQ_fE/edit?gid=0#gid=0)
		* - Initiative
		* : F15
		* - Nom
		* : A2 & B2
		* - HP
		* : ? Calculer dans une autre fiche, à réfléchir
		*/

		// Calcul Turn Order
		const players = [
			{ initiative: 14, name: 'Player 1' },
			{ initiative: 7, name: 'Player 2' },
			{ initiative: -41, name: 'Player 3' },
			{ initiative: 32, name: 'Player 4' },
		];
		players.sort((a, b) => b.initiative - a.initiative);

		let actualTurn = 0;
		let turnOrderMessage = '';
		let turnNumber = 1;
		calculateTurnOrder();

		// action rows
		const nextTurnButton = new ButtonBuilder()
			.setCustomId('nextTurn')
			.setLabel('Next')
			.setStyle(ButtonStyle.Primary);

		const precTurnButton = new ButtonBuilder()
			.setCustomId('precTurn')
			.setLabel('Prec')
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder()
			.addComponents(precTurnButton, nextTurnButton);


		// Affichage du Turn Order + Button
		await interaction.editReply({
			content: turnOrderMessage,
			components: [row],
			withResponse: true,
		});

		const NextCollector = Response.resource.message.createMessageComponentcollector({
			filter: button => button.customId === 'nextTurn',
			time: 3_600_000,
		});

		NextCollector.on('collect', async () => {
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
			console.log(`Collecteur terminé. Raisons: ${reason}`);
		});

		function nextTurn() {
			if (actualTurn == players.length) {
				turnNumber++;
				actualTurn = 0;
			} else {
				actualTurn++;
			}
		}

		function calculateTurnOrder() {
			turnOrderMessage = `__Tour ${turnNumber}:__\n`;
			for (const player of players) {
				(players.indexOf(player) == actualTurn) ?
					turnOrderMessage += ':star: ' :
					turnOrderMessage += '- ' ;
				turnOrderMessage += `${player.name} \`\`${player.initiative}\`\` \n`;
			}
		}

	},
};