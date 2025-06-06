//server.jsです。
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
const bodyParser = require('body-parser');
require('dotenv').config();
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Firebase Admin SDK
const admin = require('firebase-admin');

// 🔄 JSON文字列をパースして認証情報として渡す
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY_JSON);

// 🔧 改行コードを正規の改行に変換
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'procom-fea80.firebasestorage.app' // ← あなたのプロジェクトIDに合わせて変更
  });
}

const storage = admin.storage();
const bucket = storage.bucket();
const bucketName = bucket.name;
const db = admin.firestore();
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.static('public'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SECRET_KEY || 'fallbackSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: 'none'
  }
}));

function isValidPassword(password) {
  const lengthOK = password.length >= 8 && password.length <= 32;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password); // 記号が含まれていたら NG

  return lengthOK && hasUpper && hasLower && hasNumber && !hasSymbol;
}

// ユーザー登録
// ✅ registerルートの更新（username, email, password で登録）
app.post('/register', async (req, res) => {
  let { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send('すべての項目を入力してください');
  }

  if (!isValidPassword(password)) {
    return res.status(400).send('パスワードは8〜32文字で、大文字・小文字・数字を含み、記号は使えません');
  }

  username = username.trim();
  email = email.trim().toLowerCase();

  // ✅ 重複チェック（username）
  const usernameSnapshot = await db.collection('users')
    .where('profile.name', '==', username)
    .get();
  if (!usernameSnapshot.empty) {
    return res.status(409).send('ユーザー名は既に使用されています');
  }

  // ✅ 重複チェック（email）
  const emailSnapshot = await db.collection('users')
    .where('email', '==', email)
    .get();
  if (!emailSnapshot.empty) {
    return res.status(409).send('メールアドレスは既に使用されています');
  }

  // ✅ 固有のUIDを生成してそのIDで登録
  const uid = uuidv4();
  const hashed = await bcrypt.hash(password, 10);
  const userRef = db.collection('users').doc(uid);

  await userRef.set({
    uid,
    email,
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

  // ✅ セッションに保存
  req.session.uid = uid;

  // ✅ ユーザーページへリダイレクト
  res.status(200).json({ redirectTo: `/user/${uid}` });
});

// ✅ loginルートの更新（email でログイン）
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();
  if (snapshot.empty) {
    return res.status(401).send('ユーザーが存在しません');
  }

  const userDoc = snapshot.docs[0];
  const user = userDoc.data();

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).send('パスワードが間違っています');
  }

 const username = user.profile?.name || userDoc.id; // ← 念のためチェック

  req.session.uid = userDoc.id;

  req.session.save(err => {
    if (err) {
      console.error("❌ セッション保存エラー:", err);
      return res.status(500).send('セッション保存に失敗しました');
    }

     res.redirect(`/user/${userDoc.id}`);
  });
});

// ログアウト
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('❌ セッション破棄失敗:', err);
      return res.status(500).send('ログアウトに失敗しました');
    }

    res.clearCookie('connect.sid', { path: '/' }); // 念のため path も指定
    return res.redirect('/top.html'); // return を付けて終了を明示
  });
});


// セッションチェック
app.get('/session', async (req, res) => {
  if (req.session.uid) {
    const uid = req.session.uid;
    const doc = await db.collection('users').doc(uid).get();
    const name = doc.exists ? doc.data()?.profile?.name || '（未設定）' : '（未設定）';
    res.json({ loggedIn: true, uid, name });
  } else {
    res.json({ loggedIn: false });
  }
});

