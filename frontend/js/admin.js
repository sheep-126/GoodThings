// admin.js —— 后台管理页：题目 CRUD、商品 CRUD、订单状态修改
(function () {
  // 仅管理员可访问（User.IsAdmin=1），非管理员直接跳走
  initPage('admin').then(user => {
    if (!user || user.is_admin !== 1) {
      location.href = 'login.html?redirect=admin.html';
      return;
    }
    bindTabs();
    loadQuestions();
    loadProducts();
    loadOrders();
  });

  /* tab 切换 */
  function bindTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        ['questions', 'products', 'orders'].forEach(k => {
          document.getElementById('tab-' + k).style.display = k === tab.dataset.tab ? 'block' : 'none';
        });
      });
    });
  }

  /* ============ 题目管理 ============ */
  async function loadQuestions() {
    const tbody = document.getElementById('questionBody');
    try {
      const res = await API.get('/api/admin/questions');
      const rows = res.data || [];
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#8a8a8a">暂无题目</td></tr>';
        return;
      }
      tbody.innerHTML = rows.map((q, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${q.QuestionText}</td>
          <td>${(q.Options || []).map(o => o.Letter + ':' + o.Text).join(' / ')}</td>
          <td>
            <button class="btn btn-outline btn-sm menu-btn" data-act="edit-q" data-id="${q.QuestionID}">编辑</button>
            <button class="btn btn-danger btn-sm" data-act="del-q" data-id="${q.QuestionID}">删除</button>
          </td>
        </tr>`).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="4">加载失败：' + e.message + '</td></tr>';
    }
  }

  /* ============ 商品管理 ============ */
  async function loadProducts() {
    const tbody = document.getElementById('productBody');
    try {
      const res = await API.get('/api/admin/products');
      const rows = res.data || [];
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#8a8a8a">暂无商品</td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(p => `
        <tr>
          <td>${p.ProductID}</td>
          <td>${p.ProductName}</td>
          <td>${p.CategoryName || '-'}</td>
          <td><span class="price">${formatPrice(p.Price)}</span></td>
          <td>${p.Stock}</td>
          <td>${p.StyleTag || '-'}</td>
          <td>${p.SceneTag || '-'}</td>
          <td>${p.IsSet ? '套装' : '单品'}</td>
          <td>
            <button class="btn btn-outline btn-sm menu-btn" data-act="edit-p" data-id="${p.ProductID}">编辑</button>
            <button class="btn btn-danger btn-sm" data-act="del-p" data-id="${p.ProductID}">删除</button>
          </td>
        </tr>`).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="9">加载失败：' + e.message + '</td></tr>';
    }
  }

  /* ============ 订单管理 ============ */
  async function loadOrders() {
    const tbody = document.getElementById('orderBody');
    try {
      const res = await API.get('/api/admin/orders');
      const rows = res.data || [];
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#8a8a8a">暂无订单</td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(o => `
        <tr>
          <td>#${o.OrderID}</td>
          <td>${o.UserName}</td>
          <td>${new Date(o.OrderTime).toLocaleString('zh-CN')}</td>
          <td><span class="price">${formatPrice(o.TotalAmount)}</span></td>
          <td><span class="status-badge">${o.OrderStatus}</span></td>
          <td>
            <select data-status-id="${o.OrderID}">
              <option value="待付款" ${o.OrderStatus === '待付款' ? 'selected' : ''}>待付款</option>
              <option value="已付款" ${o.OrderStatus === '已付款' ? 'selected' : ''}>已付款</option>
              <option value="已发货" ${o.OrderStatus === '已发货' ? 'selected' : ''}>已发货</option>
            </select>
          </td>
        </tr>`).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6">加载失败：' + e.message + '</td></tr>';
    }
  }

  /* 订单状态修改：下拉变化即保存 */
  document.getElementById('orderBody').addEventListener('change', async (e) => {
    const sel = e.target.closest('select[data-status-id]');
    if (!sel) return;
    try {
      await API.put('/api/admin/order/' + sel.dataset.statusId + '/status', { status: sel.value });
      showToast('订单状态已更新', 'ok');
      loadOrders();
    } catch (err) { showToast(err.message, 'err'); loadOrders(); }
  });

  /* ============ 弹窗表单（题目/商品共用） ============ */
  const modalMask = document.getElementById('modalMask');
  const modalTitle = document.getElementById('modalTitle');
  const modalForm = document.getElementById('modalForm');
  let modalState = { type: '', id: null, data: null };

  function showModal(title) {
    modalTitle.textContent = title;
    modalMask.style.display = 'flex';
  }
  function hideModal() {
    modalMask.style.display = 'none';
    modalForm.innerHTML = '';
  }

  /* 题目表单：题号 + 题目内容 + 4 个选项（每个选项含内容 / 对应季型 / 得分） */
  function questionForm(q) {
    const defaultOpts = () => [
      { Letter: 'A', Text: '', StyleTag: '春', Score: 1 },
      { Letter: 'B', Text: '', StyleTag: '秋', Score: 1 },
      { Letter: 'C', Text: '', StyleTag: '冬', Score: 1 },
      { Letter: 'D', Text: '', StyleTag: '夏', Score: 1 },
    ];
    // 后端返回的选项字段为 OptionLetter/OptionText/StyleTag/Score
    const opts = (q && q.Options && q.Options.length) ? q.Options : defaultOpts();
    const optsHtml = opts.map(o => {
      const letter = o.Letter || o.OptionLetter;
      const text = o.Text || o.OptionText || '';
      const style = o.StyleTag || '春';
      const score = (o.Score !== undefined && o.Score !== null) ? o.Score : 1;
      return `
      <div class="form-row">
        <input style="width:52px" value="${letter}" readonly>
        <input style="flex:2" value="${text}" placeholder="选项内容" data-opt-text="${letter}">
        <select data-opt-style="${letter}" style="width:96px">
          ${['春', '夏', '秋', '冬'].map(s => `<option value="${s}" ${style === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <input type="number" step="0.5" min="0" max="1" style="width:70px" value="${score}" data-opt-score="${letter}">
      </div>`;
    }).join('');
    return `
      <div class="form-row">
        <label style="flex:1">题号
          <input id="fQuestionNo" type="number" value="${(q && q.QuestionNo) || 0}">
        </label>
        <label style="flex:4">题目内容
          <input id="fQuestionText" value="${(q && q.QuestionText) || ''}" placeholder="请输入题目">
        </label>
      </div>
      <label>选项（内容 / 对应季型 / 得分，可分别维护）</label>
      ${optsHtml}`;
  }

  /* 商品表单 */
  function productForm(p) {
    return `
      <div class="form-row">
        <label style="flex:2">商品名称<input id="fName" value="${(p && p.ProductName) || ''}"></label>
        <label style="flex:1">分类 ID<input id="fCategory" type="number" value="${(p && p.CategoryID) || 1}"></label>
      </div>
      <div class="form-row">
        <label>价格<input id="fPrice" type="number" step="0.01" value="${(p && p.Price) || ''}"></label>
        <label>库存<input id="fStock" type="number" value="${(p && p.Stock) || 100}"></label>
        <label>类型
          <select id="fIsSet">
            <option value="1" ${p && p.IsSet ? 'selected' : ''}>套装</option>
            <option value="0" ${p && !p.IsSet ? 'selected' : ''}>单品</option>
          </select>
        </label>
      </div>
      <div class="form-row">
        <label>季型
          <select id="fStyle">
            <option value="春" ${p && p.StyleTag === '春' ? 'selected' : ''}>春</option>
            <option value="夏" ${p && p.StyleTag === '夏' ? 'selected' : ''}>夏</option>
            <option value="秋" ${p && p.StyleTag === '秋' ? 'selected' : ''}>秋</option>
            <option value="冬" ${p && p.StyleTag === '冬' ? 'selected' : ''}>冬</option>
          </select>
        </label>
        <label>场景<input id="fScene" value="${(p && p.SceneTag) || ''}" placeholder="如 通勤"></label>
      </div>`;
  }

  /* 工具栏按钮 */
  document.getElementById('addQuestionBtn').addEventListener('click', () => {
    modalState = { type: 'question', id: null };
    modalForm.innerHTML = questionForm(null);
    showModal('新增题目');
  });
  document.getElementById('addProductBtn').addEventListener('click', () => {
    modalState = { type: 'product', id: null };
    modalForm.innerHTML = productForm(null);
    showModal('新增商品');
  });

  /* 表格内编辑/删除按钮（事件委托） */
  document.getElementById('questionBody').addEventListener('click', onBodyClick);
  document.getElementById('productBody').addEventListener('click', onBodyClick);

  async function onBodyClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    const id = Number(btn.dataset.id);

    if (act === 'del-q' || act === 'del-p') {
      if (!confirm('确定删除吗？此操作不可恢复。')) return;
      try {
        const path = act === 'del-q' ? '/api/admin/question/' + id : '/api/admin/product/' + id;
        await API.del(path);
        showToast('删除成功', 'ok');
        loadQuestions(); loadProducts();
      } catch (err) { showToast(err.message, 'err'); }
      return;
    }

    if (act === 'edit-q') {
      const res = await API.get('/api/admin/questions');
      const q = (res.data || []).find(x => x.QuestionID === id);
      if (!q) { showToast('未找到题目', 'err'); return; }
      modalState = { type: 'question', id };
      modalForm.innerHTML = questionForm(q);
      showModal('编辑题目');
    }
    if (act === 'edit-p') {
      const res = await API.get('/api/admin/products');
      const p = (res.data || []).find(x => x.ProductID === id);
      if (!p) { showToast('未找到商品', 'err'); return; }
      modalState = { type: 'product', id };
      modalForm.innerHTML = productForm(p);
      showModal('编辑商品');
    }
  }

  /* 保存按钮 */
  document.getElementById('modalOk').addEventListener('click', async () => {
    if (!modalState.type) return;
    try {
      if (modalState.type === 'question') {
        const question_no = Number(document.getElementById('fQuestionNo').value) || 0;
        const question_text = document.getElementById('fQuestionText').value.trim();
        if (!question_no) { showToast('题号不能为空', 'err'); return; }
        if (!question_text) { showToast('题目内容不能为空', 'err'); return; }
        const options = Array.from(modalForm.querySelectorAll('input[data-opt-text]')).map(i => ({
          letter: i.dataset.optText,
          text: i.value.trim(),
          style: modalForm.querySelector('select[data-opt-style="' + i.dataset.optText + '"]').value,
          score: Number(modalForm.querySelector('input[data-opt-score="' + i.dataset.optText + '"]').value) || 0,
        })).filter(o => o.text);
        if (options.length < 2) { showToast('至少需要 2 个有效选项', 'err'); return; }
        const body = { question_no, question_text, options };
        if (modalState.id) {
          await API.put('/api/admin/question/' + modalState.id, body);
        } else {
          await API.post('/api/admin/question', body);
        }
      } else if (modalState.type === 'product') {
        const body = {
          product_name: document.getElementById('fName').value.trim(),
          category_id: Number(document.getElementById('fCategory').value) || 1,
          price: Number(document.getElementById('fPrice').value) || 0,
          stock: Number(document.getElementById('fStock').value) || 0,
          style_tag: document.getElementById('fStyle').value,
          scene_tag: document.getElementById('fScene').value.trim(),
          is_set: Number(document.getElementById('fIsSet').value),
        };
        if (!body.product_name) { showToast('商品名称不能为空', 'err'); return; }
        if (modalState.id) {
          await API.put('/api/admin/product/' + modalState.id, body);
        } else {
          await API.post('/api/admin/product', body);
        }
      }
      showToast('保存成功', 'ok');
      hideModal();
      loadQuestions(); loadProducts();
    } catch (err) {
      showToast(err.message, 'err');
    }
  });

  document.getElementById('modalCancel').addEventListener('click', hideModal);
  modalMask.addEventListener('click', (e) => { if (e.target === modalMask) hideModal(); });
})();
