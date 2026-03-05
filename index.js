require('dotenv').config();
const { 
    Client, GatewayIntentBits, Collection, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, MessageFlags 
} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { loadData, saveData } = require('./utils/dataHandler');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// コマンドハンドリング
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    const settings = loadData('settings');
    const logs = loadData('logs');
    const questions = loadData('questions');
    const userId = interaction.user.id;

    // セッションオブジェクトがない場合の初期化
    if (!settings.sessions) settings.sessions = {};

    // 1. スラッシュコマンド処理
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        // --- 管理者権限チェックを一括で実施 ---
        // サーバー管理者(Administrator)権限を持っていない場合は実行を拒否
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ 
                content: '❌ このコマンドを実行する権限がありません。（管理者専用）', 
                flags: [MessageFlags.Ephemeral] 
            });
        }
        // ------------------------------------

        try {
            // /q-panel の場合のみ公開チャンネルにパネルを送るための特殊処理
            if (interaction.commandName === 'q-panel') {
                const channel = interaction.options.getChannel('channel');
                if (channel) {
                    if (settings.lastPanelChannelId && settings.lastPanelMessageId) {
                        try {
                            const oldChannel = await client.channels.fetch(settings.lastPanelChannelId);
                            const oldMsg = await oldChannel.messages.fetch(settings.lastPanelMessageId);
                            if (oldMsg) await oldMsg.delete();
                        } catch (e) {}
                    }
                    const embed = new EmbedBuilder().setTitle('サーバー認証クイズ').setDescription('下のボタンを押して開始。').setColor(0x00ff00);
                    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('start_quiz').setLabel('クイズを開始').setStyle(ButtonStyle.Primary));
                    const newMsg = await channel.send({ embeds: [embed], components: [row] });
                    settings.lastPanelChannelId = channel.id;
                    settings.lastPanelMessageId = newMsg.id;
                    saveData('settings', settings);
                    
                    return interaction.reply({ content: 'パネルを再生成しました。', flags: [MessageFlags.Ephemeral] });
                }
            }
            
            // 全てのコマンドを実行
            await command.execute(interaction);
        } catch (e) { 
            console.error(e); 
        }
        return;
    }

    // 2. ボタン処理
    if (interaction.isButton()) {
        // ページ切り替えボタン処理
        if (interaction.customId.startsWith('list_prev_') || interaction.customId.startsWith('list_next_')) {
            await interaction.deferUpdate();
            
            const parts = interaction.customId.split('_');
            const direction = parts[1]; // prev or next
            let currentPage = parseInt(parts[2]);
            const searchKeyword = parts.slice(3).join('_'); // 検索ワードを復元

            const newPage = direction === 'prev' ? currentPage - 1 : currentPage + 1;
            
            const qListCommand = client.commands.get('q-list');
            const questions = loadData('questions');
            const payload = qListCommand.createListPayload(questions, newPage, searchKeyword);
            
            await interaction.editReply(payload);
        }
        // クイズ開始
        if (interaction.customId === 'start_quiz') {
            if (questions.length === 0) {
                return interaction.reply({ content: '問題が登録されていません。', flags: [MessageFlags.Ephemeral] });
            }

            const count = Math.min(settings.questionCount || 1, questions.length);
            const selected = [...questions].sort(() => 0.5 - Math.random()).slice(0, count);

            settings.sessions[userId] = {
                currentStep: 0,
                selectedQuestions: selected,
                userAnswers: [],
                currentCorrectIdx: null
            };
            saveData('settings', settings);

            return sendQuestion(interaction, userId, true);
        }

        // 回答ボタン
        if (interaction.customId.startsWith('ans_')) {
            await interaction.deferUpdate();

            const session = settings.sessions[userId];
            if (!session) return;

            const selectedIdx = parseInt(interaction.customId.split('_')[1]);
            
            // 回答を記録 (全問終了まで判定は隠す)
            session.userAnswers.push(selectedIdx === session.currentCorrectIdx);
            session.currentStep++;
            saveData('settings', settings);

            if (session.currentStep >= session.selectedQuestions.length) {
                return finalizeQuiz(interaction, userId);
            } else {
                return sendQuestion(interaction, userId, false);
            }
        }
    }
});

async function sendQuestion(interaction, userId, isFirst) {
    const settings = loadData('settings');
    const session = settings.sessions[userId];
    const q = session.selectedQuestions[session.currentStep];
    
    // 選択肢のシャッフル
    const optionsWithMeta = q.options.map((text, i) => ({ text, isCorrect: i === q.answer }));
    const shuffledOptions = optionsWithMeta.sort(() => 0.5 - Math.random());

    // 現在の正解位置を保存
    session.currentCorrectIdx = shuffledOptions.findIndex(opt => opt.isCorrect);
    saveData('settings', settings);

    const embed = new EmbedBuilder()
        .setTitle(`問題 ${session.currentStep + 1} / ${session.selectedQuestions.length}`)
        .setDescription(q.text)
        .setColor(0x3498db);

    const row = new ActionRowBuilder().addComponents(
        shuffledOptions.map((opt, i) => 
            new ButtonBuilder().setCustomId(`ans_${i}`).setLabel(opt.text).setStyle(ButtonStyle.Secondary)
        )
    );

    const payload = { embeds: [embed], components: [row], flags: [MessageFlags.Ephemeral] };
    if (isFirst) await interaction.reply(payload);
    else await interaction.editReply(payload);
}

async function finalizeQuiz(interaction, userId) {
    const settings = loadData('settings');
    const logs = loadData('logs');
    const session = settings.sessions[userId];
    const member = interaction.member;

    const isAllCorrect = session.userAnswers.every(ans => ans === true);

    if (isAllCorrect) {
        if (settings.roleId) await member.roles.add(settings.roleId).catch(console.error);
        delete settings.sessions[userId];
        saveData('settings', settings);
        
        await interaction.editReply({ content: '🎉 全問終了しました。判定の結果、合格です！認証を完了しました。', embeds: [], components: [] });
        logToAdmin(interaction.guild, `✅ [認証成功] ${interaction.user.tag} (ID: ${userId}) - 全問正解`);
    } else {
        const stats = logs.userStats[userId] || { misses: 0 };
        stats.misses += 1;
        logs.userStats[userId] = stats;
        saveData('logs', logs);

        delete settings.sessions[userId];
        saveData('settings', settings);

        logToAdmin(interaction.guild, `❌ [認証失敗] ${interaction.user.tag} (ID: ${userId}) - 不正解あり (累計ミス: ${stats.misses}/5)`);

        if (stats.misses >= 5) {
            await member.ban({ reason: '認証クイズ5回失敗' }).catch(console.error);
            logToAdmin(interaction.guild, `🚨 [BAN] ${interaction.user.tag}`);
            return;
        } else if (stats.misses === 3) {
            await member.kick('認証クイズ3回失敗').catch(console.error);
            logToAdmin(interaction.guild, `👞 [Kick] ${interaction.user.tag}`);
            return;
        }

        await interaction.editReply({ 
            content: `❌ 全問終了しました。判定の結果、不合格箇所があったため認証に失敗しました。最初からやり直してください。\n(現在のミス回数: ${stats.misses}/5)`, 
            embeds: [], components: [] 
        });
    }
}

function logToAdmin(guild, message) {
    const settings = loadData('settings');
    if (!settings.adminChannelId) return;
    const channel = guild.channels.cache.get(settings.adminChannelId);
    if (channel) channel.send(message);
}

client.login(process.env.DISCORD_TOKEN);