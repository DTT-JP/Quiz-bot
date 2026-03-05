require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// 各コマンドファイルからデータを読み込む
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.warn(`[警告] ${filePath} のコマンドには "data" または "execute" プロパティがありません。`);
    }
}

// RESTインスタンスの作成
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// コマンドのデプロイ実行
(async () => {
    try {
        console.log(`${commands.length} 個のアプリケーション (/) コマンドの再読み込みを開始します。`);

        // 特定のサーバー(Guild)に対してコマンドを登録
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log(`${data.length} 個のアプリケーション (/) コマンドの登録に成功しました。`);
    } catch (error) {
        console.error(error);
    }
})();