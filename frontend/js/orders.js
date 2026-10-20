// orders.js —— 我的订单页：时间倒序展示，点击跳订单详情
(function () {
  initPage('orders').then(user => {
    if (!user) { requireLogin('orders.html'); return; }
    loadOrders();
  });

  const tbody = document.getElementById('ordersBody');

  async function loadOrders() {
    try {
      const res = await API.get('/api/order/list');
      const rows = res.data || [];
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#8a8a8a">还没有订单，去 <a href="wardrobe.html">穿搭库</a> 选购吧</td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(r => `
        <tr>
          <td>#${r.OrderID}</td>
          <td>${new Date(r.OrderTime).toLocaleString('zh-CN')}</td>
          <td>${r.ItemCount} 件</td>
          <td><span class="price">${formatPrice(r.TotalAmount)}</span></td>
          <td><span class="status-badge ${r.OrderStatus === '已付款' ? 'paid' : r.OrderStatus === '已发货' ? 'shipped' : ''}">${r.OrderStatus}</span></td>
          <td><a class="btn btn-outline btn-sm" href="order_detail.html?id=${r.OrderID}">查看详情</a></td>
        </tr>`).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#8a8a8a">加载失败：' + e.message + '</td></tr>';
    }
  }
})();
