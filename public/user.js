const uidFromURL = decodeURIComponent(window.location.pathname.split('/').pop());

window.addEventListener('DOMContentLoaded', async () => {

  let isOwnPage = false; 
  localStorage.removeItem('youtubeChannelId');
  localStorage.removeItem('instagramPostUrl');
  localStorage.removeItem('xUsername');
  localStorage.removeItem('tiktokUrls');
  localStorage.removeItem('calendarEvents');

  const sessionRes = await fetch('/session');
  const session = await sessionRes.json();
  isOwnPage = session.loggedIn && session.uid === uidFromURL;// ← ここでは代入だけ

  try {
    const res = await fetch(`/api/user/${uidFromURL}`);
    if (!res.ok) throw new Error('ユーザーデータ取得失敗');
    const data = await res.json();
    const profile = data.profile || data;

    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = `${profile.name || 'ユーザー'}さんのページ`;

    if (profile.youtubeMode === 'manual') {
      document.querySelector('input[name="youtubeMode"][value="manual"]').checked = true;
      document.getElementById('youtube-latest-input').style.display = 'none';
      document.getElementById('youtube-manual-input').style.display = 'block';

      displayManualYouTubeVideos(profile.manualYouTubeUrls || []);
    } else if (profile.youtubeChannelId) {
      document.querySelector('input[name="youtubeMode"][value="latest"]').checked = true;
      document.getElementById('youtube-latest-input').style.display = 'block';
      document.getElementById('youtube-manual-input').style.display = 'none';
      document.getElementById('channelIdInput').value = profile.youtubeChannelId;
      fetchLatestVideos(profile.youtubeChannelId);
    }

    const xInput = document.getElementById('xUsernameInput');
    const xButton = document.getElementById('xShowBtn');
    const instagramInput = document.getElementById('instagramPostLink');
    const instaBtn = document.getElementById('instaShowBtn');
    const tiktokSection = document.getElementById('tiktok-section');
    const snsSection = document.getElementById('sns-section');
    const editSection = document.getElementById('edit-section');
    const authForms = document.querySelector('.auth-forms');
    const youtubeInputGroup = document.getElementById('youtubeInputGroup');
    const youtubeVideos = document.getElementById('videoContainer');
    const tiktokContainer = document.getElementById('tiktok-container');
    const saveTop = document.getElementById('saveProfileBtnTop');
    const saveBottom = document.getElementById('saveProfileBtnBottom');
    const tiktokInputs = document.querySelectorAll('.tiktok-input');
    const tiktokSaveBtn = document.querySelector('#tiktok-section button');
    const photoUpload = document.querySelector('.photo-upload');
    const eventForm = document.getElementById('event-form');

    if (!isOwnPage) {
      if (photoUpload) photoUpload.style.display = 'none';
      if (eventForm) eventForm.style.display = 'none';
      if (xInput) xInput.style.display = 'none';
      if (xButton) xButton.style.display = 'none';
      if (instagramInput) instagramInput.style.display = 'none';
      if (instaBtn) instaBtn.style.display = 'none';
      if (tiktokSection) tiktokSection.style.display = 'block';
      if (snsSection) snsSection.classList.remove('show');
      if (editSection) editSection.style.display = 'none';
      if (youtubeInputGroup) youtubeInputGroup.style.display = 'none';
      if (youtubeVideos) youtubeVideos.style.display = 'flex';
      if (tiktokContainer) tiktokContainer.style.display = 'flex';
      if (saveTop) saveTop.style.display = 'none';
      if (saveBottom) saveBottom.style.display = 'none';
          tiktokInputs.forEach(input => input.style.display = 'none');
      if (tiktokSaveBtn) tiktokSaveBtn.style.display = 'none';
    } else {
      if (photoUpload) photoUpload.style.display = 'block';
      if (eventForm) eventForm.style.display = 'block';
      if (xInput) xInput.style.display = 'block';
      if (xButton) xButton.style.display = 'inline-block';
      if (instagramInput) instagramInput.style.display = 'block';
      if (instaBtn) instaBtn.style.display = 'inline-block';
      if (tiktokSection) tiktokSection.style.display = 'block';
      if (snsSection) snsSection.classList.add('show');
      if (editSection) editSection.style.display = 'block';
      if (youtubeInputGroup) youtubeInputGroup.style.display = 'block';
      if (youtubeVideos) youtubeVideos.style.display = 'flex';
      if (tiktokContainer) tiktokContainer.style.display = 'flex';
      if (saveTop) saveTop.style.display = 'inline-block';
      if (saveBottom) saveBottom.style.display = 'inline-block';
         tiktokInputs.forEach(input => input.style.display = 'block');
      if (tiktokSaveBtn) tiktokSaveBtn.style.display = 'inline-block';
    }

    // 🔽 プロフィール情報の表示
    const nameEl = document.getElementById('name');
    if (nameEl) nameEl.textContent = profile.name || '';

    const titleEl2 = document.getElementById('title');
    if (titleEl2) titleEl2.textContent = profile.title ? `（${profile.title}）` : '';

    const bioEl = document.getElementById('bio');
    if (bioEl) bioEl.innerHTML = (profile.bio || '').replace(/\n/g, '<br>');

    if (Array.isArray(profile.photos)) {
      updatePhotoSlider(profile.photos, isOwnPage);
    }

      // ✅ SNS表示処理はログイン状態に関係なく実行する
      if (profile.youtubeChannelId) {
        fetchLatestVideos(profile.youtubeChannelId);
      }

      if (profile.instagramPostUrl) {
        embedInstagramPost(profile.instagramPostUrl);
      }

      if (profile.xUsername) {
        showXProfile(profile.xUsername);
      }

      if (Array.isArray(profile.tiktokUrls)) {
        displayTikTokVideos(profile.tiktokUrls);
      }

    if (Array.isArray(profile.calendarEvents)) {
      events = {};
      profile.calendarEvents.forEach(e => {
        if (e.date && Array.isArray(e.events)) {
          events[e.date] = e.events;
        }
      });
      localStorage.setItem('calendarEvents', JSON.stringify(events));
      createCalendar(currentDate, isOwnPage);
    }

const favoriteBtn = document.getElementById('favoriteBtn');

// 自分のページではボタン非表示
if (!isOwnPage && favoriteBtn) {
  favoriteBtn.style.display = 'inline-block';
  favoriteBtn.onclick = async () => {
    const res = await fetch(`/api/favorites/${uidFromURL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      alert('お気に入りに追加しました');
      favoriteBtn.disabled = true;
    } else {
      alert('追加に失敗しました');
    }
  };
} else if (favoriteBtn) {
  favoriteBtn.style.display = 'none';
}
  } catch (err) {
    console.error('❌ ユーザーデータ取得エラー:', err.message);
    alert('ユーザーデータの取得に失敗しました');

    const errorContainer = document.createElement('div');
    errorContainer.style.color = 'red';
    errorContainer.style.padding = '1em';
    errorContainer.innerText = 'ユーザーデータの取得に失敗しました。';
    document.body.prepend(errorContainer);
  }

    if (isOwnPage) {
    const savePhotosBtnEl = document.getElementById('savePhotosBtn');

    if (savePhotosBtnEl) {
    console.log("✅ 写真保存ボタンにイベント登録します");
    savePhotosBtnEl.removeEventListener('click', savePhotos);
    savePhotosBtnEl.addEventListener('click', savePhotos);
}
  }
});

function showXProfile(username) {
  const container = document.getElementById('xProfileDisplay');
  if (!container || !username) return;
  container.innerHTML = `
    <div style="text-align: center;">
      <a href="https://twitter.com/${username}" target="_blank" class="x-profile-link">
        <img class="x-profile-image" src="https://unavatar.io/twitter/${username}" />
        <br>@${username} のプロフィールを見る
      </a>
    </div>
  `;
  container.style.display = 'block'; // 🔧 追加
}

function embedInstagramPost(url) {
  const container = document.getElementById('instagramPostContainer');
  if (!container || !url) return;
  container.innerHTML = `
   <blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14"></blockquote>
  `;

  // 再読み込みスクリプトを明示的に呼び出す
  if (window.instgrm) {
    window.instgrm.Embeds.process();
  }
   container.style.display = 'block'; // 🔧 追加
}

function displayTikTokVideos(urls) {
  const container = document.getElementById('tiktok-container');
  if (!container || !Array.isArray(urls)) return;

  container.innerHTML = ''; // 一度消す

  urls.slice(0, 3).forEach(url => {
    const videoId = extractTikTokVideoId(url);
    if (!videoId) return;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.tiktok.com/embed/${videoId}`;
    iframe.width = "100%";
    iframe.height = "800";
    iframe.allow = "autoplay; encrypted-media";
    iframe.frameBorder = "0";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    iframe.style.marginBottom = '20px';

    container.appendChild(iframe);
  });
}

function extractTikTokVideoId(url) {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggleUserList');
  const container = document.getElementById('userListContainer');
  const userList = document.getElementById('userList');
  let loaded = false;

    // 🔍 セッション確認（非ログイン時は表示しない）
  try {
    const sessionRes = await fetch('/session');
    const session = await sessionRes.json();
    const isLoggedIn = session.loggedIn;

    if (!isLoggedIn) {
      if (toggle) toggle.style.display = 'none';
      if (container) container.style.display = 'none';
      return;
    }
  } catch (err) {
    console.warn("⚠ セッション取得に失敗しました。登録ユーザー一覧は表示しません。", err);
    if (toggle) toggle.style.display = 'none';
    if (container) container.style.display = 'none';
    return;
  }
  
  toggle.addEventListener('click', async () => {
    if (!loaded) {
      // 初回クリック時だけデータ取得
      const res = await fetch('/api/users');
      const users = await res.json();
      users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        const photoHTML = user.photoUrl
        ? `<img src="${user.photoUrl}" alt="${user.name || user.username}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;margin-right:10px;">`
        : `<div style="width:60px;height:60px;border-radius:50%;background:#ccc;margin-right:10px;"></div>`;

        card.innerHTML = `
        <div style="display:flex;align-items:center;">
          ${photoHTML}
          <div>
            <strong>${user.name || user.username}</strong><br>
            <small>${user.title || ''}</small><br>
            <a href="/user/${user.uid}">▶ プロフィール</a>
          </div>
        </div>
        `;
        userList.appendChild(card);
      });
      loaded = true;
    }

    // 表示/非表示の切り替え
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
    toggle.textContent = container.style.display === 'block' ? '▼ 登録ユーザー' : '▶ 登録ユーザー';
  });
});

