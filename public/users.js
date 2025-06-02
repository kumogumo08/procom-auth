window.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('/api/users');
  const users = await res.json();

  const params = new URLSearchParams(window.location.search);
  const keyword = params.get('q')?.toLowerCase() || '';

  const filtered = keyword
    ? users.filter(user =>
        user.name.toLowerCase().includes(keyword) ||
        user.title.toLowerCase().includes(keyword)
      )
    : users;

  displayUsers(filtered);

  // 検索ボックスが存在するならリアルタイム検索も可能に（オプション）
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = keyword; // 入力欄に反映
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase();
      const result = users.filter(user =>
        user.name.toLowerCase().includes(val) ||
        user.title.toLowerCase().includes(val)
      );
      displayUsers(result);
    });
  }
});

function displayUsers(users) {
  const list = document.getElementById('userList');
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
  }); // forEach の終了
}     // ✅ ← displayUsers 関数の終了
