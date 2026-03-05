const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { loadData, saveData } = require('../utils/dataHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('q-admin')
        .setDescription('ログ通知用チャンネルを設定します')
        .addChannelOption(opt => 
            opt.setName('channel')
                .setDescription('通知先チャンネル')
                .addChannelTypes(ChannelType.GuildText) // テキストチャンネルのみに限定
                .setRequired(true)),
    async execute(interaction) {
        try {
            const settings = loadData('settings');
            const channel = interaction.options.getChannel('channel');

            if (!channel) {
                return interaction.reply({ content: 'チャンネルが見つかりませんでした。', ephemeral: true });
            }

            settings.adminChannelId = channel.id;
            saveData('settings', settings);

            await interaction.reply({ 
                content: `ログ通知先を <#${channel.id}> (ID: ${channel.id}) に設定しました。`, 
                ephemeral: true 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '設定の保存中にエラーが発生しました。', ephemeral: true });
        }
    },
};