const { SlashCommandBuilder } = require('discord.js');
const { loadData, saveData } = require('../utils/dataHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('q-count')
        .setDescription('出題する問題数を設定します')
        .addIntegerOption(opt => opt.setName('n').setDescription('出題数').setRequired(true).setMinValue(1)),
    async execute(interaction) {
        const settings = loadData('settings');
        const n = interaction.options.getInteger('n');
        settings.questionCount = n;
        saveData('settings', settings);
        await interaction.reply({ content: `出題数を ${n} 問に設定しました。`, ephemeral: true });
    },
};