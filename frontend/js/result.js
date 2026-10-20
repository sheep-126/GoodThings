// result.js —— 结果页：展示匹配季型 + 3 套推荐
(function () {
  initPage('result');

  // 四季风格介绍文案（与问卷得分联动展示）
  const STYLE_INFO = {
    '春': { color: '#f783ac', desc: '春季型人肤色清透偏暖，适合明亮柔和的暖色调：浅粉、鹅黄、奶油白、薄荷绿。整体气质活泼元气，穿搭宜轻盈明亮，避免厚重浑浊的颜色。' },
    '夏': { color: '#6ea8fe', desc: '夏季型人肤色偏冷粉，适合清冷柔和的冷色调：雾霾蓝、薰衣草紫、灰粉、珍珠白。气质温婉知性，穿搭宜柔和低饱和，避免高饱和荧光色。' },
    '秋': { color: '#c07b4d', desc: '秋季型人肤色偏暖麦色，适合浓郁温暖的色调：大地棕、橄榄绿、砖红、驼色。气质沉稳高级，穿搭宜质感面料与大地色系，避免冷白刺眼。' },
    '冬': { color: '#845ec2', desc: '冬季型人肤色对比鲜明，适合干净饱和的冷色调：正黑、宝蓝、正红、纯白。气质冷艳利落，穿搭宜高对比度，避免浑浊不清的中间色。' },
  };

  const tag = getQueryParam('tag') || '春';
  const info = STYLE_INFO[tag] || STYLE_INFO['春'];

  function renderResultCard() {
    const card = document.getElementById('resultCard');
    let scoresHtml = '';
    try {
      const scores = JSON.parse(getQueryParam('scores') || '{}');
      scoresHtml = `<div class="score-line">
        <span>春型 <b>${scores['春'] ?? '-'}</b></span>
        <span>夏型 <b>${scores['夏'] ?? '-'}</b></span>
        <span>秋型 <b>${scores['秋'] ?? '-'}</b></span>
        <span>冬型 <b>${scores['冬'] ?? '-'}</b></span>
      </div>`;
    } catch (e) { /* 直接访问结果页时无得分，不展示 */ }
    card.innerHTML = `
      <div class="result-tag" style="background:${info.color}">${tag}季型</div>
      <h2 class="result-name">你的四季风格是：${tag}季型</h2>
      <p class="result-desc">${info.desc}</p>
      ${scoresHtml}
      <p class="tip" style="margin-top:10px">注：若直接打开本页未显示得分，请先完成 <a href="quiz.html">风格测试</a>。</p>`;
  }

  async function loadRecommend() {
    const grid = document.getElementById('recommendGrid');
    try {
      const res = await API.get('/api/shop/products?style=' + encodeURIComponent(tag));
      const list = (res.data || []).slice(0, 3); // 最多 3 套
      if (!list.length) {
        grid.innerHTML = '<p class="tip">该季型暂无适配套装，去看看穿搭库其他商品吧。</p>';
        return;
      }
      grid.innerHTML = list.map(renderProductCard).join('');
      bindFavoriteBtns(grid);
    } catch (e) {
      grid.innerHTML = '<p class="tip">加载失败：' + e.message + '</p>';
    }
  }

  renderResultCard();
  loadRecommend();
})();
