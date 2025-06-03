//youtube.jsです
// ==== X（旧Twitter）プロフィール表示機能 ====
window.showXProfile = function () {
console.log("✅ showXProfile() が呼ばれました");

  const username = document.getElementById('xUsernameInput').value.trim();
  console.log("▶ 入力された username:", username);

  const container = document.getElementById('xProfileDisplay');
   if (!container) {
    console.error("❌ container (xProfileDisplay) が見つかりません");
    return;
  }

  if (!username) {
    console.warn("⚠ username が未入力です");
    container.innerHTML = 'ユーザー名を入力してください。';
    return;
  }

  console.log("🛠 XプロフィールHTMLを埋め込みます");
  const profileUrl = `https://twitter.com/${username}`;

  container.innerHTML = `
    <div style="text-align: center;">
      <a href="${profileUrl}" target="_blank" style="display: block; font-weight: bold; margin-bottom: 8px;">
        @${username} さんのXプロフィールを見る
      </a>
      <a href="${profileUrl}" target="_blank">
        <img src="/x-profile.png" alt="Xプロフィール画像" style="width:100%; max-width:500px; border-radius:12px;" />
      </a>
    </div>
  `;

  localStorage.setItem('xUsername', username);
};

// ==== Instagram投稿埋め込み機能 ====
// isUserAction を受け取る（デフォルト: true）
window.embedInstagramPost = function (isUserAction = true) {
  const url = document.getElementById('instagramPostLink').value;
  const container = document.getElementById('instagramPostContainer');

  if (!url || !url.includes('instagram.com')) {
    container.innerHTML = '正しいInstagram投稿のURLを入力してください。';
    return;
  }

  container.innerHTML = `
    <blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14" style="width:100%; max-width:540px;"></blockquote>
  `;

  localStorage.setItem('instagramPostUrl', url);

  if (window.instgrm) {
    window.instgrm.Embeds.process();
  } else {
    const script = document.createElement('script');
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }

  // ✅ 初期表示のときは保存させない
if (isUserAction) {
  console.log("👍 ユーザー操作によりSNSが変更されました");
  // ここでは保存しない（ボタンでのみ保存）
} else {
  console.log("📄 初期表示なのでプロフィール保存はスキップ");
}
};

window.saveYouTubeChannelId = function () {
  const input = document.getElementById('channelIdInput').value.trim();
  if (!input) return;

  const match = input.match(/(UC[\w-]+)/);
  if (!match) {
    alert('チャンネルID（UCから始まるID）を入力してください');
    return;
  }

  const channelId = match[1];
  localStorage.setItem('youtubeChannelId', channelId);
  fetchLatestVideos(channelId);
};

function fetchLatestVideos(channelId = null) {
  channelId = channelId || localStorage.getItem('youtubeChannelId');
  if (!channelId) return;

  // 🔁 10分キャッシュ確認
  const cacheKey = `cachedVideos_${channelId}`;
  const cacheTimeKey = `lastFetchTime_${channelId}`;
  const now = Date.now();
  const lastFetch = localStorage.getItem(cacheTimeKey);

  if (lastFetch && now - parseInt(lastFetch, 10) < 10 * 60 * 1000) {
    console.log('📦 キャッシュからYouTube動画を表示します');
    const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    displayYouTubeVideos(cached);
    return;
  }

  // ✅ サーバー経由でAPI呼び出し
  fetch(`/api/youtube/${channelId}`)
    .then(res => {
      if (!res.ok) throw new Error('ユーザーデータの取得に失敗しました。');
      return res.json();
    })
    .then(data => {
      const videos = (data.items || []).filter(item => item.id.kind === 'youtube#video');
      if (videos.length === 0) throw new Error('動画が見つかりません');

      localStorage.setItem(cacheKey, JSON.stringify(videos));
      localStorage.setItem(cacheTimeKey, now.toString());

      displayYouTubeVideos(videos);
    })
    .catch(err => {
      console.error('YouTube API エラー:', err);
      document.getElementById('videoContainer').innerText = '動画を表示できませんでした。';
    });
}

