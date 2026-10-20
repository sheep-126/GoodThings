// profile.js —— 个人中心页：用户信息、三个入口、最近测试记录
(function () {
  initPage('profile').then(user => {
    if (!user) {
      // 未登录跳转登录页，登录后跳回
      requireLogin('profile.html');
      return;
    }
    renderUser(user);
    loadRecords();
  });

  function renderUser(user) {
    const head = document.getElementById('profileHead');
    head.innerHTML = `
      <h2>${user.nickname}</h2>
      <p>用户名：${user.username}${user.is_admin === 1 ? '（管理员）' : '（普通用户）'}</p>
      <p>性别：${user.gender || '未填写'} · 手机：${user.phone || '未填写'}</p>`;
  }

  async function loadRecords() {
    const tbody = document.getElementById('recordsBody');
    try {
      const res = await API.get('/api/quiz/records');
      const rows = res.data || [];
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#8a8a8a">还没有测试记录，去 <a href="quiz.html">做一次测试</a></td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(r => `
        <tr>
          <td>${new Date(r.TestTime).toLocaleString('zh-CN')}</td>
          <td>${r.spring_score}</td>
          <td>${r.summer_score}</td>
          <td>${r.autumn_score}</td>
          <td>${r.winter_score}</td>
          <td><span class="status-badge">${r.FinalStyleTag}</span></td>
        </tr>`).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#8a8a8a">加载失败：' + e.message + '</td></tr>';
    }
  }

  /* 退出登录 */
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await API.post('/api/auth/logout'); } catch (e) { /* 忽略 */ }
    location.href = 'index.html';
  });
})();
