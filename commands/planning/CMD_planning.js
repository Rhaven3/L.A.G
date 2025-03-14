import { SlashCommandBuilder } from 'discord.js';
import { Planifier } from './Class.js';

/* eslint-disable */
export const data = new SlashCommandBuilder()
    .setName('planning')
    .setDescription('Créer une planification de session')
    .addStringOption(option =>
        option.setName('date')
            .setDescription(' Choisir sur qu\'elle intervale de temps: DD/MM-DD/MM (max 31j d\'écart)')
            .setRequired(true),
    );

export async function execute(interaction) {
    await interaction.deferReply();

    const planning = new Planifier(interaction.options.getString('date'));

    const response = await interaction.editReply({
        content: planning.getMessage(),
    });
}