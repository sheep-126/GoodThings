// index.js —— 首页：加载热门套装推荐
(function () {
  initPage('index');

  async function loadHot() {
    const grid = document.getElementById('hotGrid');
    try {
      const res = await API.get('/api/shop/products');
      let list = res.data || [];
      // 热门推荐：优先展示套装，不足时用全部商品补齐（最多 6 张）
      list.sort((a, b) => (b.IsSet || 0) - (a.IsSet || 0));
      list = list.slice(0, 6);
      if (!list.length) {
        grid.innerHTML = '<p class="tip">暂无商品，请先导入数据库并录入商品数据。</p>';
        return;
      }
      grid.innerHTML = list.map(renderProductCard).join('');
      bindFavoriteBtns(grid);
    } catch (e) {
      grid.innerHTML = '<p class="tip">加载失败：' + e.message + '</p>';
    }
  }

  loadHot();
})();
