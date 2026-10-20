// login.js —— 登录/注册页：tab 切换、非空校验、登录后跳回来源页
(function () {
  initPage('login');

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabs = document.querySelectorAll('.tab');

  // 登录/注册 tab 切换
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    loginForm.style.display = tab.dataset.tab === 'login' ? 'block' : 'none';
    registerForm.style.display = tab.dataset.tab === 'register' ? 'block' : 'none';
  }));

  /* 登录 */
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!username || !password) { showToast('用户名和密码不能为空', 'err'); return; }
    try {
      const res = await API.post('/api/auth/login', { username, password });
      showToast(res.msg || '登录成功', 'ok');
      const back = getQueryParam('redirect') || 'index.html';
      setTimeout(() => location.href = back, 600);
    } catch (err) {
      showToast(err.message, 'err');
    }
  });

  /* 注册 */
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;
    const nickname = document.getElementById('regNickname').value.trim();

    if (!username || !password || !password2) { showToast('请填写完整注册信息', 'err'); return; }
    if (password.length < 6) { showToast('密码长度至少 6 位', 'err'); return; }
    if (password !== password2) { showToast('两次输入的密码不一致', 'err'); return; }
    try {
      const res = await API.post('/api/auth/register', { username, password, nickname });
      showToast(res.msg || '注册成功', 'ok');
      // 注册成功后自动切回登录页
      setTimeout(() => {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === 'login'));
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
      }, 800);
    } catch (err) {
      showToast(err.message, 'err');
    }
  });
})();
