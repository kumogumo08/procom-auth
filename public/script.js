//script.jsです。
// 🔁 グローバル変数
let currentSlide = 0;
let slides = [];
let events = {};
let currentDate = new Date();

const editBtn = document.getElementById('editBtn');
const editForm = document.getElementById('editForm');
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

// 📌 認証 UI
function updateAuthUI() {
  console.log("✅ updateAuthUI 呼び出し開始");
  fetch('/session', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      console.log("📨 /session レスポンス:", data);
      const authForms = document.querySelector('.auth-forms');
      const editSection = document.getElementById('edit-section');
      const photoUpload = document.querySelector('.photo-upload');
      const eventForm = document.getElementById('event-form');
      const youtubeInputSection = document.querySelector('.sns-section');
      const instagramSection = document.querySelector('#editForm #instagramPostLink')?.parentElement;
      const xSection = editSection?.querySelector('#xUsernameInput')?.parentElement;
      const tiktokSection = document.getElementById('tiktok-section');

      if (!authForms) return;

      if (data.loggedIn) {
        authForms.innerHTML = `
          <div style="text-align: right; margin-top: 10px;">
            <p>ようこそ、${data.username}さん！</p>
            <div style="display: flex; justify-content: flex-end; gap: 10px; align-items: center;">
              <a href="/user/${data.username}" class="mypage-btn">マイページ</a>
              <form action="/logout" method="GET">
                <button type="submit">ログアウト</button>
              </form>
            </div>
            <div style="margin-top: 5px;">
              <a href="/account.html">⚙ アカウント設定</a>
            </div>
          </div>
        `;
        authForms.style.display = 'block'; // ← これを追加
        console.log("✅ ログインUI更新完了"); 

                // 🔽 ログインユーザー向け要素を表示
        if (editSection) editSection.style.display = 'block';
        if (photoUpload) photoUpload.style.display = 'block';
        if (eventForm) eventForm.style.display = 'block';
        if (youtubeInputSection) youtubeInputSection.style.display = 'block';
        if (instagramSection) instagramSection.style.display = 'block';
        if (xSection) xSection.style.display = 'block';
        if (tiktokSection) tiktokSection.style.display = 'block';
        } else {
        console.log("🔴 非ログイン状態：UIを非表示にします");
        if (editSection) {
         editSection.style.display = 'none';
         }

        authForms.innerHTML = '';

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
    })
        .catch(err => {
      console.error("❌ /session取得またはUI処理中エラー:", err);
    });
}

 function attachAuthFormHandlers() {
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');

  // 🔹 登録処理
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });

    const msg = await res.text();
    alert(msg);
    //updateAuthUI(); // フォーム再描画
  });

// 🔐 ログイン処理
// 🔐 ログイン処理
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include'  // ← ✅ セッション維持に必須
  });

  if (res.ok) {
    const data = await res.json();
    alert(`ログイン成功！ようこそ ${data.username} さん`);

    // ✅ セッション保存のタイミングを確保（超重要）
    setTimeout(() => {
      // window.location.href = `/user/${data.username}`;
    }, 500);

  } else {
    const errorText = await res.text();
    alert(`ログイン失敗: ${errorText}`);
  }
});
}


// 例：URLが http://localhost:3000/user/flamingo の場合
function getUsernameFromURL() {
  const path = window.location.pathname;
  const segments = path.split('/');
  const username = segments[segments.length - 1];
  // 空や不正な場合は null を返す
  if (!username || username === 'user' || username === '') {
    return null;
  }

  return username;
}

