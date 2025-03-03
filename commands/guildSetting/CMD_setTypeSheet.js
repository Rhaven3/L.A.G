const { SlashCommandBuilder } = require('discord.js');
const { updateGuildSettings, getGuildSettings } = require('./settingsManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setprefix')
        .setDescription('Change the bot prefix for this server')
        .addStringOption(option =>
            option.setName('prefix')
                .setDescription('New prefix')
                .setRequired(true)),

    async execute(interaction) {
        const newPrefix = interaction.options.getString('prefix');
        updateGuildSettings(interaction.guild.id, { prefix: newPrefix });

        await interaction.reply(`✅ Prefix updated to \`${newPrefix}\``);
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