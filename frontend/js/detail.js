// detail.js —— 详情页：展示套装大图/价格/单品明细，加入购物车/立即下单
(function () {
  initPage('detail');

  const box = document.getElementById('detailBox');
  const pid = getQueryParam('id');

  async function loadDetail() {
    if (!pid) {
      box.innerHTML = '<p class="tip">缺少商品 ID。</p>';
      return;
    }
    try {
      const res = await API.get('/api/shop/products/' + pid);
      const p = res.data.product;
      const items = res.data.items || [];

      const itemRows = items.map(it => `
        <div class="item-row">
          <img src="${it.Image}" alt="${it.ProductName}" loading="lazy">
          <div class="item-name">${it.ProductName}<br><small class="tip">${it.StyleTag || ''} · ×${it.Quantity}</small></div>
          <div class="item-price">${formatPrice(it.Price)}</div>
        </div>`).join('') || '<p class="tip">该商品为单品，无套装明细。</p>';

      box.innerHTML = `
        <img class="detail-img" src="${p.Image}" alt="${p.ProductName}" loading="lazy">
        <div class="detail-info">
          <h2>${p.ProductName}</h2>
          <div class="detail-tags">
            <span class="tag-chip">${p.StyleTag || '通用'}季型</span>
            <span class="tag-chip">${p.SceneTag || '多场景'}</span>
            <span class="tag-chip">${p.IsSet ? '整套穿搭' : '单品'}</span>
          </div>
          <div class="detail-price price">${formatPrice(p.Price)}</div>
          <div class="detail-actions">
            <button class="btn btn-primary" id="addCartBtn">加入购物车</button>
            <button class="btn btn-success" id="buyNowBtn">立即下单</button>
            <a class="btn btn-outline" href="wardrobe.html">返回穿搭库</a>
          </div>
          <h3 class="items-title">套装单品明细</h3>
          ${itemRows}
          <p class="tip">库存 ${p.Stock} 件 · 模拟选购系统，无真实支付</p>
        </div>`;

      document.getElementById('addCartBtn').addEventListener('click', () => addToCart(false));
      document.getElementById('buyNowBtn').addEventListener('click', () => addToCart(true));
    } catch (e) {
      box.innerHTML = '<p class="tip">加载失败：' + e.message + '</p>';
    }
  }

  async function addToCart(goCart) {
    try {
      const res = await API.post('/api/cart/add', { product_id: Number(pid), quantity: 1 });
      showToast(res.msg || '添加成功', 'ok');
      if (goCart) {
        setTimeout(() => location.href = 'cart.html', 600);
      }
    } catch (e) {
      showToast(e.message, 'err');
      if (e.message.includes('登录')) setTimeout(() => location.href = 'login.html?redirect=detail.html%3Fid%3D' + pid, 900);
    }
  }

  loadDetail();
})();
