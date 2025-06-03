window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/users');
    const users = await res.json();

    // 🔍 クエリ検索
    const params = new URLSearchParams(window.location.search);
    const keyword = params.get('q')?.toLowerCase() || '';

    const filtered = keyword
      ? users.filter(user =>
          user.name.toLowerCase().includes(keyword) ||
          user.title.toLowerCase().includes(keyword)
        )
      : users;

    displayUsers(filtered);

    // 🔎 リアルタイム検索入力欄がある場合
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = keyword;
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const result = users.filter(user =>
          user.name.toLowerCase().includes(val) ||
          user.title.toLowerCase().includes(val)
        );
        displayUsers(result);
      });
    }

    // 🔽 オプションでリスト形式でも表示（<ul id="user-list"> があれば）
    const list = document.getElementById('user-list');
    if (list) {
      users.forEach(u => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="/user/${u.username}">${u.name || u.username} さん</a>`;
        list.appendChild(li);
      });
    }

  } catch (err) {
    console.error('❌ ユーザーデータ取得エラー:', err);
    alert('ユーザーデータの取得に失敗しました');
  }
});

function displayUsers(users) {
  const list = document.getElementById('userList');
  if (!list) return;
  list.innerHTML = '';

  if (users.length === 0) {
    list.innerHTML = '<p>一致するユーザーが見つかりませんでした。</p>';
    return;
  }

  users.forEach(user => {
    const div = document.createElement('div');
    div.className = 'user-card';

    let photoHTML = '';
    if (user.photoUrl) {
      photoHTML = `<img src="${user.photoUrl}" alt="${user.name}の写真" class="user-thumb">`;
    }

    div.innerHTML = `
      ${photoHTML}
      <h3>${user.name || user.username} ${user.title ? `（${user.title}）` : ''}</h3>
      <p>${(user.bio || '').replace(/\n/g, '<br>')}</p>
      <a href="/user/${user.username}">プロフィールを見る</a>
    `;

    list.appendChild(div);
  });
}
