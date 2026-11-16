 项目名称为GoodThings——"季节风格穿搭测试 + 模拟穿搭选购系统"
 部署在 GitHub https://github.com/sheep-126/GoodThings。

项目定位：
面向不会搭配的大学生：先测出适合的季节风格，再按风格与场景挑衣服，支持套装搭配、购物车下单与管理后台维护。

三层架构
层	内容
表现层	11 个 HTML 页面 + 13 个 JS + 流式 CSS（509 行），原生 HTML/CSS/JS，无前端框架
接口层	Flask 后端，6 个蓝图共 27 个 RESTful API（认证 4 / 测验 3 / 商品 2 / 购物车 5 / 订单 3 / 管理 10）
数据层	MySQL95，11 张表 + 1 个视图 + 1 个触发器 + 2 个存储过程
三条业务链路
① 登录 → session 保持身份 → 后续请求自动携带 Cookie
② 答题 → 四季得分累加取最高 → 定春/夏/秋/冬季型 → 推荐对应商品
③ 下单 → 事务汇总金额 → 建订单快照 → 触发器扣库存写流水 → 清购物车
数据库亮点（答辩加分项）
套装建模：Product.IsSet 标记套装，SetDetail 存配件明细与数量，详情页展示"单品合计 vs 套装价 vs 立省金额"
事务下单：proc_create_order 用 START TRANSACTION + EXIT HANDLER 统一异常回滚，失败返回中文提示而非 500
库存审计：trg_orderitem_after_insert 自动扣 Stock 并写入 StockRecord 流水表，只增不改可追溯对账
运行方式
双击 启动GoodThings.bat（需 UAC 提权），浏览器访问 http://127.0.0.1:5000/；MySQL95 服务需在 services.msc 中启动。

测试账号
管理员：admin / 123456（管理端题目/商品/订单维护）
普通用户：stu01 / 123456（完整购物流程）


网址为 http://127.0.0.1:5000 