function cleanData(obj) {
  const cleaned = {};
  for (const key in obj) {
    const value = obj[key];
    // 空文字列・空配列・undefined/null を除外
    if (
      value !== undefined &&
      value !== null &&
      !(typeof value === 'string' && value.trim() === '') &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// 🔧 ユーザーデータ保存（ログインしている本人のみ許可）
app.post('/api/user/:uid', async (req, res) => {
  if (!req.session.uid || req.session.uid !== req.params.uid) {
    return res.status(403).send('権限がありません');
  }
  const userRef = db.collection('users').doc(req.params.uid);
  const incoming = req.body;
  console.log("📩 POST /api/user - 受信データ:", incoming);

  const profile = incoming.profile;
  console.log("📦 profile内容:", profile);

  if (!profile || typeof profile !== 'object') {
    return res.status(400).send('プロフィール情報が正しくありません');
  }

  try {
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).send('ユーザーが存在しません');

    const existing = userDoc.data();
    const existingProfile = existing.profile || {};

    // calendarEventsの整形
    if (
      profile.calendarEvents &&
      typeof profile.calendarEvents === 'object' &&
      !Array.isArray(profile.calendarEvents)
    ) {
      profile.calendarEvents = Object.entries(profile.calendarEvents)
        .filter(([date, events]) => /^\d{4}-\d{2}-\d{2}$/.test(date))
        .map(([date, events]) => ({
          date,
          events: Array.isArray(events) ? events : [events]
        }));
    }

    if (Array.isArray(profile.calendarEvents)) {
      profile.calendarEvents = profile.calendarEvents
        .filter(e => typeof e === 'object' && e.date && Array.isArray(e.events))
        .map(e => ({
          date: String(e.date),
          events: e.events.map(ev => String(ev))
        }));
    } else {
      delete profile.calendarEvents;
    }

    // base64画像がある場合はアップロード処理
  if (Array.isArray(incoming.photos)) {
  if (incoming.photos.some(photo => photo.startsWith('data:image/'))) {
    const uploadedPhotoUrls = [];

    // 古い画像削除
    if (existing.profile?.photos && Array.isArray(existing.profile.photos)) {
      const deletedSet = new Set();
      for (const oldUrl of existing.profile.photos) {
        try {
          const match = decodeURIComponent(oldUrl).match(/\/o\/(.+)\?alt=media/);
          if (match && match[1]) {
            const oldFilePath = match[1];
            if (!deletedSet.has(oldFilePath)) {
              await bucket.file(oldFilePath).delete();
              console.log(`🗑️ 削除済: ${oldFilePath}`);
              deletedSet.add(oldFilePath);
            }
          }
        } catch (err) {
          console.warn(`⚠️ 削除失敗: ${oldUrl}`, err.message);
        }
      }
    }

    // 新しい画像アップロード
    for (const base64Data of incoming.photos) {
      const matches = base64Data.match(/^data:(image\/.+);base64,(.+)$/);
      if (!matches) continue;

      const contentType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const ext = contentType.split('/')[1];
      const fileName = `photos/${req.params.uid}/${uuidv4()}.${ext}`;
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: {
          contentType,
          metadata: {
            firebaseStorageDownloadTokens: uuidv4(),
          },
        },
      });

      const [metadata] = await file.getMetadata();
      const token = metadata.metadata.firebaseStorageDownloadTokens;
      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${token}`;
      uploadedPhotoUrls.push(downloadURL);
    }

    profile.photos = incoming.photos.map((photo, i) => {
  if (typeof photo === 'object') return photo; // すでにurl+positionならそのまま
  return {
    url: uploadedPhotoUrls[i],
    position: incoming.positions?.[i] ?? '50'  // ← ここはclient側で送る必要あり
  };
});

  } else {
    // base64ではなくURL配列の場合
    profile.photos = incoming.photos;
  }
}


    // 🔧 profileの正規化
      const cleanedProfile = cleanData({
      name: profile.name ?? existingProfile.name ?? '',
      title: profile.title ?? existingProfile.title ?? '',
      bio: profile.bio ?? existingProfile.bio ?? '',
      calendarEvents: profile.calendarEvents ?? existingProfile.calendarEvents ?? [],
      photos: profile.photos ?? existingProfile.photos ?? [],
      youtubeChannelId: profile.youtubeChannelId ?? existingProfile.youtubeChannelId ?? '',
      instagramPostUrl: profile.instagramPostUrl ?? existingProfile.instagramPostUrl ?? '',
      xUsername: profile.xUsername ?? existingProfile.xUsername ?? '',
      tiktokUrls: profile.tiktokUrls ?? existingProfile.tiktokUrls ?? [],
      youtubeMode: profile.youtubeMode ?? existingProfile.youtubeMode ?? 'latest',
      manualYouTubeUrls: profile.manualYouTubeUrls ?? existingProfile.manualYouTubeUrls ?? []
});

    // 保存
    await userRef.set({ profile: cleanedProfile }, { merge: true });
    res.send('User profile updated');

  } catch (err) {
    console.error("Firestore保存エラー:", err);
    res.status(500).send('保存に失敗しました');
  }
});

// 🔍 ユーザーデータ取得（プロフィール表示用）
app.get('/api/user/:uid', async (req, res) => {
  const uid = req.params.uid;
  const doc = await db.collection('users').doc(uid).get();

  try {
    // 🔍 profile.name から uid を探す
  if (!doc.exists) {
    return res.status(404).json({ error: 'ユーザーが見つかりません' });
  }

    // 🔑 最初の一致ドキュメントを取得
    const data = doc.data();
    const profile = data.profile || {};

      res.json({
        profile: Object.assign({
          name: '',
          title: '',
          bio: '',
          photos: [],
          youtubeChannelId: '',
          instagramPostUrl: '',
          xUsername: '',
          tiktokUrls: [],
          calendarEvents: [],
          youtubeMode: 'latest',
          manualYouTubeUrls: []
        }, data.profile || {})
      });

  } catch (err) {
    console.error('❌ ユーザーデータ取得エラー:', err);
    res.status(500).send('ユーザーデータの取得に失敗しました');
  }
});


// ユーザー一覧取得（検索用）
app.get('/api/users', async (req, res) => {
  const snapshot = await db.collection('users').get();
  const list = snapshot.docs.map(doc => ({
    uid: doc.id,
    profile: doc.data().profile || {}
  }));
  res.json(list);
});

// お気に入り追加
app.post('/api/favorites/:target', async (req, res) => {
 const sessionUser = req.session.uid;
  const targetUser = req.params.target;

  if (!sessionUser || sessionUser === targetUser) return res.status(400).send('不正な操作');

  const userRef = db.collection('users').doc(sessionUser);
  await userRef.set({
    favorites: admin.firestore.FieldValue.arrayUnion(targetUser)
  }, { merge: true });

  res.send('追加完了');
});

app.get('/api/favorites', async (req, res) => {
  const sessionUser = req.session.uid;
  if (!sessionUser) return res.status(401).send('ログインが必要です');

  try {
    const userSnap = await db.collection('users').doc(sessionUser).get();
    if (!userSnap.exists) return res.status(404).send('ユーザーが見つかりません');

    const data = userSnap.data();
    const favorites = data.favorites || [];

    const results = [];
    for (const fav of favorites) {
      const favSnap = await db.collection('users').doc(fav).get();
      if (favSnap.exists) {
        const profile = favSnap.data().profile || {};
        results.push({
          username: fav,
          name: profile.name || '',
          title: profile.title || ''
        });
      }
    }

    res.json(results);
  } catch (err) {
    console.error('❌ お気に入り取得エラー:', err);
    res.status(500).send('内部エラー');
  }
});

// アカウントページへのアクセスをセッションで保護
app.get('/account.html', (req, res, next) => {
  if (!req.session.uid) {
    // 未ログインならリダイレクト
    return res.redirect('/top.html');
  }
 res.sendFile(path.join(__dirname, 'public', 'account.html'));
});
// HTML表示
app.get('/user/:uid', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user.html'));
});
app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'users.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'top.html'));
});

// ✅ アカウント削除（Firestore + Storage + セッション削除）
app.delete('/account/delete', async (req, res) => {
  if (!req.session || !req.session.uid) {
    return res.status(401).send('ログインが必要です');
  }

 const uid = req.session.uid;

  try {
    // Firestoreからユーザー削除
    await db.collection('users').doc(uid).delete();
    console.log(`✅ Firestore: ${uid} を削除しました`);

    // Storageから画像削除
    const [files] = await bucket.getFiles({ prefix: `photos/${uid}` });
    const deletionPromises = files.map(file => file.delete());
    await Promise.all(deletionPromises);
    console.log(`✅ Storage: ${uid} の写真を削除しました`);

    // セッション破棄
    req.session.destroy(() => {
      res.clearCookie('connect.sid'); // ← Cookie も削除
      res.json({ success: true });  // ← 退会完了ページに遷移
    });

  } catch (err) {
    console.error("❌ 退会処理エラー:", err);
    res.status(500).send('退会処理に失敗しました');
  }
});

app.get('/deleted.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'deleted.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Server running on http://localhost:${PORT}`);
});

// 🔥 古い写真削除API（savePhotos()から呼び出し用）
app.post('/api/deletePhotos', async (req, res) => {
  const { urls } = req.body;

  if (!Array.isArray(urls)) {
    return res.status(400).send('不正な形式です');
  }

  if (!req.session.uid) {
    return res.status(403).send('ログインが必要です');
  }

  try {
    const deletedSet = new Set();

    for (const url of urls) {
      try {
        const match = decodeURIComponent(url).match(/\/o\/(.+)\?alt=media/);
        if (match && match[1]) {
          const filePath = match[1];

          // 自分のフォルダ以外の削除を防ぐ
          if (!filePath.startsWith(`photos/${req.session.uid}/`)) {
            console.warn(`⚠️ 不正なファイルパス: ${filePath}`);
            continue;
          }

          if (!deletedSet.has(filePath)) {
            await bucket.file(filePath).delete();
            console.log(`🗑️ 削除完了: ${filePath}`);
            deletedSet.add(filePath);
          }
        }
      } catch (err) {
        console.warn(`⚠️ 削除失敗: ${url}`, err.message);
      }
    }

    res.send('写真の削除完了');
  } catch (err) {
    console.error('❌ 写真削除エラー:', err);
    res.status(500).send('写真の削除に失敗しました');
  }
});

app.post('/api/uploadPhotos', async (req, res) => {
  const uid = req.session.uid;
  if (!uid) {
    return res.status(401).send('未ログインです');
  }

  const { base64Images } = req.body;
  if (!Array.isArray(base64Images) || base64Images.length === 0) {
    return res.status(400).send('画像データが不正です');
  }

  try {
    const folder = `photos/${uid}/`;
    const [files] = await bucket.getFiles({ prefix: folder });

    // 古い画像削除
    for (const file of files) {
      try {
        await file.delete();
        console.log(`🗑️ 削除完了: ${file.name}`);
      } catch (err) {
        console.warn(`⚠️ 削除失敗: ${file.name}`, err.message);
      }
    }

    const urls = [];

    for (const base64 of base64Images) {
      const matches = base64.match(/^data:(image\/.+);base64,(.+)$/);
      if (!matches) continue;

      const contentType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const ext = contentType.split('/')[1];
      const fileName = `${folder}${uuidv4()}.${ext}`;
      const file = storage.bucket().file(fileName);

      const token = uuidv4();
      await file.save(buffer, {
        metadata: {
          contentType,
          metadata: {
            firebaseStorageDownloadTokens: token
          }
        }
      });

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(fileName)}?alt=media&token=${token}`;
      urls.push(publicUrl);
    }

    res.json({ urls });
  } catch (err) {
    console.error('❌ Firebase Storageアップロードエラー:', err);
    res.status(500).send('アップロード失敗');
  }
});


const saltRounds = 10;

app.post('/account/update', async (req, res) => {
  if (!req.session || !req.session.uid) {
    return res.status(401).send('ログインしていません');
  }

  const uid = req.session.uid;
  const { newUsername, newEmail, newPassword } = req.body;

  try {
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).send('ユーザーが見つかりませんでした');
    }

    const userData = userDoc.data();

    const updates = {};

    // ユーザー名変更
    // if (newUsername && newUsername !== currentUsername) {
    //   const newUserRef = db.collection('users').doc(newUsername);
    //   const newUserDoc = await newUserRef.get();
    //   if (newUserDoc.exists) {
    //     return res.status(409).send('そのユーザー名は既に使われています');
    //   }

    //   // Firestore上のドキュメントを新しいIDにコピーして古い方を削除
    //   await newUserRef.set(userData);
    //   await userDocRef.delete();

    //   // セッションを更新
    //   req.session.username = newUsername;
    //   return res.status(200).send(JSON.stringify({ username: newUsername }));
    // }
    if (newUsername) {
    updates.username = newUsername;
    req.session.username = newUsername; // セッションにも反映
  }

    if (Object.keys(updates).length > 0) {
    await userDocRef.update(updates);
  }

    // メール変更
    if (newEmail) {
      updates.email = newEmail;
    }

    // パスワード変更
    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, saltRounds);
      updates.password = hashed;
    }

    if (Object.keys(updates).length > 0) {
      await userDocRef.update(updates);
    }

    return res.status(200).send(JSON.stringify({ username: currentUsername }));
  } catch (err) {
    console.error('アカウント更新エラー:', err);
    return res.status(500).send('アカウント情報の更新に失敗しました');
  }
});

// ✅ YouTube APIプロキシ
app.get('/api/youtube/:channelId', async (req, res) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = req.params.channelId;

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=5`
    );

    if (!response.ok) {
      console.error('❌ YouTube APIエラー:', response.statusText);
      return res.status(500).send('YouTubeデータの取得に失敗しました');
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('❌ YouTube API通信エラー:', err);
    res.status(500).send('YouTube APIへの通信に失敗しました');
  }
});
