const { SlashCommandBuilder } = require('discord.js');
const { client } = require('../../config/config');


const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Donne la Latence du bot');

async function execute(interaction) {
	const sent = await interaction.reply({ content: 'Pinging...' });
	await interaction.editReply(`
		Websocket heartbeat: ${client.ws.ping}ms.
		Roundtrip latency: ${sent.createdTimestamp - interaction.createdTimestamp}ms
	`);
};


module.exports = {
	data,
	execute,
};