// ==========================================================
// api.js —— fetch 封装（原生 JS，无框架）
// 统一处理：请求头、JSON 序列化、错误提示、响应解析
// ==========================================================

const API = {
  // 后端接口前缀：前后端同源（由 Flask 托管 frontend）时留空即可；
  // 若前后端分开部署，可改成 'http://127.0.0.1:5000'
  base: '',

  /**
   * 通用请求方法
   * @param {string} path   接口路径，如 '/api/auth/login'
   * @param {string} method HTTP 方法 GET/POST/PUT/DELETE
   * @param {object} body   请求体（可选）
   */
  async request(path, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body !== null && body !== undefined) {
      options.body = JSON.stringify(body);
    }
    let resp;
    try {
      resp = await fetch(API.base + path, options);
    } catch (e) {
      throw new Error('网络请求失败，请确认后端服务已启动');
    }
    // 兼容后端返回非 JSON（如 404 页面）的情况
    let data = {};
    try { data = await resp.json(); } catch (e) { data = { success: false, msg: '服务响应异常' }; }
    if (!resp.ok || data.success === false) {
      throw new Error(data.msg || '请求失败（' + resp.status + '）');
    }
    return data;
  },

  get(path) { return API.request(path, 'GET'); },
  post(path, body) { return API.request(path, 'POST', body); },
  put(path, body) { return API.request(path, 'PUT', body); },
  del(path) { return API.request(path, 'DELETE'); },
};
