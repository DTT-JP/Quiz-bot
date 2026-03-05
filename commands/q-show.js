const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData } = require('../utils/dataHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('q-show')
        .setDescription('現在のBot設定を表示します'),
    async execute(interaction) {
        const settings = loadData('settings');
        const questions = loadData('questions');

        const embed = new EmbedBuilder()
            .setTitle('現在の認証クイズ設定')
            .setColor(0x3498db)
            .addFields(
                { name: '認証パネル', value: settings.panelChannelId ? `<#${settings.panelChannelId}>` : '未設定', inline: true },
                { name: 'ログチャンネル', value: settings.adminChannelId ? `<#${settings.adminChannelId}>` : '未設定', inline: true },
                { name: '付与ロール', value: settings.roleId ? `<@&${settings.roleId}>` : '未設定', inline: true },
                { name: '出題数 (n)', value: `${settings.questionCount || 0} 問`, inline: true },
                { name: '登録問題数', value: `${questions.length} 問`, inline: true }
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};