// order_detail.js —— 订单详情页：订单号/时间/明细/总价/状态
(function () {
  initPage('order_detail').then(user => {
    if (!user) { requireLogin('order_detail.html'); return; }
    loadDetail();
  });

  const box = document.getElementById('orderDetailBox');
  const oid = getQueryParam('id');

  async function loadDetail() {
    if (!oid) { box.innerHTML = '<p class="tip">缺少订单编号。</p>'; return; }
    try {
      const res = await API.get('/api/order/' + oid);
      const order = res.data.order;
      const items = res.data.items || [];
      const badgeCls = order.OrderStatus === '已付款' ? 'paid' : order.OrderStatus === '已发货' ? 'shipped' : '';

      const itemRows = items.map(it => `
        <tr>
          <td><img src="${it.Image}" alt="${it.ProductName}" loading="lazy" style="width:52px;height:52px;border-radius:8px;object-fit:cover"></td>
          <td><a href="detail.html?id=${it.ProductID}">${it.ProductName}</a></td>
          <td>${it.IsSet ? '套装' : '单品'}</td>
          <td>×${it.Quantity}</td>
          <td>${formatPrice(it.UnitPrice)}</td>
          <td><span class="price">${formatPrice(Number(it.UnitPrice) * Number(it.Quantity))}</span></td>
        </tr>`).join('');

      box.innerHTML = `
        <div class="table-wrap" style="padding:20px">
          <p>订单编号：<b>#${order.OrderID}</b></p>
          <p>下单时间：${new Date(order.OrderTime).toLocaleString('zh-CN')}</p>
          <p>订单状态：<span class="status-badge ${badgeCls}">${order.OrderStatus}</span></p>
        </div>
        <div class="table-wrap" style="margin-top:16px">
          <table class="table">
            <thead><tr><th>图片</th><th>商品</th><th>类型</th><th>数量</th><th>单价</th><th>小计</th></tr></thead>
            <tbody>${itemRows || '<tr><td colspan="6" style="text-align:center;color:#8a8a8a">无明细</td></tr>'}</tbody>
          </table>
        </div>
        <div class="cart-bottom">
          <span>实付总价：<span class="price">${formatPrice(order.TotalAmount)}</span></span>
          <a class="btn btn-outline" href="orders.html">返回订单列表</a>
        </div>`;
    } catch (e) {
      box.innerHTML = '<p class="tip">加载失败：' + e.message + '</p>';
    }
  }
})();
