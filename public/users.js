window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/users');
    const users = await res.json();

    // 🔍 クエリパラメータから検索語を取得
    const params = new URLSearchParams(window.location.search);
    const keyword = params.get('q')?.toLowerCase() || '';

    // 🔍 最初のフィルタ
    const filtered = keyword
      ? users.filter(user => {
          const name = String(user.profile?.name || '');
          const title = String(user.profile?.title || '');
          return name.toLowerCase().includes(keyword) || title.toLowerCase().includes(keyword);
        })
      : users;

    displayUsers(filtered);

    // 🔎 リアルタイム検索欄が存在する場合
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = keyword;
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const result = users.filter(user => {
          const name = String(user.profile?.name || '');
          const title = String(user.profile?.title || '');
          return name.toLowerCase().includes(val) || title.toLowerCase().includes(val);
        });
        displayUsers(result);
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
    const cardLink = document.createElement('a');
    cardLink.href = `/user/${user.uid}`;
    cardLink.className = 'user-card';
    cardLink.style.textDecoration = 'none';
    cardLink.style.color = 'inherit';

    const name = user.profile?.name || '未設定';
    const title = user.profile?.title || '';
    const bio = user.profile?.bio || '';

    let photoHTML = '';
    const photoUrl = user.profile?.photos?.[0]?.url;
    if (photoUrl) {
      photoHTML = `<img src="${photoUrl}" alt="${name}の写真" class="user-thumb">`;
    }

    cardLink.innerHTML = `
      ${photoHTML}
      <h3>${name} ${title ? `（${title}）` : ''}</h3>
      <p>${bio.replace(/\n/g, '<br>')}</p>
    `;

    list.appendChild(cardLink);
  });
}
