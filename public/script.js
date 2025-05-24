// グローバル変数
let currentSlide = 0;
let slides = [];

const editBtn = document.getElementById('editBtn');
const editForm = document.getElementById('editForm');
const saveBtn = document.getElementById('saveBtn');
const nameDisplay = document.getElementById('name');
const bioDisplay = document.getElementById('bio');
const nameInput = document.getElementById('nameInput');
const bioInput = document.getElementById('bioInput');
const photoInput = document.getElementById('photoInput');
const carousel = document.querySelector('.carousel');
const titleDisplay = document.getElementById('title');
const titleInput = document.getElementById('titleInput');
const xUsernameInput = document.getElementById('xUsername');
const instagramLinkInput = document.getElementById('instagramLink');
const youtubeLinkInput = document.getElementById('youtubeLink');
const twitterContainer = document.getElementById('twitterContainer');
const cancelBtn = document.getElementById('cancelBtn');

// 編集ボタン押下でフォーム表示と現在値セット
editBtn.addEventListener('click', () => {
  nameInput.value = nameDisplay.textContent.trim();
  titleInput.value = titleDisplay.textContent.replace(/[（）]/g, '').trim(); // カッコ削除
  bioInput.value = bioDisplay.innerText.trim();
  editForm.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  editForm.classList.add('hidden'); // 編集フォームを非表示にする
});

// 保存ボタン押下でフォームの内容を反映・保存
function saveSNSLinks() {
  const xUserVal = xUsernameInput.value.trim();
  const instaVal = instagramLinkInput.value.trim();
  const youtubeVal = youtubeLinkInput.value.trim();
  const instaPostVal = document.getElementById('instagramPostLink').value.trim();

  localStorage.setItem('xUsername', xUserVal);
  localStorage.setItem('instagramLink', instaVal);
  localStorage.setItem('youtubeLink', youtubeVal);
  localStorage.setItem('instagramPostLink', instaPostVal)
}

saveBtn.addEventListener('click', () => {
  const nameVal = nameInput.value.trim();
  const titleVal = titleInput.value.trim();
  const bioVal = bioInput.value.trim();

  nameDisplay.textContent = nameVal;
  titleDisplay.textContent = titleVal ? `（${titleVal}）` : '';
  bioDisplay.innerHTML = bioVal.replace(/\n/g, '<br>');

  localStorage.setItem('profile_name', nameVal);
  localStorage.setItem('profile_title', titleVal);
  localStorage.setItem('profile_bio', bioVal);

  savePhotos();

  saveSNSLinks();  // ここで呼び出す
  updateSNSDisplay(); // ここで画面更新

  editForm.classList.add('hidden');
});

//ログイン機能
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');

  // 登録フォームの送信処理
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const res = await fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    });

    if (res.ok) {
      alert('登録完了！ログインしてください');
      registerForm.reset();
    } else {
      const msg = await res.text();
      alert(msg);
    }
  });

  // ログインフォームの送信処理
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    });

    if (res.ok) {
      alert('ログイン成功！');
      window.location.reload(); // ログイン状態を反映するためにリロード
    } else {
      const msg = await res.text();
      alert(msg);
    }
  });

  // ログイン状態を確認してUIを切り替える
  fetch('/session')
    .then(res => res.json())
    .then(data => {
      if (data.loggedIn) {
        document.querySelector('.auth-forms').innerHTML = `
          <p>ようこそ、${data.username}さん！</p>
          <form action="/logout" method="GET">
            <button type="submit">ログアウト</button>
          </form>
        `;
      }
    });
});

// カレンダー機能
document.addEventListener('DOMContentLoaded', () => {
  events = JSON.parse(localStorage.getItem('calendarEvents')) || {};

  document.getElementById('add-event-btn').addEventListener('click', () => {
    const date = document.getElementById('event-date').value;
    const text = document.getElementById('event-text').value;

    if (!date || !text) {
      alert('日付と内容を入力してください。');
      return;
    }

    if (!events[date]) {
      events[date] = [];
    }
    events[date].push(text);

    localStorage.setItem('calendarEvents', JSON.stringify(events));
    alert('予定を追加しました。');
    createCalendar(currentDate);
  });

  createCalendar(currentDate);
});

