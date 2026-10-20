
# 季节风格穿搭测试 + 模拟穿搭选购系统

课程设计大作业。基于 Python Flask + 原生 HTML/CSS/JS + MySQL（pymysql 直连，不引入 ORM / 前端框架），实现「四季色彩风格测试 -> 风格推荐 -> 模拟穿搭选购」全流程。

## 一、项目目录结构

```
FinalWork/
├── database/
│   └── Goodthing.sql          # 数据库初始化脚本（11 张表 + 视图 + 触发器 + 2 个存储过程）
├── backend/                   # Flask 后端
│   ├── app.py                 # 入口：注册蓝图 + 托管 frontend 页面
│   ├── config.py              # 全局配置（数据库连接、端口、密钥，密码为占位符）
│   ├── db.py                  # pymysql 封装（query / query_one / execute / get_conn）
│   └── blueprints/
│       ├── auth.py            # 用户模块：注册 / 登录 / 当前用户 / 退出
│       ├── quiz.py            # 问卷模块：题目获取 / 提交计分 / 测试记录
│       ├── shop.py            # 穿搭模块：列表（含筛选）/ 详情 / 收藏（localStorage）
│       ├── cart.py            # 购物车：添加 / 列表 / 改数量 / 删除 / 选中总价
│       ├── order.py           # 订单：提交（调用存储过程）/ 列表 / 详情
│       └── admin.py           # 后台管理：题目 / 商品 / 订单状态（管理员）
├── frontend/                  # 原生三件套前端（由 Flask 直接托管，同源无跨域）
│   ├── index.html             # 首页
│   ├── quiz.html              # 问卷页
│   ├── result.html            # 风格结果页
│   ├── wardrobe.html          # 穿搭库列表页
│   ├── detail.html            # 套装详情页
│   ├── cart.html              # 购物车页
│   ├── login.html             # 登录 / 注册页
│   ├── profile.html           # 个人中心页
│   ├── orders.html            # 我的订单页
│   ├── order_detail.html      # 订单详情页
│   ├── admin.html             # 简易后台管理页
│   ├── css/style.css          # 公共样式（含响应式适配）
│   ├── js/                    # 公共与各页面脚本
│   └── images/                # p1.svg ~ p20.svg 商品占位图
├── tools/
│   └── gen_images.py          # 占位图生成脚本（解析 SQL 商品数）
├── requirements.txt           # Python 依赖
└── .gitignore
```

## 二、建库与启动步骤

1. **准备 MySQL**：确保本机 MySQL 已安装并启动服务（默认端口 3306）。
2. **导入数据库脚本**：
   - 命令行方式：`mysql -u root -p < database\Goodthing.sql`
   - 或 Navicat / MySQL Workbench 中打开 `database/Goodthing.sql` 直接执行。
   - 脚本会自动：创建数据库 `Goodthing`、11 张表、视图 `v_style_scene_product`、触发器 `trg_orderitem_after_insert`、存储过程 `proc_create_order` / `proc_style_statistic`，并插入样例数据。
3. **修改数据库密码**：编辑 `backend/config.py`，把 `DB_PASSWORD = "123456"` 改成你自己的 MySQL 密码（当前为占位符）。
4. **安装依赖**：在项目根目录执行 `pip install -r requirements.txt`。
5. **生成占位图（可选）**：数据库商品图片字段未赋值，前端由 `frontend/images/p*.svg` 兜底，仓库已自带 20 张；如需重新生成执行 `python tools/gen_images.py`。
6. **启动 Flask**：进入 `backend` 目录执行 `python app.py`。
7. **浏览器访问**：打开 http://127.0.0.1:5000 （首页 http://127.0.0.1:5000/）。

> 提示：若数据库服务未启动或密码错误，接口会返回 500/无法连接，请先确认 MySQL 状态与 `config.py` 密码。

## 三、测试账号