document.getElementById('generateQrBtn').addEventListener('click', () => {
  const uid = location.pathname.split('/').pop();
  const url = `${location.origin}/user/${uid}`;

  const canvas = document.getElementById('qrCanvas');
  if (!canvas) return alert("❌ canvas要素が見つかりません");
  const ctx = canvas.getContext('2d');

  // 一旦キャンバスクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 一時的なDOMでQRコードを生成（非表示）
  const tempDiv = document.createElement('div');
  tempDiv.style.visibility = 'hidden';
  document.body.appendChild(tempDiv);

  new QRCode(tempDiv, {
    text: url,
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  // QR画像が生成されるのを待つ
  setTimeout(() => {
    const qrImg = tempDiv.querySelector('img');
    if (!qrImg) {
      alert('QRコードの生成に失敗しました');
      document.body.removeChild(tempDiv);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous'; // セキュリティ制限回避（同一オリジンが前提）
    img.src = qrImg.src;

    img.onload = () => {
      ctx.drawImage(img, 0, 0, 200, 200);

      // ロゴを中央に描画
      const logo = new Image();
      logo.src = '/procom-logo.png'; // ← 必ずPNG・透過推奨

      logo.onload = () => {
        const size = 50;
        const x = (canvas.width - size) / 2;
        const y = (canvas.height - size) / 2;
        ctx.drawImage(logo, x, y, size, size);
        document.body.removeChild(tempDiv);
      };

      logo.onerror = () => {
        console.warn('⚠️ ロゴ画像の読み込みに失敗しました');
        document.body.removeChild(tempDiv);
      };
    };
  }, 300);
});

document.getElementById('downloadQrBtn').addEventListener('click', async () => {
  const canvas = document.getElementById('qrCanvas');
  const dataUrl = canvas.toDataURL('image/png');

  // 🔽 ユーザー名を取得（セッションから）
  const sessionRes = await fetch('/session');
  const session = await sessionRes.json();
  const userName = session.name || 'procom-user';  // fallback付き

  const sanitizedName = userName.replace(/[^\w\-]/g, '_'); // 日本語や記号対策

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${sanitizedName}-qr.png`;  // 例: 春咲ミオ-qr.png
  link.click();
});