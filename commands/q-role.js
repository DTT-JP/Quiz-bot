const { SlashCommandBuilder } = require('discord.js');
const { loadData, saveData } = require('../utils/dataHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('q-role')
        .setDescription('正解者に付与するロールを設定します')
        .addRoleOption(opt => opt.setName('role').setDescription('付与するロール').setRequired(true)),
    async execute(interaction) {
        const settings = loadData('settings');
        const role = interaction.options.getRole('role');
        settings.roleId = role.id;
        saveData('settings', settings);
        await interaction.reply({ content: `付与するロールを **${role.name}** に設定しました。`, ephemeral: true });
    },
};