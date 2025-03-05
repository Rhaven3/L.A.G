const { SlashCommandBuilder } = require('discord.js');
const { updateGuildSettings, getGuildSettings } = require('./settingsManager');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setsheet')
		.setDescription('Change the bot prefix for this server')
		.addStringOption(option =>
			option.setName('type')
				.setDescription('Choisir le type de fiche à utiliser')
				.setRequired(true)
		        .addChoices(
			        // { name: 'D&D', value: 'dnd' },
			        // { name: 'Pathfinder', value: 'pathfinder' },
			        { name: 'Arcadia', value: 'arcadia' },
			        { name: 'Stardust', value: 'stardust' },
		        )),

	async execute(interaction) {
		const newTypeSheet = interaction.options.getString('type');
		updateGuildSettings(interaction.guild.id, { sheetTtrpgType: newTypeSheet });

		await interaction.reply(`✅ Type de fiche changé pour **fiche ${newTypeSheet}**`);
	},
};


/* Fetch Guild-Specific Settings in Commands
const { getGuildSettings } = require('../settingsManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('View the current server settings'),

    async execute(interaction) {
        const settings = getGuildSettings(interaction.guild.id);
        await interaction.reply(`📌 **Guild Settings**\n- Prefix: \`${settings.prefix}\`\n- Language: \`${settings.language}\`\n- Initiative Channel: <#${settings.initiativeChannel || 'Not Set'}>`);
    },
};

*/