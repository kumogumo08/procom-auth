const bcrypt = require('bcrypt');
const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

const USERS_FILE = path.join(__dirname, 'users.json');
const userDataDir = path.join(__dirname, 'user_data');
if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir);

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(session({
  secret: 'procomSecretKey',
  resave: false,
  saveUninitialized: false,
}));

function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE);
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ✅ ログイン処理（統合済み）
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).send('ユーザーが存在しません');
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).send('パスワードが間違っています');
  }

  req.session.username = username;

  // ✅ user_data の JSON ファイルがなければ作成
  const filePath = path.join(userDataDir, `${username}.json`);
  if (!fs.existsSync(filePath)) {
    const defaultProfile = {
      name: username,
      title: '',
      bio: '',
      photos: [],
      youtubeChannelId: '',
      instagramPostUrl: '',
      xUsername: '',
      tiktokUrls: [],
      calendarEvents: []
    };
    fs.writeFileSync(filePath, JSON.stringify(defaultProfile, null, 2));
    console.log(`✅ ${username}.json を user_data に作成しました`);
  }

  res.json({ success: true, username });
});

// ユーザー登録処理
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  if (users.some(u => u.username === username)) {
    return res.status(409).send('すでに登録されているユーザー名です');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  writeUsers(users);

  // ✅ user_data ファイル作成
  const filePath = path.join(userDataDir, `${username}.json`);
  if (!fs.existsSync(filePath)) {
    const defaultProfile = {
      name: username,
      title: '',
      bio: '',
      photos: [],
      youtubeChannelId: '',
      instagramPostUrl: '',
      xUsername: '',
      tiktokUrls: [],
      calendarEvents: []
    };
    fs.writeFileSync(filePath, JSON.stringify(defaultProfile, null, 2));
    console.log(`✅ ${username}.json を user_data に作成しました（登録時）`);
  }

  res.send('登録成功');
});


// 🔧 プロフィール保存API
app.post('/api/saveProfile', (req, res) => {
  const { username } = req.session;
  if (!username) return res.status(401).send('未ログイン');

  const { name, title, bio } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username);

  if (!user) return res.status(404).send('ユーザーが見つかりません');

  user.profile = { name, title, bio }; // 🧷 profileオブジェクトに保存
  writeUsers(users);
  res.json({ success: true });
});

// 🔧 ユーザーページ表示
app.get('/user/:username', (req, res) => {
  const { username } = req.params;
  const filePath = path.join(__dirname, 'public', 'user.html');

  // 静的ファイルとして送るだけでなく、JSでAPIからデータを取得して使う
  res.sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`Server is running: http://localhost:${PORT}`);
});

// ユーザーデータ読み込み
app.get('/api/user/:username', (req, res) => {
  const filePath = path.join(userDataDir, `${req.params.username}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('ユーザーが見つかりません');
  }
  const data = fs.readFileSync(filePath);
  res.json(JSON.parse(data));
});

// ユーザーデータ保存（ログインしている本人のみ許可）
app.post('/api/user/:username', (req, res) => {
  if (!req.session.username || req.session.username !== req.params.username) {
    return res.status(403).send('権限がありません');
  }

  const filePath = path.join(userDataDir, `${req.params.username}.json`);
  fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
  res.status(200).send('保存しました');
});

// セッション確認（ログイン状態チェック）
app.get('/session', (req, res) => {
  if (req.session.username) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
});

// 🔧 ログアウト処理
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('ログアウトに失敗しました');
    res.clearCookie('connect.sid'); // ← クッキー削除
    res.status(200).send('ログアウト完了');
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('💥 サーバーエラー:', err);
  res.status(500).send('サーバー内部でエラーが発生しました');
});

// 登録ユーザー一覧取得（検索用）
app.get('/api/users', (req, res) => {
  const files = fs.readdirSync(userDataDir);
  const profiles = files.map(filename => {
    try {
      const data = fs.readFileSync(path.join(userDataDir, filename));
      const json = JSON.parse(data);
      return {
        username: path.basename(filename, '.json'),
        name: json.name || '',
        title: json.title || '',
        bio: json.bio || ''
      };
    } catch (err) {
      console.error(`❌ 読み込み失敗: ${filename}`, err);
      return null;
    }
  }).filter(Boolean);
  res.json(profiles);
});

app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'users.html'));
});