// cart.js —— 购物车页：勾选、改数量、删除、实时总价、提交订单
(function () {
  initPage('cart');

  const tbody = document.getElementById('cartBody');
  const checkAll = document.getElementById('checkAll');
  const selCount = document.getElementById('selCount');
  const selTotal = document.getElementById('selTotal');

  let cartData = []; // 当前购物车数据

  /* 计算选中商品：前端本地汇总（小计=单价×数量） */
  function calcSelected() {
    const selected = cartData.filter(r => r._checked);
    let total = 0, count = 0;
    selected.forEach(r => {
      total += Number(r.Price) * Number(r.Quantity);
      count += Number(r.Quantity);
    });
    selCount.textContent = count;
    selTotal.textContent = formatPrice(total);
    // 全选按钮状态
    checkAll.checked = cartData.length > 0 && cartData.every(r => r._checked);
  }

  function render() {
    if (!cartData.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#8a8a8a">购物车是空的，去 <a href="wardrobe.html">穿搭库</a> 逛逛吧</td></tr>';
      calcSelected();
      return;
    }
    tbody.innerHTML = cartData.map(r => `
      <tr>
        <td><input type="checkbox" class="row-check" data-id="${r.CartID}" ${r._checked ? 'checked' : ''}></td>
        <td>
          <img src="${r.Image}" alt="${r.ProductName}" loading="lazy">
          <a href="detail.html?id=${r.ProductID}">${r.ProductName}</a>
          <span class="tip">${r.StyleTag || ''}</span>
        </td>
        <td><span class="price">${formatPrice(r.Price)}</span></td>
        <td><input type="number" class="qty-input" data-id="${r.CartID}" value="${r.Quantity}" min="1" max="99"></td>
        <td><span class="price">${formatPrice(Number(r.Price) * Number(r.Quantity))}</span></td>
        <td><button class="btn btn-danger btn-sm del-btn" data-id="${r.CartID}">删除</button></td>
      </tr>`).join('');
    calcSelected();
  }

  async function loadCart() {
    try {
      const res = await API.get('/api/cart/list');
      cartData = (res.data || []).map(r => ({ ...r, _checked: true }));
      render();
    } catch (e) {
      showToast(e.message, 'err');
      if (e.message.includes('登录')) setTimeout(() => requireLogin('cart.html'), 900);
    }
  }

  /* 事件委托：勾选 / 数量修改 / 删除 */
  tbody.addEventListener('change', async (e) => {
    if (e.target.classList.contains('row-check')) {
      const id = Number(e.target.dataset.id);
      const row = cartData.find(r => r.CartID === id);
      if (row) { row._checked = e.target.checked; calcSelected(); }
    }
    if (e.target.classList.contains('qty-input')) {
      const id = Number(e.target.dataset.id);
      let qty = parseInt(e.target.value, 10);
      if (isNaN(qty) || qty < 1) qty = 1;
      if (qty > 99) qty = 99;
      e.target.value = qty;
      try {
        await API.post('/api/cart/update', { cart_id: id, quantity: qty });
        const row = cartData.find(r => r.CartID === id);
        if (row) { row.Quantity = qty; render(); }
      } catch (err) { showToast(err.message, 'err'); loadCart(); }
    }
  });

  tbody.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('.del-btn');
    if (!delBtn) return;
    const id = Number(delBtn.dataset.id);
    if (!confirm('确定删除该购物车条目吗？')) return;
    try {
      await API.post('/api/cart/delete', { cart_id: id });
      cartData = cartData.filter(r => r.CartID !== id);
      render();
      showToast('已删除', 'ok');
    } catch (err) { showToast(err.message, 'err'); }
  });

  checkAll.addEventListener('change', () => {
    cartData.forEach(r => r._checked = checkAll.checked);
    render();
  });

  /* 提交订单：调用后端 /api/order/submit，后端执行存储过程 proc_create_order */
  document.getElementById('submitOrderBtn').addEventListener('click', async () => {
    if (!cartData.length) { showToast('购物车为空', 'err'); return; }
    // 存储过程按购物车全部条目下单（不区分勾选），这里给出提示
    const unchecked = cartData.filter(r => !r._checked).length;
    if (unchecked > 0 && !confirm('存储过程将按购物车全部商品下单（含未勾选的 ' + unchecked + ' 项），确认继续？')) return;
    if (!confirm('确认提交订单？本系统为课程模拟，无真实支付。')) return;
    try {
      const res = await API.post('/api/order/submit', {});
      showToast(res.msg || '下单成功', 'ok');
      setTimeout(() => location.href = 'orders.html', 800);
    } catch (e) {
      showToast(e.message, 'err');
    }
  });

  loadCart();
})();
