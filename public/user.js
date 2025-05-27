// user.js

const usernameFromURL = window.location.pathname.split('/').pop();

window.addEventListener('DOMContentLoaded', async () => {
   //updateAuthUI();
  // ページタイトル表示（任意）
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = `Procom - ${usernameFromURL}さんのページ`;

  try {
    const res = await fetch(`/api/user/${usernameFromURL}`);
    if (!res.ok) throw new Error('ユーザーデータ取得失敗');
    const data = await res.json();

    const sessionRes = await fetch('/session');
    const session = await sessionRes.json();
    if (session.loggedIn && session.username === usernameFromURL) {
    const editSection = document.getElementById('edit-section');
    if (editSection) editSection.style.display = 'block';
    }

     const authForms = document.querySelector('.auth-forms');
  if (authForms) {
    authForms.innerHTML = `
      <p>ようこそ、${session.username}さん！</p>
      <form id="logout-form" action="/logout" method="GET">
        <button type="submit">ログアウト</button>
      </form>
    `;
  }
    // プロフィール表示
    document.getElementById('name').textContent = data.name || '';
    document.getElementById('title').textContent = data.title ? `（${data.title}）` : '';
    document.getElementById('bio').innerHTML = (data.bio || '').replace(/\n/g, '<br>');

    // スライダー写真
    if (data.photos) updatePhotoSlider(data.photos);

    // 各SNS
    if (data.youtubeChannelId) {
      localStorage.setItem('youtubeChannelId', data.youtubeChannelId);
      fetchLatestVideos(data.youtubeChannelId);
    }

    if (data.instagramPostUrl) {
      localStorage.setItem('instagramPostUrl', data.instagramPostUrl);
      embedInstagramPost();
    }

    if (data.xUsername) {
      localStorage.setItem('xUsername', data.xUsername);
      showXProfile();
    }

    if (data.tiktokUrls) {
      localStorage.setItem('tiktokUrls', JSON.stringify(data.tiktokUrls));
      displayTikTokVideos();
    }

    // カレンダー
    if (data.calendarEvents) {
      events = data.calendarEvents;
      createCalendar(currentDate);
    }

   } catch (err) {
     console.error('読み込みエラー:', err);

    const errorContainer = document.createElement('div');
    errorContainer.style.color = 'red';
    errorContainer.style.padding = '1em';
    errorContainer.innerText = 'ユーザーデータの取得に失敗しました。';

    document.body.prepend(errorContainer);
   }
});

document.getElementById('saveBtn')?.addEventListener('click', () => {
  saveUserDataToServer();
});