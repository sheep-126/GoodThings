// ==========================================================
// common.js —— 公共工具：价格格式化 / 弹窗提示 / 导航状态 /
//              收藏（localStorage） / 登录态 / 表单校验
// ==========================================================

/* ---------- 价格格式化：自动加 ¥ 前缀并统一两位小数 ---------- */
function formatPrice(value) {
  const n = Number(value);
  if (isNaN(n)) return '¥0.00';
  return '¥' + n.toFixed(2);
}

/* ---------- 轻提示弹窗（成功/失败） ---------- */
/* 空状态占位：统一各列表"无数据"时的视觉与文案结构
   opts = { title, desc, icon, actionText, actionHref, cell, colspan }
   cell / colspan 用于 <tbody> 场景，会生成带 colspan 的整行包裹 */
function emptyHtml(opts) {
  const o = Object.assign({
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" '
        + 'stroke-width="1.6" stroke-linecap="round"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/>'
        + '<path d="M3.5 10h17M8 14.5h5"/></svg>',
    title: '暂无数据', desc: '', actionText: '', actionHref: '', cell: false
  }, opts || {});
  const act = (o.actionText && o.actionHref)
    ? '<a class="empty-action" href="' + o.actionHref + '">' + o.actionText + '</a>' : '';
  return '<div class="empty-state' + (o.cell ? ' is-cell' : '') + '">'
    + '<span class="empty-ico">' + o.icon + '</span>'
    + '<div class="empty-title">' + o.title + '</div>'
    + (o.desc ? '<div class="empty-desc">' + o.desc + '</div>' : '')
    + act + '</div>';
}
/* target 支持 DOM 元素或选择器字符串 */
function renderEmpty(target, opts) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  const o = opts || {};
  const inner = emptyHtml(o);
  el.innerHTML = o.colspan ? ('<tr><td colspan="' + o.colspan + '">' + inner + '</td></tr>') : inner;
}

function showToast(msg, type = 'ok', duration = 2200) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.className = 'toast show ' + (type === 'err' ? 'err' : 'ok');
  el.textContent = msg;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), duration);
}

/* ---------- URL 查询参数 ---------- */
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || '';
}

/* ---------- 登录态：刷新导航栏 ---------- */
async function refreshNav() {
  try {
    const res = await API.get('/api/auth/me');
    if (res.logged_in && res.user) {
      const navUser = document.getElementById('navUser');
      const navLoginBtn = document.getElementById('navLoginBtn');
      if (navUser) {
        navUser.style.display = 'inline';
        navUser.textContent = 'Hi，' + res.user.nickname;
      }
      if (navLoginBtn) navLoginBtn.style.display = 'none';
      // 管理员显示“后台管理”入口
      if (res.user.is_admin === 1) {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'inline-block');
      }
      window._currentUser = res.user;
      refreshCartBadge();   // 已登录：刷新购物车数量气泡
      return res.user;
    }
  } catch (e) { /* 未登录不提示 */ }
  window._currentUser = null;
  return null;
}

/* ---------- 购物车数量气泡 ---------- */
/* 读取购物车列表并汇总数量，渲染到导航栏"购物车"按钮右侧；失败静默处理，不影响主流程 */
async function refreshCartBadge() {
  const link = document.querySelector('.nav-right a[href="cart.html"]');
  if (!link) return;
  const remove = () => { const b = link.querySelector('.nav-badge'); if (b) b.remove(); };
  if (!window._currentUser) { remove(); return; }
  try {
    const res = await API.get('/api/cart/list');
    const list = res.data || [];
    const total = list.reduce((n, it) => n + (Number(it.Quantity) || 0), 0);
    if (!total) { remove(); return; }
    let badge = link.querySelector('.nav-badge');
    if (!badge) { badge = document.createElement('span'); badge.className = 'nav-badge'; link.appendChild(badge); }
    badge.textContent = total > 99 ? '99+' : String(total);
  } catch (e) { remove(); }
}

/* 未登录则跳转到登录页，并记录来源页以便登录后跳回 */
function requireLogin(redirect) {
  const back = redirect || (location.pathname.split('/').pop() + location.search);
  location.href = 'login.html?redirect=' + encodeURIComponent(back);
}

/* ---------- 收藏功能（浏览器 localStorage 实现） ----------
 * 说明：数据库 Goodthing.sql 未设计收藏表，为保持数据库结构一致，
 *       收藏采用浏览器本地存储（键名 goodthing_fav），无需请求后端。
 */
function getFavorites() {
  try { return JSON.parse(localStorage.getItem('goodthing_fav') || '[]'); } catch (e) { return []; }
}
function isFavorite(id) {
  return getFavorites().includes(Number(id));
}
function toggleFavorite(id) {
  let favs = getFavorites();
  const pid = Number(id);
  const idx = favs.indexOf(pid);
  let now = true;
  if (idx >= 0) { favs.splice(idx, 1); now = false; } else { favs.push(pid); now = true; }
  localStorage.setItem('goodthing_fav', JSON.stringify(favs));
  return now;
}

/* ---------- 渲染商品卡片（多个页面复用） ---------- */
function renderProductCard(p) {
  const isFav = isFavorite(p.ProductID);
  return `
    <div class="product-card" data-id="${p.ProductID}">
      <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${p.ProductID}" title="收藏">${isFav ? '♥' : '♡'}</button>
      <div class="card-media">
        <img class="product-img" src="${p.Image}" alt="${p.ProductName}" loading="lazy" onclick="location.href='detail.html?id=${p.ProductID}'">
        <span class="card-flag">${p.StyleTag || '通用'}</span>
        <div class="card-mask"><span>查看详情</span></div>
      </div>
      <div class="product-info">
        <div class="product-name" onclick="location.href='detail.html?id=${p.ProductID}'">${p.ProductName}</div>
        <div class="product-meta">${p.StyleTag || '通用'} · ${p.SceneTag || '多场景'} · ${p.CategoryName || ''}</div>
        <div class="product-foot">
          <span class="price">${formatPrice(p.Price)}</span>
          <span class="chip">${Number(p.IsSet) === 1 ? '套装' : '单品'}</span>
        </div>
      </div>
    </div>`;
}

/* ---------- 绑定收藏按钮（事件委托） ---------- */
function bindFavoriteBtns(container) {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.fav-btn');
    if (!btn) return;
    e.stopPropagation();
    const pid = btn.getAttribute('data-id');
    const now = toggleFavorite(pid);
    btn.classList.toggle('active', now);
    btn.textContent = now ? '♥' : '♡';
    showToast(now ? '已加入收藏' : '已取消收藏', 'ok');
  });
}

/* ---------- 页面初始化：高亮导航 + 刷新登录态 ---------- */
function initPage(pageName) {
  document.querySelectorAll('.nav-link').forEach(a => {
    if (a.getAttribute('data-page') === pageName) a.classList.add('active');
  });
  return refreshNav();
}
