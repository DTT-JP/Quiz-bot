const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadData } = require('../utils/dataHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('q-user')
        .setDescription('指定したユーザーのクイズ統計を表示します')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('確認したいユーザー')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // 管理者向け権限
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
        const settings = loadData('settings');
        const logs = loadData('logs');
        
        const stats = logs.userStats[targetUser.id] || { misses: 0 };
        const hasRole = targetMember ? targetMember.roles.cache.has(settings.roleId) : false;

        const embed = new EmbedBuilder()
            .setTitle(`ユーザー統計: ${targetUser.tag}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setColor(hasRole ? 0x2ecc71 : 0xe74c3c)
            .addFields(
                { name: 'ユーザーID', value: targetUser.id, inline: false },
                { name: '累計不正解数', value: `${stats.misses} / 5`, inline: true },
                { name: '認証ステータス', value: hasRole ? '✅ 認証済み' : '❌ 未認証', inline: true }
            );

        if (stats.misses >= 3) {
            let penaltyStatus = stats.misses >= 5 ? 'BAN対象' : 'Kick済み/対象';
            embed.addFields({ name: 'ペナルティ状況', value: `⚠️ ${penaltyStatus}`, inline: false });
        }

        await interaction.reply({ embeds: [embed], flags: [64] }); // ephemeral: true (flags: 64)
    },
};