let currentDate = new Date();
let events = {};

function createCalendar(date = new Date()) {
  const calendar = document.getElementById('calendar');
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();

  calendar.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'calendar-header';
  header.innerHTML = `
    <button id="prev-month">&lt;</button>
    <span>${year}年 ${month + 1}月</span>
    <button id="next-month">&gt;</button>
  `;
  calendar.appendChild(header);

  const daysHeader = ['日', '月', '火', '水', '木', '金', '土'];
  const daysRow = document.createElement('div');
  daysRow.className = 'calendar-row header';
  daysHeader.forEach(day => {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell header-cell';
    cell.textContent = day;
    daysRow.appendChild(cell);
  });
  calendar.appendChild(daysRow);

  let row = document.createElement('div');
  row.className = 'calendar-row';

  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-cell empty';
    row.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    cell.textContent = day;

    if (events[fullDate]) {
      cell.classList.add('event-day');

      const popup = document.createElement('div');
      popup.className = 'popup';

      // 各イベントと削除ボタンを生成
      events[fullDate].forEach((e, idx) => {
        const eventItem = document.createElement('div');
        eventItem.innerHTML = `・${e} <button class="delete-btn" data-date="${fullDate}" data-index="${idx}">×</button>`;
        popup.appendChild(eventItem);
      });

      cell.appendChild(popup);

      cell.addEventListener('mouseenter', () => popup.style.display = 'block');
      cell.addEventListener('mouseleave', () => popup.style.display = 'none');
    }

    row.appendChild(cell);

    if ((startDay + day) % 7 === 0 || day === daysInMonth) {
      calendar.appendChild(row);
      row = document.createElement('div');
      row.className = 'calendar-row';
    }
  }

  document.getElementById('prev-month').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    createCalendar(currentDate);
  };
  document.getElementById('next-month').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    createCalendar(currentDate);
  };

  // 削除ボタンのイベント追加（再描画ごとに設定）
  setTimeout(() => {
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // カレンダーのポップアップ閉じなどを防止
        const date = btn.getAttribute('data-date');
        const index = parseInt(btn.getAttribute('data-index'), 10);
        if (events[date]) {
          events[date].splice(index, 1);
          if (events[date].length === 0) {
            delete events[date];
          }
          localStorage.setItem('calendarEvents', JSON.stringify(events));
          createCalendar(currentDate);
        }
      });
    });
  }, 0);
}

// Instagram投稿埋め込み表示（表示処理）
const instaPostContainer = document.getElementById('instagramPostContainer');
const savedPostLink = localStorage.getItem('instagramPostLink');

function renderInstagramEmbed(link) {
  const container = document.getElementById('instagramPostContainer');
  if (!container) return;

  container.innerHTML = '';
  if (link) {
    const embedHtml = `
      <blockquote class="instagram-media" data-instgrm-permalink="${link}" data-instgrm-version="14" style="margin: 1em auto;"></blockquote>
    `;
    container.innerHTML = embedHtml;

    if (!document.querySelector('script[src="https://www.instagram.com/embed.js"]')) {
      const script = document.createElement('script');
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.instgrm) {
      window.instgrm.Embeds.process();
    }
  }
}

function saveInstagramPostLink() {
  const postLink = document.getElementById('instagramPostLink').value.trim();
  localStorage.setItem('instagramPostLink', postLink);
  renderInstagramEmbed(postLink);
}

// ページ読み込み時に表示
window.addEventListener('load', () => {
  const savedLink = localStorage.getItem('instagramPostLink');
  if (savedLink) renderInstagramEmbed(savedLink);
});
    
    // Instagram埋め込み用スクリプト再読み込み

      
    

    // 既にInstagramの埋め込みライブラリがロードされている場合
    if (window.instgrm) {
      window.instgrm.Embeds.process();
    } else {
      // ロードされていなければスクリプトを追加
      const script = document.createElement('script');
      script.src = "https://www.instagram.com/embed.js";
      script.onload = () => {
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      };
      document.body.appendChild(script);
    }
  

