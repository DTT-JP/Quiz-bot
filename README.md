# Quiz-bot
Discord.jsを使用したDiscord用BOT

## 特徴
* Discord.jsを使用し、Discord.pyより軽量化
* シングルサーバー向けで導入が簡単

## セットアップ
Debian/Ubuntu
Node.jsから
```
sudo apt update
sudo apt install nodejs npm
sudo npm install n -g
```
BOT本体
```
sudo npm install discord.js dotenv pm2
git clone https://github.com/DTT-JP/Quiz-bot/
cd Quiz-bot
```
ここでenv.templateをもとに.envファイルを作成してください
```
npm install
pm2 start index.js --name "quiz-bot"
```

## ライセンス
MIT
このコードはGeminiによって生成されました
