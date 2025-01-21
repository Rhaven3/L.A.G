const { SlashCommandBuilder } = require('discord.js');

MediaSourceHandle.exports = {
	data: new SlashCommandBuilder()
		.setName('Command Name')
		.setDescription('Command Description'),
	async execute() {
		// What the command do
	},
};