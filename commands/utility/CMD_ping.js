import { SlashCommandBuilder } from 'discord.js';
import { client } from '../../config/config.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Donne la Latence du bot');

export async function execute(interaction) {
    const sent = await interaction.reply({ content: 'Pinging...' });
    await interaction.editReply(`
        Websocket heartbeat: ${client.ws.ping}ms.
        Roundtrip latency: ${sent.createdTimestamp - interaction.createdTimestamp}ms
    `);
}