function displayYouTubeVideos(videos) {
  const videoHTML = videos.slice(0, 2).map(video => {
    const { videoId } = video.id;
    const { title } = video.snippet;
    return `
      <div class="youtube-card">
        <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
        <p>${title}</p>
      </div>
    `;
  }).join('');
  document.getElementById('videoContainer').innerHTML = videoHTML;
}

// ==== TikTok埋め込み ====
window.saveTikTokVideos = function (isUserAction = true) {
  const inputs = document.querySelectorAll('.tiktok-input');
  const urls = Array.from(inputs).map(input => input.value.trim())
    .filter(url => url.includes('tiktok.com/@') && url.includes('/video/'));

  console.log('✅ 保存対象URL:', urls);

  if (urls.length === 0) {
    alert('TikTokの正しい動画URLを1つ以上入力してください。');
    return;
  }

  localStorage.setItem('tiktokUrls', JSON.stringify(urls));
  displayTikTokVideos(urls);

    if (isUserAction) {
      console.log("👍 ユーザー操作によりSNSが変更されました");
      // ここでは保存しない（ボタンでのみ保存）
    } else {
      console.log("📄 初期表示なのでプロフィール保存はスキップ");
    }
  };

function displayTikTokVideos(urls = null) {
  const container = document.getElementById('tiktok-container');
  container.innerHTML = '';

  const savedUrls = urls || JSON.parse(localStorage.getItem('tiktokUrls') || '[]');
  savedUrls.forEach(url => {
    const match = url.match(/\/video\/(\d{10,})/);
    if (!match) return;
    const videoId = match[1];

    const block = document.createElement('blockquote');
    block.className = 'tiktok-embed';
    block.setAttribute('cite', url);
    block.setAttribute('data-video-id', videoId);
    block.innerHTML = '<section></section>';
    container.appendChild(block);
  });

  const script = document.createElement('script');
  script.src = 'https://www.tiktok.com/embed.js';
  script.async = true;
  document.body.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
  const latestInputSection = document.getElementById('youtube-latest-input');
  const manualInputSection = document.getElementById('youtube-manual-input');
  const modeRadios = document.querySelectorAll('input[name="youtubeMode"]');

  const updateModeDisplay = (mode) => {
    if (mode === 'manual') {
      latestInputSection.style.display = 'none';
      manualInputSection.style.display = 'block';
    } else {
      latestInputSection.style.display = 'block';
      manualInputSection.style.display = 'none';
    }
  };

  modeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const selectedMode = document.querySelector('input[name="youtubeMode"]:checked')?.value;
      updateModeDisplay(selectedMode);
    });
  });

  // 初期値の表示モードをlocalStorageから復元
  const savedMode = localStorage.getItem('youtubeMode');
  if (savedMode === 'manual') {
    document.querySelector('input[name="youtubeMode"][value="manual"]').checked = true;
    updateModeDisplay('manual');

    const urls = JSON.parse(localStorage.getItem('manualYouTubeUrls') || '[]');
    const textarea = document.getElementById('manualYouTubeUrls');
    if (textarea) textarea.value = urls.join('\n');
    displayManualYouTubeVideos(urls);
  } else {
    document.querySelector('input[name="youtubeMode"][value="latest"]').checked = true;
    updateModeDisplay('latest');

    const ytChannelId = localStorage.getItem('youtubeChannelId');
    if (ytChannelId) {
      const input = document.getElementById('channelIdInput');
      if (input) input.value = ytChannelId;
      fetchLatestVideos(ytChannelId);
    }
  }
});

