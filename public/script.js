// 🔁 グローバル変数
let currentSlide = 0;
let slides = [];
let events = {};
let currentDate = new Date();

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
const cancelBtn = document.getElementById('cancelBtn');
const twitterContainer = document.getElementById('twitterContainer');


// 📌 プロフィール編集
editBtn?.addEventListener('click', () => {
  nameInput.value = nameDisplay.textContent.trim();
  titleInput.value = titleDisplay.textContent.replace(/[（）]/g, '').trim();
  bioInput.value = bioDisplay.innerText.trim();
  editForm.classList.remove('hidden');
});

cancelBtn?.addEventListener('click', () => {
  editForm.classList.add('hidden');
});

saveBtn?.addEventListener('click', async () => {
  // 表示を更新
  nameDisplay.textContent = nameInput.value.trim();
  titleDisplay.textContent = titleInput.value.trim() ? `（${titleInput.value.trim()}）` : '';
  bioDisplay.innerHTML = bioInput.value.trim().replace(/\n/g, '<br>');

  localStorage.setItem('profile_name', nameInput.value.trim());
  localStorage.setItem('profile_title', titleInput.value.trim());
  localStorage.setItem('profile_bio', bioInput.value.trim());

  savePhotos();
  editForm.classList.add('hidden');

  saveProfileAndEventsToServer(); // ← ここ！
});

// 📌 認証 UI
function updateAuthUI() {
  fetch('/session', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      const authForms = document.querySelector('.auth-forms');
      const editSection = document.getElementById('edit-section');
      const photoUpload = document.querySelector('.photo-upload');
      const eventForm = document.getElementById('event-form');
      const youtubeInputSection = document.querySelector('.sns-section');
      const instagramSection = document.querySelector('#instagramPostLink')?.parentElement;
      const xSection = document.querySelector('#xUsernameInput')?.parentElement;
      const tiktokSection = document.getElementById('tiktok-section');

      if (!authForms) return;

      if (data.loggedIn) {
        authForms.innerHTML = `
          <p>ようこそ、${data.username}さん！</p>
          <form action="/logout" method="GET">
            <button type="submit">ログアウト</button>
          </form>
        `;
                // 🔽 ログインユーザー向け要素を表示
        if (editSection) editSection.style.display = 'block';
        if (photoUpload) photoUpload.style.display = 'block';
        if (eventForm) eventForm.style.display = 'block';
        if (youtubeInputSection) youtubeInputSection.style.display = 'block';
        if (instagramSection) instagramSection.style.display = 'block';
        if (xSection) xSection.style.display = 'block';
        if (tiktokSection) tiktokSection.style.display = 'block';
        authForms.style.display = 'block';

        } else {
        // ログインしてない場合、非表示にしておく
         const editSection = document.getElementById('edit-section');
        if (editSection) {
         editSection.style.display = 'none';
         }

        authForms.innerHTML = `
          <form id="login-form">
            <input type="text" id="login-username" placeholder="ユーザー名" required />
            <input type="password" id="login-password" placeholder="パスワード" required />
            <button type="submit">ログイン</button>
          </form>
          <form id="register-form">
            <input type="text" id="register-username" placeholder="新規ユーザー名" required />
            <input type="password" id="register-password" placeholder="パスワード" required />
            <button type="submit">登録</button>
          </form>
        `;

                // 🔽 ログインしていないときは非表示に
        if (editSection) editSection.style.display = 'none';
        if (photoUpload) photoUpload.style.display = 'none';
        if (eventForm) eventForm.style.display = 'none';
        if (youtubeInputSection) youtubeInputSection.style.display = 'none';
        if (instagramSection) instagramSection.style.display = 'none';
        if (xSection) xSection.style.display = 'none';
        if (tiktokSection) tiktokSection.style.display = 'none';

        attachAuthFormHandlers();
      }
    });
}

function attachAuthFormHandlers() {
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      credentials: 'include'
    });

    const msg = await res.text();
    alert(msg);
    updateAuthUI();
  });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("ログインフォーム送信！");
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      credentials: 'include'
    });

    if (res.ok) {
      const data = await res.json();
      alert(`ログイン成功！ようこそ ${data.username} さん`);
     
      // ✅ 自動リダイレクト
      window.location.href = `/user/${data.username}`;

    } else {
      const errorText = await res.text();
      alert(errorText);
    }
  });
}

