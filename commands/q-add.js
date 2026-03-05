const { SlashCommandBuilder } = require('discord.js');
const { loadData, saveData } = require('../utils/dataHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('q-add')
        .setDescription('新しいクイズ問題を追加します')
        .addStringOption(option => option.setName('text').setDescription('問題文').setRequired(true))
        .addStringOption(option => option.setName('opt1').setDescription('選択肢1').setRequired(true))
        .addStringOption(option => option.setName('opt2').setDescription('選択肢2').setRequired(true))
        .addStringOption(option => option.setName('opt3').setDescription('選択肢3').setRequired(true))
        .addStringOption(option => option.setName('opt4').setDescription('選択肢4').setRequired(true))
        .addIntegerOption(option => option.setName('answer').setDescription('正解番号(1-4)').setRequired(true).setMinValue(1).setMaxValue(4)),
    async execute(interaction) {
        const questions = loadData('questions');
        
        const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
        const newQuestion = {
            id: newId,
            text: interaction.options.getString('text'),
            options: [
                interaction.options.getString('opt1'),
                interaction.options.getString('opt2'),
                interaction.options.getString('opt3'),
                interaction.options.getString('opt4')
            ],
            answer: interaction.options.getInteger('answer') - 1 // 0-indexに変換
        };

        questions.push(newQuestion);
        saveData('questions', questions);

        await interaction.reply({ content: `問題を追加しました (ID: ${newId})`, ephemeral: true });
    },
};