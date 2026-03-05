const fs = require('fs');
const path = require('path');

const paths = {
    settings: path.join(__dirname, '../data/settings.json'),
    logs: path.join(__dirname, '../data/logs.json'),
    questions: path.join(__dirname, '../data/questions.json')
};

// 起動時に適用する初期値
const defaults = {
    settings: { 
        panelChannelId: null, 
        adminChannelId: null, 
        questionCount: 1, 
        roleId: null,
        sessions: {} 
    },
    logs: { 
        userStats: {}, 
        history: [],
    },
    questions: []
};

const loadData = (type) => {
    try {
        // フォルダが存在しない場合は作成
        const dir = path.dirname(paths[type]);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // ファイルが存在しない、または中身が空（0バイト）の場合
        if (!fs.existsSync(paths[type]) || fs.statSync(paths[type]).size === 0) {
            fs.writeFileSync(paths[type], JSON.stringify(defaults[type], null, 2));
            return defaults[type];
        }

        const content = fs.readFileSync(paths[type], 'utf8');
        return JSON.parse(content);
    } catch (e) {
        console.error(`[Error] ${type} の読み込み/初期化に失敗しました。`, e);
        // 読み込み失敗時はメモリ上のデフォルト値を返してクラッシュを防ぐ
        return defaults[type];
    }
};

const saveData = (type, data) => {
    fs.writeFileSync(paths[type], JSON.stringify(data, null, 2));
};



module.exports = { loadData, saveData };