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
window.embedInstagramPost = function () {
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

  saveProfileAndEventsToServer(); // ← 忘れず呼ぶ
};

// ==== YouTubeの最新動画表示機能 ====
const apiKey = 'AIzaSyAzSzwjwhvtCtUhkC0KR_e_NwDvQJpMxvM';

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

  // APIアクセス（ここから下はそのままでOK）
  fetch(`https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=5`)
    .then(res => res.json())
    .then(data => {
      if (!data.items) throw new Error('動画が取得できません');
      const videos = data.items.filter(item => item.id.kind === 'youtube#video');
      if (videos.length === 0) throw new Error('動画が見つかりません');

      // ✅ キャッシュ保存
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
window.saveTikTokVideos = function () {
  const inputs = document.querySelectorAll('.tiktok-input');
  const urls = Array.from(inputs).map(input => input.value.trim())
    .filter(url => url.includes('tiktok.com/@') && url.includes('/video/'));

console.log('✅ 保存対象URL:', urls); // ←ここで確認

  if (urls.length === 0) {
    alert('TikTokの正しい動画URLを1つ以上入力してください。');
    return;
  }

  localStorage.setItem('tiktokUrls', JSON.stringify(urls));
  displayTikTokVideos(urls);

  saveProfileAndEventsToServer(); // ← TikTok保存後にこれを呼び出す！
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

// ==== 初期読み込み ==== 
console.log("✅ DOMContentLoaded が始まりました");
window.addEventListener('DOMContentLoaded', () => {
  const isUserPage = location.pathname.startsWith('/user/');
  const savedX = localStorage.getItem('xUsername');
  const savedUrl = localStorage.getItem('instagramPostUrl');
  const savedYT = localStorage.getItem('youtubeChannelId');

  // ▼ X表示（プロフィールページでもTOPでも共通）
  if (savedX) {
    document.getElementById('xUsernameInput')?.value = savedX;
    console.log("🔍 X 表示準備", savedX)
    showXProfile();
  }

  // ▼ Instagram表示
  if (savedUrl) {
    document.getElementById('instagramPostLink')?.value = savedUrl;
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
      document.getElementById('channelIdInput')?.value = savedYT;
      fetchLatestVideos(savedYT);
    }
  }

  // ▼ TikTok表示
  displayTikTokVideos();
});