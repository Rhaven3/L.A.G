import { SlashCommandBuilder } from 'discord.js';
import { updateGuildSettings } from './settingsManager.js';

export const data = new SlashCommandBuilder()
    .setName('setsheet')
    .setDescription('Change the bot prefix for this server')
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Choisir le type de fiche à utiliser')
            .setRequired(true)
            .addChoices(
                { name: 'Arcadia', value: 'arcadia' },
                { name: 'Stardust', value: 'stardust' },
            ));

export async function execute(interaction) {
    const newTypeSheet = interaction.options.getString('type');
    updateGuildSettings(interaction.guild.id, { sheetTtrpgType: newTypeSheet });

    await interaction.reply(`✅ Type de fiche changé pour **fiche ${newTypeSheet}**`);
}
