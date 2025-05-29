const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Firebase Admin SDK
const admin = require('firebase-admin');
const serviceAccount = require('/etc/secrets/firebase-key.json'); // ←秘密鍵ファイル名に注意

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.use(express.static('public'));
app.use(bodyParser.json({ limit: '10mb' })); // ← 5mb → 10mb に拡張
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(session({
  secret: 'procomSecretKey',
  resave: false,
  saveUninitialized: false,
}));

// ユーザー登録
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const userRef = db.collection('users').doc(username);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    return res.status(409).send('すでに登録されています');
  }

  const hashed = await bcrypt.hash(password, 10);
  await userRef.set({
    password: hashed,
    profile: {
      name: username,
      title: '',
      bio: '',
      photos: [],
      youtubeChannelId: '',
      instagramPostUrl: '',
      xUsername: '',
      tiktokUrls: [],
      calendarEvents: []
    }
  });

  res.send('登録成功');
});

// ログイン
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const userRef = db.collection('users').doc(username);
  const userDoc = await userRef.get();

  if (!userDoc.exists) return res.status(401).send('ユーザーが存在しません');

  const user = userDoc.data();
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).send('パスワードが間違っています');

  req.session.username = username;
  res.json({ success: true, username });
});

// ログアウト
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('ログアウトに失敗しました');
    res.clearCookie('connect.sid');
    res.status(200).send('ログアウト完了');
  });
});

// セッションチェック
app.get('/session', (req, res) => {
  if (req.session.username) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
});

// ユーザーデータ取得
app.get('/api/user/:username', async (req, res) => {
  const userRef = db.collection('users').doc(req.params.username);
  const userDoc = await userRef.get();

  if (!userDoc.exists) return res.status(404).send('ユーザーが見つかりません');

  const data = userDoc.data().profile;
  res.json(data);
});

// 🔧 ユーザーデータ保存（ログインしている本人のみ許可）
app.post('/api/user/:username', async (req, res) => {
  if (!req.session.username || req.session.username !== req.params.username) {
    return res.status(403).send('権限がありません');
  }

  const userRef = db.collection('users').doc(req.params.username);

  try {
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).send('ユーザーが存在しません');

    const existing = userDoc.data();
    await userRef.set({
    ...existing,
    profile: {
    ...existing.profile,
    ...req.body
  }
});

    res.status(200).send('Firestoreに保存完了');
  } catch (err) {
    console.error('Firestore保存エラー:', err);
    res.status(500).send('保存に失敗しました');
  }
});

function saveProfileAndEventsToServer() {
  const username = localStorage.getItem('loggedInUsername');
  const name = document.getElementById('nameInput')?.value.trim() || '';
  const title = document.getElementById('titleInput')?.value.trim() || '';
  const bio = document.getElementById('bioInput')?.value.trim() || '';
  const photos = JSON.parse(localStorage.getItem('userPhotos') || '[]');
  const youtubeChannelId = localStorage.getItem('youtubeChannelId') || '';
  const instagramPostUrl = localStorage.getItem('instagramPostUrl') || '';
  const xUsername = localStorage.getItem('xUsername') || '';
  const tiktokUrls = JSON.parse(localStorage.getItem('tiktokUrls') || '[]');
  const calendarEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');

  const data = {
    name,
    title,
    bio,
    photos,
    youtubeChannelId,
    instagramPostUrl,
    xUsername,
    tiktokUrls,
    calendarEvents
  };

  console.log("送信データ確認:", data);
  fetch(`/api/user/${username}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // ← これを必ず追加！
    body: JSON.stringify(data)
  })
  .then(res => res.text())
  .then(msg => console.log("✅ 保存成功:", msg))
  .catch(err => console.error("❌ 保存失敗:", err));
}

saveYouTubeChannelId = function () {
  const input = document.getElementById('channelIdInput').value.trim();
  const match = input.match(/(UC[\w-]+)/);
  if (match) {
    const channelId = match[1];
    localStorage.setItem('youtubeChannelId', channelId);
    fetchLatestVideos(channelId);
    saveProfileAndEventsToServer();  // ← これを忘れずに
  }
};

// ユーザー一覧取得（検索用）
app.get('/api/users', async (req, res) => {
  const snapshot = await db.collection('users').get();
  const list = snapshot.docs.map(doc => {
    const profile = doc.data().profile || {};
    return {
      username: doc.id,
      name: profile.name || '',
      title: profile.title || '',
      bio: profile.bio || ''
    };
  });
  res.json(list);
});

// HTML表示
app.get('/user/:username', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user.html'));
});
app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'users.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Server running on http://localhost:${PORT}`);
});