// 写真保存関数（inputのファイルを読み込みローカルストレージに保存）
function savePhotos() {
  const input = document.getElementById('photoInput');
  const files = input.files;
  if (!files.length) return;

  const maxPhotos = 5;
  const photoURLs = [];
  let loadedCount = 0;

  for (let i = 0; i < Math.min(files.length, maxPhotos); i++) {
    const reader = new FileReader();
    reader.onload = (e) => {
      photoURLs.push(e.target.result);
      loadedCount++;
      if (loadedCount === Math.min(files.length, maxPhotos)) {
        localStorage.setItem('photos', JSON.stringify(photoURLs));
        updatePhotoSlider(photoURLs);
      }
    };
    reader.readAsDataURL(files[i]);
  }
}

// スライダー更新
function updatePhotoSlider(photoURLs = null) {
  if (!photoURLs) {
    photoURLs = JSON.parse(localStorage.getItem('photos') || '[]');
  }
  carousel.innerHTML = ''; // 中身リセット

  photoURLs.forEach((url, index) => {
    const slideDiv = document.createElement('div');
    slideDiv.classList.add('slide');
    slideDiv.style.setProperty('--i', index);
    const img = document.createElement('img');
    img.src = url;
    slideDiv.appendChild(img);
    carousel.appendChild(slideDiv);
  });

  slides = carousel.querySelectorAll('.slide');
  currentSlide = 0;
  updateCarousel();
}

// スライダー表示更新
function updateCarousel() {
  slides.forEach((slide, i) => {
    const offset = ((i - currentSlide + slides.length) % slides.length);
    slide.style.setProperty('--i', offset);
    slide.classList.toggle('active', offset === 0);
  });
}

// 左右ボタン用関数（HTMLにない場合はここで作ってください）
function prevSlide() {
  if (slides.length === 0) return;
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  updateCarousel();
}

function nextSlide() {
  if (slides.length === 0) return;
  currentSlide = (currentSlide + 1) % slides.length;
  updateCarousel();
}

// SNSリンクを保存
// SNSリンクを読み込んで表示
function updateSNSDisplay() {
  const xUser = localStorage.getItem('xUsername') || '';
  const insta = localStorage.getItem('instagramLink') || '';
  const youtube = localStorage.getItem('youtubeLink') || '';

  // X（旧Twitter）
  twitterContainer.innerHTML = '';
  if (xUser) {
    const twLink = document.createElement('a');
    twLink.href = `https://twitter.com/${xUser}`;
    twLink.textContent = `@${xUser}`;
    twLink.target = '_blank';
    twLink.rel = 'noopener noreferrer';
    twitterContainer.appendChild(twLink);

    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.load(twitterContainer);
    }
  }

  // Instagramリンク表示
  const instaContainer = document.getElementById('instagramLinkContainer');
  if (instaContainer) {
    instaContainer.innerHTML = '';
    if (insta) {
      const instaLink = document.createElement('a');
      instaLink.href = insta;
      instaLink.textContent = insta;
      instaLink.target = '_blank';
      instaLink.rel = 'noopener noreferrer';
      instaContainer.appendChild(instaLink);
    }
  }

  // YouTube（オプション）
  if (youtube) {
    loadYouTubeVideo(youtube);
  }
}

// プロフィール情報をローカルストレージから読み込み
function loadProfile() {
  const savedName = localStorage.getItem('profile_name');
  if (savedName) nameDisplay.textContent = savedName;

  const savedTitle = localStorage.getItem('profile_title');
  titleDisplay.textContent = savedTitle ? `（${savedTitle}）` : '';

  const savedBio = localStorage.getItem('profile_bio');
  if (savedBio) {
    bioDisplay.innerHTML = savedBio.replace(/\n/g, '<br>');
  }

  updateSNSDisplay();
  updatePhotoSlider();
}

// 初期化処理
window.addEventListener('load', () => {
  loadProfile();
});

// キーボード操作でスライド切り替え（もし必要なら）
// document.addEventListener('keydown', (e) => {
//   if (e.key === 'ArrowRight') nextSlide();
//   else if (e.key === 'ArrowLeft') prevSlide();
// });

function toggleInstagramEdit() {
  const editor = document.getElementById('instagramPostEditor');
  if (editor.style.display === 'none') {
    editor.style.display = 'block';
  } else {
    editor.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updatePhotoSlider(); // ページ読み込み時にスライドを復元表示
});