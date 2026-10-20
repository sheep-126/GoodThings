// wardrobe.js —— 穿搭库列表页：按 StyleTag/SceneTag 筛选，实时刷新
(function () {
  initPage('wardrobe');

  const grid = document.getElementById('productGrid');
  const styleFilter = document.getElementById('styleFilter');
  const sceneFilter = document.getElementById('sceneFilter');
  const favFilter = document.getElementById('favFilter');
  const countTip = document.getElementById('countTip');

  // 若从“我的收藏”进入（wardrobe.html?fav=1），自动勾选只看收藏
  if (getQueryParam('fav') === '1') {
    favFilter.checked = true;
  }

  async function loadProducts() {
    const params = new URLSearchParams();
    if (styleFilter.value) params.set('style', styleFilter.value);
    if (sceneFilter.value) params.set('scene', sceneFilter.value);

    try {
      const res = await API.get('/api/shop/products?' + params.toString());
      let list = res.data || [];
      if (favFilter.checked) {
        const favs = getFavorites();
        list = list.filter(p => favs.includes(Number(p.ProductID)));
      }
      countTip.textContent = '共 ' + list.length + ' 件';
      if (!list.length) {
        grid.innerHTML = '<p class="tip">没有符合条件的商品，换个筛选条件试试。</p>';
        return;
      }
      grid.innerHTML = list.map(renderProductCard).join('');
      bindFavoriteBtns(grid);
    } catch (e) {
      grid.innerHTML = '<p class="tip">加载失败：' + e.message + '</p>';
    }
  }

  // 筛选变化实时刷新
  styleFilter.addEventListener('change', loadProducts);
  sceneFilter.addEventListener('change', loadProducts);
  favFilter.addEventListener('change', loadProducts);

  loadProducts();
})();
