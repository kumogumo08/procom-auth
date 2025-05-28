
// firebase.js（サーバー用）
const admin = require('firebase-admin');
const serviceAccount = require('./procom-fea80-firebase-adminsdk-fbsvc-c01a1f83ad.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
module.exports = db;

// server.jsの中で
const db = require('./firebase');

app.post('/api/user/:username', async (req, res) => {
  const { username } = req.params;
  const data = req.body;

  try {
    await db.collection('users').doc(username).set(data);
    res.send('Firebaseに保存しました');
  } catch (err) {
    console.error('Firestore保存エラー:', err);
    res.status(500).send('保存に失敗しました');
  }
});
