const usernameFromURL = decodeURIComponent(window.location.pathname.split('/').pop());

window.addEventListener('DOMContentLoaded', async () => {
  updateAuthUI();

  localStorage.removeItem('youtubeChannelId');
  localStorage.removeItem('instagramPostUrl');
  localStorage.removeItem('xUsername');
  localStorage.removeItem('tiktokUrls');
  localStorage.removeItem('calendarEvents');

  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = `Procom - ${usernameFromURL}さんのページ`;

  try {
    const res = await fetch(`/api/user/${usernameFromURL}`);
    if (!res.ok) throw new Error('ユーザーデータ取得失敗');
    const data = await res.json();
    const profile = data.profile || data;

    const sessionRes = await fetch('/session');
    const session = await sessionRes.json();

    const xInput = document.getElementById('xUsernameInput');
    const xButton = document.getElementById('xShowBtn');
    const instagramInput = document.getElementById('instagramPostLink');
    const instaBtn = document.getElementById('instaShowBtn');
    const tiktokSection = document.getElementById('tiktok-section');
    const snsSection = document.getElementById('sns-section');
    const editSection = document.getElementById('edit-section');
    const authForms = document.querySelector('.auth-forms');
    const isOwnPage = session.loggedIn && session.username === usernameFromURL;
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

    if (authForms && session.loggedIn) {
      authForms.innerHTML = `
      <p>ようこそ、${session.username}さん！</p>
      <form id="logout-form" action="/logout" method="GET">
      <button type="submit">ログアウト</button>
      </form>
      <div style="text-align: right; margin-top: 5px;">
      <a href="/account.html">⚙ アカウント設定</a>
    </div>
  `;
}

    // 🔽 プロフィール情報の表示
    const nameEl = document.getElementById('name');
    if (nameEl) nameEl.textContent = profile.name || '';

    const titleEl2 = document.getElementById('title');
    if (titleEl2) titleEl2.textContent = profile.title ? `（${profile.title}）` : '';

    const bioEl = document.getElementById('bio');
    if (bioEl) bioEl.innerHTML = (profile.bio || '').replace(/\n/g, '<br>');

    if (Array.isArray(profile.photos)) {
      updatePhotoSlider(profile.photos);
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

    const resList = await fetch('/api/users');
    const userList = await resList.json();
    const list = document.getElementById('user-list');
    if (list) {
      userList.forEach(u => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="/user/${u.username}">${u.name || u.username} さん</a>`;
        list.appendChild(li);
      });
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

