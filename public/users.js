window.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('/api/users');
  const users = await res.json();
  displayUsers(users);

  document.getElementById('searchInput').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(keyword) ||
      user.title.toLowerCase().includes(keyword)
    );
    displayUsers(filtered);
  });
});

function displayUsers(users) {
  const list = document.getElementById('userList');
  list.innerHTML = '';
  users.forEach(user => {
    const div = document.createElement('div');
    div.className = 'user-card';
    div.innerHTML = `
      <h3>${user.name} ${user.title ? `（${user.title}）` : ''}</h3>
      <p>${user.bio}</p>
      <a href="/user/${user.username}">プロフィールを見る</a>
    `;
    list.appendChild(div);
  });
}