const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData, saveData } = require('../utils/dataHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('q-edit')
        .setDescription('既存の問題を編集します')
        .addStringOption(option => option.setName('id').setDescription('編集したい問題のID').setRequired(true))
        .addStringOption(option => option.setName('text').setDescription('新しい問題文'))
        .addStringOption(option => option.setName('opt1').setDescription('選択肢1'))
        .addStringOption(option => option.setName('opt2').setDescription('選択肢2'))
        .addStringOption(option => option.setName('opt3').setDescription('選択肢3'))
        .addStringOption(option => option.setName('opt4').setDescription('選択肢4'))
        .addIntegerOption(option => option.setName('answer').setDescription('正解の番号 (1-4)').setMinValue(1).setMaxValue(4)),
    async execute(interaction) {
        const questions = loadData('questions');
        const id = interaction.options.getString('id');
        const index = questions.findIndex(q => q.id.toString() === id.trim());

        if (index === -1) {
            return interaction.reply({ content: `ID: ${id} の問題が見つかりませんでした。`, flags: [64] });
        }

        const oldQ = JSON.parse(JSON.stringify(questions[index])); // 比較用にコピー
        const newQ = questions[index];

        // 各項目が入力されていれば更新
        const text = interaction.options.getString('text');
        if (text) newQ.text = text;

        const opts = [
            interaction.options.getString('opt1'),
            interaction.options.getString('opt2'),
            interaction.options.getString('opt3'),
            interaction.options.getString('opt4')
        ];
        opts.forEach((opt, i) => {
            if (opt) newQ.options[i] = opt;
        });

        const answer = interaction.options.getInteger('answer');
        if (answer !== null) newQ.answer = answer - 1; // 0-indexに変換

        saveData('questions', questions);

        const embed = new EmbedBuilder()
            .setTitle('問題の編集完了')
            .setColor(0xffa500)
            .addFields(
                { 
                    name: '🔄 編集前', 
                    value: `**問**: ${oldQ.text}\n**正解**: ${oldQ.answer + 1}\n${oldQ.options.map((o, i) => `${i+1}: ${o}`).join('\n')}` 
                },
                { 
                    name: '✅ 編集後', 
                    value: `**問**: ${newQ.text}\n**正解**: ${newQ.answer + 1}\n${newQ.options.map((o, i) => `${i+1}: ${o}`).join('\n')}` 
                }
            );

        await interaction.reply({ embeds: [embed], flags: [64] });
    },
};