function showXTimeline() {
  const username = document.getElementById('xUsernameInput').value.trim();
  const container = document.getElementById('xTimelineContainer');
  container.innerHTML = ''; // 再描画のためクリア

  if (!username) {
    container.textContent = 'ユーザー名を入力してください';
    return;
  }

  // X埋め込み用aタグ生成
  const anchor = document.createElement('a');
  anchor.setAttribute('class', 'twitter-timeline');
  anchor.setAttribute('data-height', '400'); // オプション：高さ指定
  anchor.setAttribute('href', `https://twitter.com/${username}?ref_src=twsrc%5Etfw`);
  anchor.textContent = `Tweets by ${username}`;
  container.appendChild(anchor);

  // スクリプトがすでに読み込まれているか確認し再描画
  if (window.twttr && window.twttr.widgets) {
    window.twttr.widgets.load(container);
  } else {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    document.body.appendChild(script);
  }

  // 保存
  localStorage.setItem('xUsername', username);
}
  
  // ページ読み込み時に自動復元（任意）
  window.addEventListener('DOMContentLoaded', () => {
    const savedUsername = localStorage.getItem('xUsername');
const xInput = document.getElementById('xUsernameInput'); // ←ここも要修正

if (savedUsername && xInput) {
  xInput.value = savedUsername;
  showXTimeline(); // ←関数名を修正
  }
  });

function showXLink() {
    const username = document.getElementById('xUsernameInput').value.trim();
    const container = document.getElementById('xTimelineContainer');
    container.innerHTML = ''; // 表示のリセット
  
    if (!username) {
      container.textContent = 'ユーザー名を入力してください';
      return;
    }
  
    // X（Twitter）プロフィールへのリンクを作成
    const link = document.createElement('a');
    link.href = `https://twitter.com/${username}`;
    link.target = '_blank'; // 新しいタブで開く
    link.rel = 'noopener noreferrer';
    link.textContent = `${username} さんのXプロフィールを見る`;
  
    container.appendChild(link);
  
    // 入力を保存（ページリロード後も表示可能にする）
    localStorage.setItem('xUsername', username);
  }
  
  // ページ読み込み時に復元
  window.addEventListener('DOMContentLoaded', () => {
    const savedUsername = localStorage.getItem('xUsername');
    if (savedUsername) {
      document.getElementById('xUsernameInput').value = savedUsername;
      showXLink();
    }
  });

  // ==== Instagram投稿埋め込み機能 ====
  
  function embedInstagramPost() {
    const url = document.getElementById('instagramPostUrl').value;
    const embedArea = document.getElementById('instagramEmbedArea');
  
    if (!url || !url.includes('instagram.com')) {
      embedArea.innerHTML = '正しいInstagram投稿のURLを入力してください。';
      return;
    }
  
    embedArea.innerHTML = `
      <blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14" style="width:100%; max-width:540px;"></blockquote>
    `;
  
    if (window.instgrm) {
      window.instgrm.Embeds.process();
    } else {
      const script = document.createElement('script');
      script.src = "https://www.instagram.com/embed.js";
      document.body.appendChild(script);
    }
  
    localStorage.setItem('instagramPostUrl', url);
  }
  
  // ==== DOM読み込み後に保存されたInstagram・Xを表示 ====
  
  window.addEventListener('DOMContentLoaded', () => {
    const savedUrl = localStorage.getItem('instagramPostUrl');
    const input = document.getElementById('instagramPostUrl');
  
    if (savedUrl && input) {
      input.value = savedUrl;
      embedInstagramPost();
    }
  
    const savedUsername = localStorage.getItem('xUsername');
    const xInput = document.getElementById('xUsername');
  
    if (savedUsername && xInput) {
      xInput.value = savedUsername;
      loadTwitterTimeline();
    }
  
    fetchLatestTwoVideos();// YouTube表示もここで呼び出し
  });
  
  // ==== YouTubeの最新動画表示機能 ====
  
  const apiKey = 'AIzaSyAzSzwjwhvtCtUhkC0KR_e_NwDvQJpMxvM';

  function saveYouTubeChannelId() {
    let input = document.getElementById('channelIdInput').value.trim();
    if (!input) return;
  
    // UCから始まるチャンネルIDを抽出
    const match = input.match(/(UC[\w-]+)/);
    if (!match) {
      alert('チャンネルID（UCから始まるID）を入力してください');
      return;
    }
  
    const channelId = match[1];
    localStorage.setItem('youtubeChannelId', channelId);
    fetchLatestVideos(channelId);
  }
  
  function fetchLatestVideos(channelId = null) {
    channelId = channelId || localStorage.getItem('youtubeChannelId');
    if (!channelId) return;
  
    fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=5`
    )
      .then(res => res.json())
      .then(data => {
        if (!data.items) throw new Error('動画が取得できません');
  
        const videos = data.items.filter(item => item.id.kind === 'youtube#video');
        if (videos.length === 0) throw new Error('動画が見つかりません');
  
        const videoHTML = videos.slice(0, 2).map(video => {
          const { videoId } = video.id;
          const { title } = video.snippet;
          return `
            <div class="sns-card">
              <iframe 
                src="https://www.youtube.com/embed/${videoId}" 
                frameborder="0" 
                allowfullscreen 
                width="100%" height="200">
              </iframe>
              <p>${title}</p>
            </div>
          `;
        }).join('');
  
        document.getElementById('videoContainer').innerHTML = videoHTML;
      })
      .catch(err => {
        console.error('YouTube API エラー:', err);
        document.getElementById('videoContainer').innerText = '動画を表示できませんでした。';
      });
  }
  
  // 初期読み込み時に保存されたチャンネルIDがあれば自動読み込み
  document.addEventListener('DOMContentLoaded', () => {
    const savedId = localStorage.getItem('youtubeChannelId');
    if (savedId) {
      document.getElementById('channelIdInput').value = savedId;
  
      const lastFetched = localStorage.getItem('lastFetchTime');
      const now = Date.now();
  
      if (!lastFetched || now - lastFetched > 10 * 60 * 1000) {
        fetchLatestVideos(savedId);
        localStorage.setItem('lastFetchTime', now);
      } else {
        console.log('10分未満なのでYouTubeは再取得しません');
      }
    }
  });
  
  //TikTokの動画埋め込み
  function saveTikTokVideos() {
    const inputs = document.querySelectorAll('.tiktok-input');
    const urls = Array.from(inputs)
      .map(input => input.value.trim())
      .filter(url => url.includes('tiktok.com/@') && url.includes('/video/'));
  
    if (urls.length === 0) {
      alert('TikTokの正しい動画URLを1つ以上入力してください。');
      return;
    }
  
    localStorage.setItem('tiktokUrls', JSON.stringify(urls));
    displayTikTokVideos(urls);
  }
  
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
      block.innerHTML = `<section></section>`;
      container.appendChild(block);
    });
  
    const script = document.createElement('script');
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }
  
  window.addEventListener('DOMContentLoaded', () => {
    displayTikTokVideos();
  });
