const { SlashCommandBuilder } = require('discord.js');
const { loadData, saveData } = require('../utils/dataHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('q-delete')
        .setDescription('指定したIDの問題を削除します')
        .addIntegerOption(option => option.setName('id').setDescription('削除する問題のID').setRequired(true)),
    async execute(interaction) {
        let questions = loadData('questions');
        const id = interaction.options.getInteger('id');

        const initialLength = questions.length;
        questions = questions.filter(q => q.id !== id);

        if (questions.length === initialLength) {
            return interaction.reply({ content: `ID: ${id} の問題は見つかりませんでした。`, ephemeral: true });
        }

        saveData('questions', questions);
        await interaction.reply({ content: `ID: ${id} の問題を削除しました。`, ephemeral: true });
    },
};