async function loadUserProfile() {
  const username = getUsernameFromURL();
  if (!username) {
    console.warn('⚠ ユーザー名がURLから取得できませんでした（ログイン前など）');
    return; // ← ここで処理をスキップ
  }

  console.log('取得したユーザー名：', username);

  try {
    const res = await fetch(`/api/user/${username}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    // 必要なプロフィール処理をここに…
  } catch (err) {
    console.error("❌ プロフィール読み込みエラー:", err.message);
  }
}

function saveProfileAndEventsToServer(includePhotos = false, customPhotos = null) {
  fetch('/session')
    .then(res => res.json())
    .then(data => {
      if (!data.loggedIn) {
        console.log("🛑 未ログイン状態のためプロフィール保存を中止");
        return;
      }
      proceedWithSave(data.username, includePhotos, customPhotos);
    });
}

function proceedWithSave(username, includePhotos = false, customPhotos = null) {
  const name = document.getElementById('nameInput')?.value.trim();
  const title = document.getElementById('titleInput')?.value.trim();
  const bio = document.getElementById('bioInput')?.value.trim();

// 入力要素を事前に取得
  const nameInput = document.getElementById('nameInput');
  const titleInput = document.getElementById('titleInput');
  const bioInput = document.getElementById('bioInput');

  nameInput?.addEventListener('input', () => {
  delete nameInput.dataset.cleared;
  });
  titleInput?.addEventListener('input', () => {
    delete titleInput.dataset.cleared;
  });
  bioInput?.addEventListener('input', () => {
    delete bioInput.dataset.cleared;
  });

  const profile = {};

  // ✅ まずは削除操作を優先（data-cleared が true のときだけ上書き）
  if (nameInput?.dataset.cleared === 'true') {
    profile.name = '';
  } else if (name) {
    profile.name = name;
  }

  if (titleInput?.dataset.cleared === 'true') {
    profile.title = '';
  } else if (title) {
    profile.title = title;
  }

  if (bioInput?.dataset.cleared === 'true') {
    profile.bio = '';
  } else if (bio) {
    profile.bio = bio;
  }

  const youtubeChannelId = localStorage.getItem('youtubeChannelId');
  if (youtubeChannelId) profile.youtubeChannelId = youtubeChannelId;

  const instagramPostUrl = localStorage.getItem('instagramPostUrl');
  if (instagramPostUrl) profile.instagramPostUrl = instagramPostUrl;

  const xUsername = localStorage.getItem('xUsername');
  if (xUsername) profile.xUsername = xUsername;

  const tiktokUrls = JSON.parse(localStorage.getItem('tiktokUrls') || '[]');
  if (Array.isArray(tiktokUrls) && tiktokUrls.length > 0) {
    profile.tiktokUrls = tiktokUrls;
  }

  const photos = customPhotos || JSON.parse(localStorage.getItem('photos') || '[]');
  if (includePhotos && Array.isArray(photos) && photos.length > 0) {
    profile.photos = photos;
  }

  const calendarEvents = Object.entries(events)
    .filter(([date, evs]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Array.isArray(evs) && evs.length > 0)
    .map(([date, evs]) => ({ date, events: evs }));

  if (calendarEvents.length > 0) {
    profile.calendarEvents = calendarEvents;
  }

  if (Object.keys(profile).length === 0) {
    const isProfileEmpty =
      !name && !title && !bio &&
      !youtubeChannelId &&
      !instagramPostUrl &&
      !xUsername &&
      (!Array.isArray(tiktokUrls) || tiktokUrls.length === 0) &&
      (!includePhotos || !Array.isArray(photos) || photos.length === 0) &&
      calendarEvents.length === 0;

    if (isProfileEmpty) {
      console.log("🛑 入力内容が空のため保存スキップ");
      return;
    }
  }

  const data = { profile };
  console.log("✅ 最終送信データ:", data);

  fetch(`/api/user/${username}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  })
    .then(res => {
      if (!res.ok) throw new Error('保存失敗');
      return res.text();
    })
    .then(msg => {
      console.log("✅ 保存成功:", msg);
      alert('プロフィールが保存されました');

      // DOM 反映（オプション）
      if (nameDisplay) nameDisplay.textContent = profile.name || '';
      if (titleDisplay) titleDisplay.textContent = profile.title ? `（${profile.title}）` : '';
      if (bioDisplay) bioDisplay.innerHTML = (profile.bio || '').replace(/\n/g, '<br>');

    // 🔽 編集フォームを非表示（オプション）
        if (editForm) editForm.classList.add('hidden');
    })
    .catch(err => {
      console.error("❌ 保存エラー:", err);
      alert('プロフィールの保存に失敗しました');
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

    // 名前削除
    document.getElementById('deleteNameBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('nameInput');
      nameInput.value = '';
      nameInput.dataset.cleared = 'true'; // ← 追加
    });

    // 肩書き削除
    document.getElementById('deleteTitleBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('titleInput');
      titleInput.value = '';
      titleInput.dataset.cleared = 'true'; // ← 追加
    });

    // プロフィール削除
    document.getElementById('deleteBioBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      const bioInput = document.getElementById('bioInput');
      bioInput.value = '';
      bioInput.dataset.cleared = 'true'; // ← 追加
    });