| 账号 | 密码 | 角色 | 说明 |
| --- | --- | --- | --- |
| admin | 123456 | 管理员（IsAdmin=1） | 可访问后台管理页，管理题目 / 商品 / 订单状态 |
| stu01 | 123456 | 普通用户 | 可做风格测试、逛穿搭库、购物车下单 |

密码在数据库中以 MD5 存储，`123456` 的密文为 `e10adc3949ba59abbe56e057f20f883e`，与后端注册逻辑一致。

## 四、接口路由清单

所有接口返回 JSON，统一前缀 `/api`。

### 用户模块（blueprints/auth.py）
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | /api/auth/register | 注册（密码 MD5 存储） |
| POST | /api/auth/login | 登录（写入 session） |
| GET | /api/auth/me | 获取当前登录用户 |
| POST | /api/auth/logout | 退出登录 |

### 问卷模块（blueprints/quiz.py）
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/quiz/questions | 全部题目（含选项与四季得分） |
| POST | /api/quiz/submit | 提交答案，按春/夏/秋/冬得分返回匹配风格并写入 StyleTestResult |
| GET | /api/quiz/records | 当前用户测试记录 |

### 穿搭模块（blueprints/shop.py）
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/shop/products | 列表，支持 `?style=春&scene=上课&keyword=` 筛选（基于视图 v_style_scene_product） |
| GET | /api/shop/products/<pid> | 详情（套装返回 SetDetail+Product 明细） |

> 收藏功能由前端 localStorage 实现（数据库未设计收藏表），见 `frontend/js/common.js`。

### 购物车模块（blueprints/cart.py）
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | /api/cart/add | 添加商品（已存在则数量累加，上限 99） |
| GET | /api/cart/list | 当前用户购物车列表 |
| POST | /api/cart/update | 修改数量（1-99） |
| POST | /api/cart/delete | 删除条目 |
| GET | /api/cart/total?ids=1,2 | 批量计算选中条目总金额 |

### 订单模块（blueprints/order.py）
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | /api/order/submit | 提交订单，**调用存储过程 proc_create_order** |
| GET | /api/order/list | 订单列表（时间倒序） |
| GET | /api/order/<id> | 订单详情（含明细） |

### 后台管理（blueprints/admin.py，仅管理员）
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/admin/questions | 题目列表（含选项） |
| POST | /api/admin/question | 新增题目（含选项） |
| PUT | /api/admin/question/<id> | 修改题目（选项整体重建） |
| DELETE | /api/admin/question/<id> | 删除题目 |
| GET | /api/admin/products | 商品列表 |
| POST | /api/admin/product | 新增商品 |
| PUT | /api/admin/product/<id> | 修改商品 |
| DELETE | /api/admin/product/<id> | 删除商品 |
| GET | /api/admin/orders | 全部订单 |
| PUT | /api/admin/order/<id>/status | 修改订单状态（待付款/已付款/已发货） |

## 五、页面入口说明

| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 首页 | /index.html（或 /） | 项目标题、开始测试入口、6 张热门套装卡片、顶部导航 |
| 问卷页 | /quiz.html | 题目从 StyleQuestion/StyleOption 读取，单选作答，上一题/下一题/提交 |
| 结果页 | /result.html | 展示四季风格（春/夏/秋/冬）名称、特点、3 套推荐套装 |
| 穿搭库 | /wardrobe.html | 按 StyleTag/SceneTag 筛选，卡片实时刷新 |
| 详情页 | /detail.html | 套装大图、名称、总价、单品明细、加入购物车/立即下单 |
| 购物车 | /cart.html | 勾选、改数量（1-99）、删除、底部实时总金额、提交订单 |
| 登录/注册 | /login.html | 非空校验，密码 MD5，登录成功跳回原页面 |
| 个人中心 | /profile.html | 昵称、我的测试记录/我的收藏/我的订单入口 |
| 我的订单 | /orders.html | 时间倒序订单列表，点击跳详情 |
| 订单详情 | /order_detail.html | 订单号、时间、明细、实付总价、状态 |
| 后台管理 | /admin.html | 仅 admin 可访问：题目/商品/订单管理 |


