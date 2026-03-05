const { SlashCommandBuilder } = require('discord.js');
const { loadData, saveData } = require('../utils/dataHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('q-panel')
        .setDescription('認証パネルを設置するチャンネルを設定します')
        .addChannelOption(opt => opt.setName('channel').setDescription('設置先チャンネル').setRequired(true)),
    async execute(interaction) {
        const settings = loadData('settings');
        const channel = interaction.options.getChannel('channel');
        settings.panelChannelId = channel.id;
        saveData('settings', settings);
        await interaction.reply({ content: `認証パネルの設置先を <#${channel.id}> に設定しました。`, ephemeral: true });
    },
};