# -*- coding: utf-8 -*-
"""
app.py —— Flask 应用入口

启动方式（在 backend 目录下）：
    python app.py
然后浏览器访问：http://127.0.0.1:5000

本项目结构：
  backend/
    app.py            入口：注册蓝图 + 托管 frontend 静态页面
    config.py         全局配置（数据库连接、端口等）
    db.py             pymysql 封装
    blueprints/       按模块拆分的蓝图
      auth.py         用户注册/登录/退出/当前用户
      quiz.py         风格测试题目与结果
      shop.py         穿搭库（商品列表/详情）
      cart.py         购物车
      order.py        订单（调用存储过程 proc_create_order）
      admin.py        后台管理（题目/商品/订单）
"""

import os
from flask import Flask, send_from_directory

import config
from blueprints import (
    auth_bp, quiz_bp, shop_bp, cart_bp, order_bp, admin_bp,
)

app = Flask(__name__)
app.secret_key = config.SECRET_KEY

# ---------- 注册蓝图（后端 JSON 接口统一挂在 /api 下） ----------
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(quiz_bp, url_prefix="/api/quiz")
app.register_blueprint(shop_bp, url_prefix="/api/shop")
app.register_blueprint(cart_bp, url_prefix="/api/cart")
app.register_blueprint(order_bp, url_prefix="/api/order")
app.register_blueprint(admin_bp, url_prefix="/api/admin")


# ---------- 托管 frontend 原生三件套页面 ----------
@app.route("/")
def index():
    """首页：http://127.0.0.1:5000/"""
    return send_from_directory(config.FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    """
    其余页面与静态资源：quiz.html、css/style.css、js/*.js、images/*.svg 等
    直接按 frontend 目录下的相对路径访问即可。
    """
    return send_from_directory(config.FRONTEND_DIR, filename)


if __name__ == "__main__":
    print("=" * 60)
    print("季节风格穿搭测试 + 模拟穿搭选购系统 已启动")
    print("请用浏览器访问: http://127.0.0.1:%d/" % config.PORT)
    print("测试账号: admin / 123456（管理员），stu01 / 123456（普通用户）")
    print("=" * 60)
    # host 使用 127.0.0.1 仅本机访问；如需局域网访问可改为 0.0.0.0
    app.run(host="127.0.0.1", port=config.PORT, debug=config.DEBUG)