window.saveYouTubeSettings = function () {
  const mode = document.querySelector('input[name="youtubeMode"]:checked')?.value;
  if (mode === 'latest') {
    const input = document.getElementById('channelIdInput').value.trim();
    const match = input.match(/(UC[\w-]+)/);
    if (!match) return alert('正しいチャンネルIDを入力してください');
    const channelId = match[1];
    localStorage.setItem('youtubeMode', 'latest');
    localStorage.setItem('youtubeChannelId', channelId);
    fetchLatestVideos(channelId);
  } else {
    const urls = document.getElementById('manualYouTubeUrls').value
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.includes('youtube.com/watch'));
    if (urls.length === 0) return alert('URLを1つ以上入力してください');
    localStorage.setItem('youtubeMode', 'manual');
    localStorage.setItem('manualYouTubeUrls', JSON.stringify(urls));
    displayManualYouTubeVideos(urls);
  }
};

window.addManualVideoInput = function () {
  const container = document.getElementById('manualUrlFields');
  const count = container.querySelectorAll('input').length + 1;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'manualVideoInput';
  input.placeholder = `動画URL ${count}`;

  container.appendChild(document.createElement('br'));
  container.appendChild(input);
};

function displayManualYouTubeVideos(urls) {
  const videoHTML = urls.map(url => {
    const videoId = new URL(url).searchParams.get('v');
    return `
      <div class="youtube-card">
        <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
      </div>
    `;
  }).join('');
  document.getElementById('videoContainer').innerHTML = videoHTML;
}

function saveYouTubeSettingsToServer() {
  const mode = document.querySelector('input[name="youtubeMode"]:checked')?.value;
  const data = {
    youtubeMode: mode,
    youtubeChannelId: '',
    manualYouTubeUrls: []
  };

  if (mode === 'latest') {
    const input = document.getElementById('channelIdInput').value.trim();
    const match = input.match(/(UC[\w-]+)/);
    if (!match) return alert('正しいチャンネルIDを入力してください');
    data.youtubeChannelId = match[1];
  } else {
    const urls = Array.from(document.querySelectorAll('.manualVideoInput'))
      .map(input => input.value.trim())
      .filter(url => url.includes('youtube.com/watch'));
    if (urls.length === 0) return alert('URLを1つ以上入力してください');
    data.manualYouTubeUrls = urls;
  }

  fetch('/session')
    .then(res => res.json())
    .then(session => {
      if (!session.loggedIn) return alert('ログインが必要です');

      return fetch(`/api/user/${session.username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            youtubeMode: data.youtubeMode,
            youtubeChannelId: data.youtubeChannelId,
            manualYouTubeUrls: data.manualYouTubeUrls
          }
        })
      });
    })
    .then(res => {
      if (res.ok) alert('YouTube設定を保存しました');
      else throw new Error('保存失敗');
    })
    .catch(err => {
      console.error('❌ YouTube設定保存エラー:', err);
      alert('保存に失敗しました');
    });
}

// ==== 初期読み込み ==== 
console.log("✅ DOMContentLoaded が始まりました");
window.addEventListener('DOMContentLoaded', () => {
  const isUserPage = location.pathname.startsWith('/user/');
  const savedX = localStorage.getItem('xUsername');
  const savedUrl = localStorage.getItem('instagramPostUrl');
  const savedYT = localStorage.getItem('youtubeChannelId');

  // ▼ X表示（プロフィールページでもTOPでも共通）
  if (savedX) {
  const xInput = document.getElementById('xUsernameInput');
  if (xInput) {
    xInput.value = savedX;
  }
  showXProfile();
}

  // ▼ Instagram表示
  if (savedUrl) {
  const igInput = document.getElementById('instagramPostLink');
  if (igInput) {
    igInput.value = savedUrl;
  }
  embedInstagramPost();
}

  // ▼ YouTube表示
if (isUserPage) {
  const username = location.pathname.split('/').pop();
  fetch(`/api/user/${username}`)
    .then(res => res.json())
    .then(data => {
      if (data.youtubeChannelId) {
        fetchLatestVideos(data.youtubeChannelId);
      }
    });
} else {
  if (savedYT) {
    const ytInput = document.getElementById('channelIdInput');
    if (ytInput) {
      ytInput.value = savedYT;
    }
    fetchLatestVideos(savedYT);
  }
}

  // ▼ TikTok表示
  displayTikTokVideos();
});