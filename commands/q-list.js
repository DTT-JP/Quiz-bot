const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadData } = require('../utils/dataHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('q-list')
        .setDescription('登録されている問題の一覧を表示します')
        .addStringOption(option => option.setName('id').setDescription('表示したい問題のID（指定するとその問題のみ表示）'))
        .addIntegerOption(option => option.setName('page').setDescription('表示するページ番号').setMinValue(1))
        .addStringOption(option => option.setName('search').setDescription('検索キーワード'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        const questions = loadData('questions');
        const targetId = interaction.options.getString('id');
        const search = interaction.options.getString('search')?.toLowerCase() || "";
        const page = interaction.options.getInteger('page') || 1;

        // ID指定がある場合の特殊処理
        if (targetId) {
            const q = questions.find(item => item.id.toString() === targetId.toString());
            if (!q) {
                return interaction.reply({ content: `ID: ${targetId} の問題が見つかりませんでした。`, flags: [64] });
            }
            const embed = new EmbedBuilder()
                .setTitle(`問題詳細 (ID: ${q.id})`)
                .setColor(0x00AE86)
                .addFields({ 
                    name: `問: ${q.text}`, 
                    value: q.options.map((opt, i) => i === q.answer ? `✅ **${opt}**` : `・${opt}`).join('\n')
                });
            return interaction.reply({ embeds: [embed], flags: [64] });
        }

        const response = this.createListPayload(questions, page, search);
        await interaction.reply({ ...response, flags: [64] });
    },

    createListPayload(questions, page, search) {
        const pageSize = 5;
        let filtered = questions;
        if (search) {
            filtered = questions.filter(q => 
                q.text.toLowerCase().includes(search) || 
                q.options.some(opt => opt.toLowerCase().includes(search))
            );
        }

        if (filtered.length === 0) {
            return { content: '該当する問題が見つかりませんでした。', embeds: [], components: [] };
        }

        const maxPages = Math.ceil(filtered.length / pageSize);
        const currentPage = Math.max(1, Math.min(page, maxPages));
        const start = (currentPage - 1) * pageSize;
        const pageItems = filtered.slice(start, start + pageSize);

        const embed = new EmbedBuilder()
            .setTitle(search ? `検索結果: "${search}"` : 'クイズ問題一覧')
            .setColor(0x00AE86)
            .setFooter({ text: `ページ ${currentPage} / ${maxPages} (合計 ${filtered.length} 件)` });

        pageItems.forEach(q => {
            const optionsText = q.options.map((opt, i) => i === q.answer ? `✅ **${opt}**` : `・${opt}`).join('\n');
            embed.addFields({ name: `ID: ${q.id}`, value: `**問: ${q.text}**\n${optionsText}\n---` });
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`list_prev_${currentPage}_${search}`)
                .setLabel('⬅️ 前へ')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 1),
            new ButtonBuilder()
                .setCustomId(`list_next_${currentPage}_${search}`)
                .setLabel('次へ ➡️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === maxPages)
        );

        return { embeds: [embed], components: [row] };
    }
};