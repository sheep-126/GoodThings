// quiz.js —— 问卷页：从数据库读取题目、单选作答、上一题/下一题/提交
(function () {
  initPage('quiz');

  let questions = [];      // 题目列表（来自后端 /api/quiz/questions）
  let current = 0;         // 当前题号下标
  const answers = {};      // 已选答案：{ question_id: letter }

  const titleEl = document.getElementById('quizTitle');
  const optionsEl = document.getElementById('quizOptions');
  const progressEl = document.getElementById('quizProgress');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');

  /* 渲染当前题 */
  function renderQuestion() {
    const q = questions[current];
    if (!q) return;
    progressEl.textContent = '题目 ' + (current + 1) + ' / ' + questions.length;
    titleEl.textContent = (q.question_no || (current + 1)) + '. ' + q.question_text;
    optionsEl.innerHTML = q.options.map(o => {
      const selected = answers[q.question_id] === o.letter ? 'selected' : '';
      return `<div class="quiz-option ${selected}" data-letter="${o.letter}">
                <span class="letter">${o.letter}</span>${o.text}
              </div>`;
    }).join('');
    // 选择事件
    optionsEl.querySelectorAll('.quiz-option').forEach(opt => {
      opt.addEventListener('click', () => {
        answers[q.question_id] = opt.getAttribute('data-letter');
        optionsEl.querySelectorAll('.quiz-option').forEach(x => x.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });
    // 按钮状态
    prevBtn.disabled = current === 0;
    const isLast = current === questions.length - 1;
    nextBtn.style.display = isLast ? 'none' : 'inline-block';
    submitBtn.style.display = isLast ? 'inline-block' : 'none';
  }

  prevBtn.addEventListener('click', () => { if (current > 0) { current--; renderQuestion(); } });
  nextBtn.addEventListener('click', () => { if (current < questions.length - 1) { current++; renderQuestion(); } });

  submitBtn.addEventListener('click', async () => {
    // 校验是否全部作答
    for (const q of questions) {
      if (!answers[q.question_id]) {
        showToast('第 ' + (q.question_no || '') + ' 题还未作答，请完成全部题目', 'err');
        return;
      }
    }
    try {
      const res = await API.post('/api/quiz/submit', { answers });
      // 跳转结果页，携带最终季型与得分
      location.href = 'result.html?tag=' + encodeURIComponent(res.final_tag)
        + '&scores=' + encodeURIComponent(JSON.stringify(res.scores));
    } catch (e) {
      showToast(e.message, 'err');
      // 未登录时提示去登录
      if (e.message.includes('登录')) setTimeout(() => location.href = 'login.html?redirect=quiz.html', 900);
    }
  });

  /* 初始化：读取题目 */
  (async function load() {
    try {
      const res = await API.get('/api/quiz/questions');
      questions = res.data || [];
      if (!questions.length) {
        titleEl.textContent = '暂无题目，请管理员在后台添加测试题目';
        return;
      }
      renderQuestion();
    } catch (e) {
      titleEl.textContent = '加载失败：' + e.message;
    }
  })();
})();