// 📌 カレンダー
function createCalendar(date = new Date(), isEditable = false) {
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
        item.innerHTML = `・${e}`;
        if (isEditable) {
          const delBtn = document.createElement('button');
          delBtn.textContent = '×';
          delBtn.className = 'delete-btn';
          delBtn.dataset.date = fullDate;
          delBtn.dataset.index = idx;

            delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const date = delBtn.dataset.date;
            const index = parseInt(delBtn.dataset.index, 10);
            if (events[date]) {
              events[date].splice(index, 1);
              if (events[date].length === 0) delete events[date];
              localStorage.setItem('calendarEvents', JSON.stringify(events));
              createCalendar(currentDate, isEditable);
            }
          });
          item.appendChild(delBtn);
        }
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
    createCalendar(currentDate, isEditable); 
  };
  document.getElementById('next-month').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    const currentUser = getUsernameFromURL();
   fetch('/session', { credentials: 'include' })
  .then(res => res.json())
  .then(data => {
    const isEditable = data.loggedIn && data.username === getUsernameFromURL();
    createCalendar(currentDate, isEditable);
  });
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
          createCalendar(currentDate, isEditable); 
        }
      });
    });
  }, 0);
}

let isSavingPhotos = false;

async function savePhotos() {
  const maxPhotos = 5;
  const files = photoInput?.files || [];
  if (!files.length) {
    console.log("📛 ファイルが選択されていないため、保存処理をスキップします");
    return;
  }

  isSavingPhotos = true;
  console.time("📸 写真保存処理時間");

  try {
    // 🔽 リサイズ付き base64 変換
    const base64Images = await Promise.all(
      Array.from(files).slice(0, maxPhotos).map(file => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          const reader = new FileReader();
          reader.onload = (e) => {
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const maxWidth = 1280;
              const maxHeight = 720;
              let width = img.width;
              let height = img.height;

              // サイズ調整
              if (width > height) {
                if (width > maxWidth) {
                  height *= maxWidth / width;
                  width = maxWidth;
                }
              } else {
                if (height > maxHeight) {
                  width *= maxHeight / height;
                  height = maxHeight;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8); // 画質80%
              resolve(resizedBase64);
            };
            img.onerror = reject;
            img.src = e.target.result;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );

    // 旧画像削除（任意）
    const deleteRes = await fetch('/api/deletePhotos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ urls: [] })
    });
    const deleteMsg = await deleteRes.text();
    console.log('🧹 古い画像削除:', deleteMsg);

    // 新画像アップロード
    const uploadRes = await fetch('/api/uploadPhotos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ base64Images })
    });
    if (!uploadRes.ok) throw new Error('画像アップロード失敗');

    const { urls } = await uploadRes.json();
    console.log("✅ アップロード完了URL一覧:", urls);

    updatePhotoSlider(urls);
    localStorage.setItem('photos', JSON.stringify(urls));

    alert("✅ 写真が保存されました。プロフィールも保存するには『プロフィールを保存』ボタンを押してください。");

  } catch (err) {
    console.error("❌ 写真保存エラー:", err);
    alert("写真の保存に失敗しました");
  } finally {
    console.timeEnd("📸 写真保存処理時間");
    isSavingPhotos = false;
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
window.addEventListener('DOMContentLoaded', async () => {
  updateAuthUI();
  attachAuthFormHandlers();

  const savedName = localStorage.getItem('profile_name');
  if (savedName) nameDisplay.textContent = savedName;
  const savedTitle = localStorage.getItem('profile_title');
  if (savedTitle) titleDisplay.textContent = `（${savedTitle}）`;
  const savedBio = localStorage.getItem('profile_bio');
  if (savedBio) bioDisplay.innerHTML = savedBio.replace(/\n/g, '<br>');

// Firestoreから取得して表示する部分
fetch(`/api/user/${getUsernameFromURL()}`)
  .then(async res => {
    if (!res.ok) {
      const errorText = await res.text(); // ← JSON以外のメッセージを読む
      throw new Error(errorText);         // ← catch に投げる
    }
    return res.json();
  })
  .then(data => {
    const profile = data.profile || data;

    if (profile.xUsername) {
      document.getElementById('xUsernameInput').value = profile.xUsername;
      localStorage.setItem('xUsername', profile.xUsername);
    }

    if (profile.instagramPostUrl) {
      document.getElementById('instagramPostLink').value = profile.instagramPostUrl;
      localStorage.setItem('instagramPostUrl', profile.instagramPostUrl);
    }
  })
  .catch(err => {
    console.error("❌ プロフィール読み込みエラー:", err.message);
    // 必要ならユーザーにメッセージ表示も可能
    // alert(err.message);
  });

  let isEditable = false;
  try {
    const sessionRes = await fetch('/session');
    const session = await sessionRes.json();
    isEditable = session.loggedIn && session.username === getUsernameFromURL();
  } catch (err) {
    console.warn("⚠ セッション情報の取得に失敗しました", err);
  }

  updatePhotoSlider();

  events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
  createCalendar(currentDate, isEditable); 

  document.getElementById('saveProfileBtnTop')?.addEventListener('click', () => {
    saveProfileAndEventsToServer(true);
  });
  document.getElementById('saveProfileBtnBottom')?.addEventListener('click', () => {
    saveProfileAndEventsToServer(true);
  });
      // Instagram 投稿URL 入力時に保存
    document.getElementById('instagramPostLink')?.addEventListener('input', (e) => {
      localStorage.setItem('instagramPostUrl', e.target.value.trim());
    });

    // X（旧Twitter）ユーザー名 入力時に保存
    document.getElementById('xUsernameInput')?.addEventListener('input', (e) => {
      localStorage.setItem('xUsername', e.target.value.trim());
    });

    const savePhotosBtn = document.getElementById('savePhotosBtn');
    if (savePhotosBtn && !savePhotosBtn.dataset.listenerAdded) {
        savePhotosBtn.addEventListener('click', () => {
          console.time("📸 写真保存処理時間"); // 開始ログ
          console.log("📸 写真保存ボタンがクリックされました");
          savePhotos().then(() => {
            console.timeEnd("📸 写真保存処理時間"); // 終了ログ
        });
      });
      savePhotosBtn.dataset.listenerAdded = 'true'; // 重複防止
    }

    document.getElementById('editBtn')?.addEventListener('click', () => {
      document.getElementById('editForm')?.classList.remove('hidden');

      const saveBtn = document.getElementById('saveBtn');
      if (saveBtn && !saveBtn.dataset.listenerAdded) {
        console.log("✅ saveBtn が見つかりました（編集後）");
        saveBtn.addEventListener('click', () => {
          console.log("💾 プロフィール保存ボタンがクリックされました");
          saveProfileAndEventsToServer(true); 
        });
        saveBtn.dataset.listenerAdded = 'true'; // ← 重複防止
      }
    });

document.getElementById('add-event-btn')?.addEventListener('click', () => {
  const date = document.getElementById('event-date').value.trim();
  const text = document.getElementById('event-text').value.trim();

  if (!date || !text) {
    alert('日付と内容を入力してください。');
    return;
  }

  if (!events[date]) {
    events[date] = [];
  }

  events[date].push(text);

  try {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  } catch (e) {
    console.error(`ローカル保存に失敗しました（${date}）:`, e);
  }

  createCalendar(currentDate);

  document.getElementById('event-date').value = '';
  document.getElementById('event-text').value = '';
});
});

function getEventsForDate(date, eventsArray) {
  const entry = eventsArray.find(e => e.date === date);
  return entry ? entry.events : [];
}

function validatePassword(password) {
  const lengthOK = password.length >= 8 && password.length <= 32;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password); // 記号検出

  if (!lengthOK) return 'パスワードは8文字以上32文字以下にしてください';
  if (!hasUpper) return 'パスワードには大文字を含めてください';
  if (!hasLower) return 'パスワードには小文字を含めてください';
  if (!hasNumber) return 'パスワードには数字を含めてください';
  if (hasSymbol) return 'パスワードに記号は使えません';

  return ''; // エラーなし
}

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('usernameInput').value.trim();
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;

  const error = validatePassword(password);
  if (error) {
    alert(error);
    return;
  }

  const res = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  if (res.ok) {
    alert('登録成功！ログインしてください');
    location.href = '/login.html';
  } else {
    const msg = await res.text();
    alert('登録失敗: ' + msg);
  }
});