// 例：URLが http://localhost:3000/user/flamingo の場合
function getUsernameFromURL() {
  const path = window.location.pathname;
  const segments = path.split('/');
  return segments[segments.length - 1]; // 最後の部分が username
}

window.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  loadUserProfile();
});

async function loadUserProfile() {
  const username = getUsernameFromURL();
  console.log('取得したユーザー名：', username);
}

function saveProfileAndEventsToServer() {
  const nameVal = nameInput.value.trim();
  const titleVal = titleInput.value.trim();
  const bioVal = bioInput.value.trim();

  const userData = {
    name: nameVal,
    title: titleVal,
    bio: bioVal,
    photos: JSON.parse(localStorage.getItem('photos') || '[]'),
    youtubeChannelId: localStorage.getItem('youtubeChannelId') || '',
    instagramPostUrl: localStorage.getItem('instagramPostUrl') || '',
    xUsername: localStorage.getItem('xUsername') || '',
    tiktokUrls: JSON.parse(localStorage.getItem('tiktokUrls') || '[]'),
    calendarEvents: events
  };

  const username = window.location.pathname.split('/').pop();

  fetch(`/api/user/${username}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // これはOK（セッション維持用）
    body: JSON.stringify(data) // ← ✅ これに変更
    })
    .then(res => res.text())
    .then(result => {
      console.log('保存結果:', result);
    })
    .catch(err => {
      console.error('保存エラー:', err);
    });
}

document.addEventListener('submit', (e) => {
  if (e.target.action.endsWith('/logout')) {
    e.preventDefault(); // ← フォームのデフォルト動作を止める

    fetch('/logout', { method: 'GET', credentials: 'include' })
      .then(() => {
        window.location.href = '/'; // ← トップページにリダイレクト
      })
      .catch(err => {
        console.error('ログアウト失敗:', err);
        alert('ログアウトに失敗しました');
      });
  }
});

// 📌 カレンダー
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
      events[fullDate].forEach((e, idx) => {
        const item = document.createElement('div');
        item.innerHTML = `・${e} <button class="delete-btn" data-date="${fullDate}" data-index="${idx}">×</button>`;
        popup.appendChild(item);
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

  setTimeout(() => {
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const date = btn.getAttribute('data-date');
        const index = parseInt(btn.getAttribute('data-index'), 10);
        if (events[date]) {
          events[date].splice(index, 1);
          if (events[date].length === 0) delete events[date];
          localStorage.setItem('calendarEvents', JSON.stringify(events));
          createCalendar(currentDate);
        }
      });
    });
  }, 0);
}

// 📌 写真保存
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

function updatePhotoSlider(photoURLs = null) {
  if (!photoURLs) {
    photoURLs = JSON.parse(localStorage.getItem('photos') || '[]');
  }
  carousel.innerHTML = '';
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

function updateCarousel() {
  slides.forEach((slide, i) => {
    const offset = ((i - currentSlide + slides.length) % slides.length);
    slide.style.setProperty('--i', offset);
    slide.classList.toggle('active', offset === 0);
  });
}

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

// 📌 初期化処理
window.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  attachAuthFormHandlers();
  const savedName = localStorage.getItem('profile_name');
  if (savedName) nameDisplay.textContent = savedName;
  const savedTitle = localStorage.getItem('profile_title');
  if (savedTitle) titleDisplay.textContent = `（${savedTitle}）`;
  const savedBio = localStorage.getItem('profile_bio');
  if (savedBio) bioDisplay.innerHTML = savedBio.replace(/\n/g, '<br>');
  updatePhotoSlider();
  events = JSON.parse(localStorage.getItem('calendarEvents')) || {};
  createCalendar(currentDate);
});

document.getElementById('add-event-btn')?.addEventListener('click', () => {
  const date = document.getElementById('event-date').value;
  const text = document.getElementById('event-text').value;

  if (!date || !text) {
    alert('日付と内容を入力してください。');
    return;
  }

  // ✅ 日付に対応するイベントリストを初期化
  if (!events[date]) {
    events[date] = [];
  }

  // ✅ 予定を追加
  events[date].push(text);

  // ✅ 保存（ローカルにも保存）
  localStorage.setItem('calendarEvents', JSON.stringify(events));

  // ✅ カレンダー再描画
  createCalendar(currentDate);

  // ✅ フォームをクリア
  document.getElementById('event-date').value = '';
  document.getElementById('event-text').value = '';

  saveProfileAndEventsToServer();
});