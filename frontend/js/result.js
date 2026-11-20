// result.js —— 结果页：展示匹配季型 + 季型详细风格档案 + 3 套推荐
(function () {
  initPage('result');

  // 四季风格档案：颜色 / 面料材质 / 饰品（金属·宝石·包袋·鞋履·镜框·表带）/ 图案与造型。
  // 内容依据四季色彩理论（个人色彩诊断）通行口径整理：以冷暖、明度、纯度与面料光感为选择依据。
  const STYLE_INFO = {
    '春': {
      color: '#f783ac',
      alias: '浅暖型 · 明亮清透',
      desc: '春季型人肤色清透偏暖（象牙白、蜜桃色或带暖调的中性一白），瞳孔与发丝带暖金光泽，整体气质活泼元气。'
        + '最适合明亮、柔和、带暖意的清色系：浅粉、鹅黄、奶油白、薄荷绿。穿搭宜轻盈明亮、低对比过渡，'
        + '避免厚重浑浊的颜色与大面积纯黑重灰。',
      palette: [
        { name: '奶油黄', hex: '#F7E3A1' },
        { name: '桃粉', hex: '#F5AEB4' },
        { name: '嫩芽绿', hex: '#A8D5A2' },
        { name: '杏色', hex: '#F3D3AE' },
        { name: '浅湖蓝', hex: '#A9CBE8' },
        { name: '珊瑚橘', hex: '#F79F6B' },
        { name: '奶油白', hex: '#FBF6EC' }
      ],
      colors: {
        core: ['奶油白', '米白', '杏色', '浅驼', '象牙色'],
        accent: ['桃粉', '珊瑚橘', '鹅黄', '嫩芽绿', '薄荷绿', '浅湖蓝', '蜜瓜橙', '浅黄绿'],
        neutral: ['浅燕麦灰', '浅卡其', '珍珠米'],
        avoid: ['纯黑', '炭灰', '深褐', '厚重暗红', '灰调莫兰迪色', '荧光冷色', '大面积深藏蓝']
      },
      fabrics: {
        best: ['雪纺', '真丝双绉', '马海毛', '细针织（棉／莫代尔）', '高支棉衬衫布', '泡泡纱', '薄纱', '浅色透明硬纱', '柔软小羊皮'],
        avoid: ['厚重粗花呢', '硬挺漆皮', '深色厚绒', '过重金属感面料', '硬挺厚帆布'],
        note: '总体要求是“柔软、轻盈、线条灵动、层次清新”，同色系深浅叠穿比强对比更容易出彩。'
      },
      accessories: [
        { label: '贵金属', text: '浅金色 K 金（黄金偏淡、14K／18K 暖金）、玫瑰金为主；亮银可小面积点缀做冷调平衡，避免厚重古铜与做旧黑金。' },
        { label: '宝石珍珠', text: '柔光珍珠（白／淡金珠）、琥珀、浅色水晶、橄榄石、月光石、糖果色琉璃、浅色玛瑙；避免黑色宝石与粗大厚重款。' },
        { label: '包袋', text: '小到中号手袋，米白／杏色／浅粉／薄荷绿；材质选细腻羊皮、软质牛皮、编织藤草或尼龙，细肩带优于粗链条。' },
        { label: '鞋履', text: '芭蕾鞋、玛丽珍、浅色乐福鞋、白色小白鞋；羊皮、麂皮、帆布、软牛皮，鞋头圆润、鞋型轻巧。' },
        { label: '镜框与表带', text: '镜框选浅金、玫瑰金、浅玳瑁、透明色；腕表选香槟金表壳配米色／浅棕皮带或细金属链带，表盘不宜过大。' }
      ],
      patterns: ['细碎小花卉', '清爽细条纹', '小波点', '水彩渐变晕染', '细小格纹'],
      patternAvoid: ['粗重黑灰几何', '深底大格纹', '高对比撞色块'],
      tips: '整身彩色控在 3 个以内，用奶油白／米白做底；亮色放在上半身靠近脸的位置最能提气色；妆发适合蜜桃／珊瑚色系唇膏。'
    },

    '夏': {
      color: '#6ea8fe',
      alias: '浅冷型 · 柔和低饱和',
      desc: '夏季型人肤色偏冷粉（冷白皮、冷橄榄皮），瞳孔与发色柔和偏灰。最适合清冷、柔和、带灰度的冷色调：'
        + '雾霾蓝、薰衣草紫、灰粉、珍珠白。气质温婉知性，穿搭宜柔和低饱和、细腻垂坠，避免高饱和荧光色与厚重硬挺面料。',
      palette: [
        { name: '雾霾蓝', hex: '#9BB2C9' },
        { name: '灰粉', hex: '#D9A7B5' },
        { name: '薰衣草紫', hex: '#B7A9D4' },
        { name: '珍珠白', hex: '#F2EFEC' },
        { name: '灰绿', hex: '#A3B8A8' },
        { name: '薄荷灰绿', hex: '#C4DED0' },
        { name: '银灰', hex: '#C7CBD1' }
      ],
      colors: {
        core: ['奶白', '珍珠白', '雾灰', '灰蓝', '燕麦灰'],
        accent: ['雾霾蓝', '灰粉', '薰衣草紫', '薄荷绿', '灰紫', '冷玫瑰粉', '灰蓝绿', '丁香紫'],
        neutral: ['银灰', '浅灰褐', '浅灰蓝'],
        avoid: ['橘调', '橙棕', '焦糖色', '高饱和亮色', '纯黑', '深藏蓝', '荧光粉', '明黄色']
      },
      fabrics: {
        best: ['真丝缎面', '雪纺', '细麻（亚麻混纺）', '棉莫代尔', '薄针织', '环保皮草', '轻量摇粒绒', '柔软呢料', '麂皮', '哑光皮', '灰蓝小香风（含银丝）'],
        avoid: ['粗棒针织', '硬挺厚呢', '厚重亮面皮革', '加棉层压厚重料', '过于板正的硬挺西装'],
        note: '选料遵循“轻量感、有型但不板正、柔软且留有余量”，垂坠细腻的料子最能衬出夏季型的柔和质感。'
      },
      accessories: [
        { label: '贵金属', text: '银、白金、铂金、冷玫瑰金为首选；避开亮黄 K 金与黄铜（会显脸黄），做旧氧化银小量可用。' },
        { label: '宝石珍珠', text: '月光石、粉晶、海蓝宝、灰珍珠／白珍珠、蓝宝石、灰白玛瑙、浅紫水晶；避免琥珀、珊瑚、蜜蜡等暖调材质。' },
        { label: '包袋', text: '中等大小软质包配细链条，雾霾蓝／灰粉／薰衣草／银灰；避开亮黑包身＋金色五金，五金尽量银调或哑光。' },
        { label: '鞋履', text: '芭蕾鞋、乐福鞋、细带凉鞋；麂皮、缎面、哑光皮最佳，颜色选雾蓝、裸粉、银灰、灰紫。' },
        { label: '镜框与表带', text: '镜框选银、灰、雾蓝、冷玫瑰金细框；腕表选白金／精钢表壳配浅灰或珍珠灰皮带，避免金色大表盘。' }
      ],
      patterns: ['细格纹', '灰调水彩花卉', '淡雅碎花', '细条纹', '柔和小千鸟格'],
      patternAvoid: ['高饱和撞色大图案', '粗黑线条', '大面积亮面印花'],
      tips: '蓝白配色是稳妥底牌；灰粉＋雾蓝＋珍珠白的三色组合最显温柔；妆发适合冷调玫瑰、豆沙色系，避免橘调腮红。'
    },

    '秋': {
      color: '#c07b4d',
      alias: '暖深型 · 浓郁质感',
      desc: '秋季型人肤色偏暖麦色（暖黄、小麦或橄榄暖调），脸上少有红晕，发色深棕带暖光，气质沉稳贵气。'
        + '最适合浓郁、温暖、带金黄调的低明度色：大地棕、橄榄绿、砖红、驼色。穿搭宜质感面料与大地色系，'
        + '避免冷白刺眼、莫兰迪灰与荧光色。',
      palette: [
        { name: '驼色', hex: '#C09A6B' },
        { name: '砖红', hex: '#A5513B' },
        { name: '橄榄绿', hex: '#6E7B4B' },
        { name: '芥末黄', hex: '#C9A227' },
        { name: '深咖啡', hex: '#5A4032' },
        { name: '干玫瑰', hex: '#B98A80' },
        { name: '赤陶橙', hex: '#C86F47' }
      ],
      colors: {
        core: ['驼色', '奶油米', '深咖啡', '燕麦色', '卡其'],
        accent: ['砖红／铁锈红', '森林绿', '橄榄绿', '芥末黄', '赤陶橙', '石榴红', '琥珀黄', '风信子蓝（少量）'],
        neutral: ['燕麦白', '暖灰', '浅驼', '芝麻色'],
        avoid: ['纯黑', '纯白', '浅粉', '冰蓝', '薄荷绿', '浅灰', '马卡龙色', '荧光色', '带灰的莫兰迪色']
      },
      fabrics: {
        best: ['羊绒', '美利奴羊毛', '麂皮／磨砂皮', '灯芯绒', '亚麻', '粗花呢', '哑光丝', '水洗做旧棉', '树皮皱', '羊毛绉纱', '油蜡牛皮'],
        avoid: ['漆皮', '亮面化纤', '光滑冷光面料', '廉价亮混纺', '过度闪亮的金属纤维'],
        note: '秋季型的质感来自“哑光＋肌理”：天然纤维的纤维弯曲度自带随光线变化的柔光，针织、牛仔、皮革、粗花呢的材质碰撞最出效果。'
      },
      accessories: [
        { label: '贵金属', text: '古铜、做旧金、哑光金、浓玫瑰金为主，首饰光感要柔和、能融进肤色；避开冷亮银与冷白金，若有银饰选氧化哑光细链。' },
        { label: '宝石珍珠', text: '琥珀／蜜蜡、茶晶、黄玉、石榴石、红纹石、碧玉、暖调祖母绿、深橄榄玉、玳瑁、绿松石；珍珠选暖白、光泽柔和款，避免大颗冷白钻。' },
        { label: '包袋', text: '中大型皮质托特或单肩包，驼色／咖啡／深棕／酒红；头层牛皮、麂皮、编织皮、油蜡皮，五金选做旧金或古铜。' },
        { label: '鞋履', text: '乐福鞋、切尔西靴、麂皮短靴、皮质穆勒鞋；牛皮、麂皮、灯芯绒，颜色选焦糖、深棕、砖红、墨绿。' },
        { label: '镜框与表带', text: '镜框选玳瑁、琥珀棕、古铜、哑光金；腕表选香槟金或古铜表壳配棕色皮带，可适度放大表盘量感。' }
      ],
      patterns: ['千鸟格', '大地色格纹', '动物纹（豹纹／蛇纹）', '复古印花', '树皮肌理', '苏格兰格'],
      patternAvoid: ['浅底小碎花', '冷色调几何', '荧光拼色'],
      tips: '同色系深浅棕叠穿最显高级（深棕打底＋驼色外套）；铁锈红配橘红做邻近色点睛；首饰量感可以偏大，民族风、木质、玳瑁都合适。'
    },

    '冬': {
      color: '#845ec2',
      alias: '净冷型 · 高对比冷艳',
      desc: '冬季型人肤色对比鲜明（冷白、冷橄榄或冷小麦），瞳孔乌黑、发色纯黑或冷调深褐，气质冷艳利落。'
        + '最适合干净、饱和、纯正的冷色调：正黑、宝蓝、正红、纯白，以及宝石色系。穿搭宜高对比、线条利落、面料有光泽与挺度，'
        + '避免浑浊不清的中间色、暖调大地色与软塌面料。',
      palette: [
        { name: '正黑', hex: '#1A1A1E' },
        { name: '纯白', hex: '#FFFFFF' },
        { name: '宝蓝', hex: '#1B3FA0' },
        { name: '正红', hex: '#C1121F' },
        { name: '祖母绿', hex: '#1F6F5C' },
        { name: '葡萄紫', hex: '#4B2E83' },
        { name: '玫红', hex: '#C62368' },
        { name: '冰蓝', hex: '#A8C8E8' }
      ],
      colors: {
        core: ['正黑', '纯白', '炭灰', '藏蓝', '冷调米白'],
        accent: ['宝蓝／钴蓝', '正红', '酒红', '祖母绿', '玫红', '紫红', '深紫', '柠檬黄（单品点缀）', '冰粉', '冰蓝'],
        neutral: ['冷灰', '浅灰', '冰灰'],
        avoid: ['暖驼', '焦糖', '姜黄', '暖棕', '奶茶色', '暖橘', '莫兰迪灰雾色', '土黄', '做旧水洗色']
      },
      fabrics: {
        best: ['羊绒', '精纺羊毛', '西装呢', '皮革／漆皮（小面积）', '丝绒', '缎面', '真丝', '高支挺括棉', '透明硬纱', '亮面尼龙'],
        avoid: ['软塌宽大棉麻', '过多蕾丝花边', '小碎花软面料', '甜系蓬纱', '做旧水洗牛仔'],
        note: '选料强调“平滑、有挺度、带光泽”：线条利落的 H 型、高领、方领、收腰西装最衬；整身黑白撞色即可成立，用减法而非加法。'
      },
      accessories: [
        { label: '贵金属', text: '银、白金、铂金、亮面精钢为主；避开黄金、黄铜、古铜与玫瑰金等暖调金属，饰品线条宜简洁几何、光泽要亮。' },
        { label: '宝石珍珠', text: '钻石、白珍珠／黑珍珠、蓝宝石、红宝石、祖母绿、黑玛瑙、青金石、水晶、绿松石（深色高光泽款）；避免琥珀、木质、蜜蜡。' },
        { label: '包袋', text: '硬挺几何款、漆皮／光面皮，正黑／纯白／正红／宝蓝；金属细链条或方扣五金，避开软塌编织与暖棕皮。' },
        { label: '鞋履', text: '尖头高跟、切尔西靴、马丁靴、漆皮乐福；黑／白／宝蓝／酒红，鞋型利落、鞋面光洁。' },
        { label: '镜框与表带', text: '镜框选黑、银、冷灰、透明、宝蓝；腕表选精钢／白金表壳配黑或深蓝皮带、钢带，表盘可稍大、线条偏方。' }
      ],
      patterns: ['清晰锐利条纹', '醒目格纹', '千鸟格', '大色块拼色', '抽象几何', '黑白对比'],
      patternAvoid: ['柔雾渐变', '甜腻小碎花', '蕾丝花边', '低对比灰调印花'],
      tips: '冬季型靠“减法”取胜：黑配白、深配亮的高反差最有气场；口红选正红／浆果色，发色保持乌黑或冷调深褐；整身亮点只留一处更利落。'
    },
  };

  const tag = getQueryParam('tag') || '春';
  const info = STYLE_INFO[tag] || STYLE_INFO['春'];

  // 通用列表渲染：把关键词数组拼成圆角标签
  function chips(list, cls) {
    return (list || []).map((t) => `<span class="chip${cls ? ' ' + cls : ''}">${t}</span>`).join('');
  }

  function renderPalette() {
    const rows = (info.palette || []).map((p) =>
      `<span class="palette-chip"><i style="background:${p.hex}"></i>${p.name}</span>`).join('');
    return rows ? `<div class="style-palette">${rows}</div>` : '';
  }

  function renderDetail() {
    const c = info.colors || {};
    const f = info.fabrics || {};
    const acc = (info.accessories || []).map((a) =>
      `<div class="detail-row"><span class="k">${a.label}</span>${a.text}</div>`).join('');
    return `<div class="style-detail">
      <div class="detail-card">
        <h4>适配颜色</h4>
        <div class="detail-row"><span class="k">基础色</span><span class="chip-list">${chips(c.core)}</span></div>
        <div class="detail-row"><span class="k">点睛色</span><span class="chip-list">${chips(c.accent)}</span></div>
        <div class="detail-row"><span class="k">中性色</span><span class="chip-list">${chips(c.neutral)}</span></div>
        <div class="detail-row"><span class="k">规避色</span><span class="chip-list">${chips(c.avoid, 'avoid')}</span></div>
      </div>
      <div class="detail-card">
        <h4>衣服材质</h4>
        <div class="detail-row"><span class="k">推荐面料</span><span class="chip-list">${chips(f.best)}</span></div>
        <div class="detail-row"><span class="k">慎用面料</span><span class="chip-list">${chips(f.avoid, 'avoid')}</span></div>
        ${f.note ? `<p class="detail-note">${f.note}</p>` : ''}
      </div>
      <div class="detail-card">
        <h4>饰品材质与颜色</h4>
        ${acc}
      </div>
      <div class="detail-card">
        <h4>图案与造型建议</h4>
        <div class="detail-row"><span class="k">适合图案</span><span class="chip-list">${chips(info.patterns)}</span></div>
        <div class="detail-row"><span class="k">慎用图案</span><span class="chip-list">${chips(info.patternAvoid, 'avoid')}</span></div>
        ${info.tips ? `<p class="detail-note">${info.tips}</p>` : ''}
      </div>
    </div>`;
  }

  function renderResultCard() {
    const card = document.getElementById('resultCard');
    let scoresHtml = '';
    try {
      const scores = JSON.parse(getQueryParam('scores') || '{}');
      // 归一化四季得分用于条形图比例（0~1），仅作宽度变量，不改变展示数值
      const seasons = ['春', '夏', '秋', '冬'];
      const sum = seasons.reduce((a, k) => a + (Number(scores[k]) || 0), 0) || 1;
      const pct = (k) => ((Number(scores[k]) || 0) / sum).toFixed(3);
      scoresHtml = `<div class="score-line">
        ${seasons.map((k) => `<span style="--pct:${pct(k)}">${k}型 <b>${scores[k] ?? '-'}</b></span>`).join('')}
      </div>`;
    } catch (e) { /* 直接访问结果页时无得分，不展示 */ }
    card.innerHTML = `
      <div class="result-tag" style="background:${info.color}">${tag}季型</div>
      <h2 class="result-name">你的四季风格是：${tag}季型 · ${info.alias}</h2>
      <p class="result-desc">${info.desc}</p>
      ${scoresHtml}
      ${renderPalette()}
      ${renderDetail()}
      ${scoresHtml ? '' : '<p class="tip" style="margin-top:10px">注：未检测到测试得分，请先完成 <a href="quiz.html">风格测试</a>。</p>'}`;
  }

  async function loadRecommend() {
    const grid = document.getElementById('recommendGrid');
    try {
      const res = await API.get('/api/shop/products?style=' + encodeURIComponent(tag));
      const list = (res.data || []).slice(0, 3); // 最多 3 套
      if (!list.length) {
        renderEmpty(grid, {
      title: '暂无适配套装',
      desc: '该季型暂无适配套装，去看看穿搭库其他商品吧。',
      actionText: '去穿搭库', actionHref: 'wardrobe.html'
    });
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
