# -*- coding: utf-8 -*-
"""
config.py —— 全局配置（可调参数集中在此文件）

课程设计：季节风格穿搭测试 + 模拟穿搭选购系统
说明：数据库连接参数、Flask 端口、密钥等都在这里统一配置，
      其他模块一律从这里导入，不要各自写死。
"""

import os

# ===================== 数据库连接参数 =====================
# 【重要】请把 DB_PASSWORD 改成你自己 MySQL 的密码（占位示例为 123456）
DB_HOST = "127.0.0.1"          # 数据库地址
DB_PORT = 3306                 # 数据库端口
DB_USER = "root"               # 数据库用户名
DB_PASSWORD = "123456"         # 【占位】数据库密码，请改成你自己的密码
DB_NAME = "Goodthing"          # 数据库名（与 database/Goodthing.sql 一致）
DB_CHARSET = "utf8mb4"         # 字符集

# ===================== Flask 服务参数 =====================
PORT = 5000                    # 后端服务端口，浏览器访问 http://127.0.0.1:5000
DEBUG = True                   # 是否开启调试模式
SECRET_KEY = "Goodthing-Secret-Key-2026-Change-Me"  # session 签名密钥（课程作业可简单写死）

# ===================== 前端静态目录 =====================
# 本项目由 Flask 直接托管 frontend 目录下的原生三件套页面，
# 这样前端与后端同源访问，不需要配置跨域（CORS），初学者最易上手。
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "frontend"))
