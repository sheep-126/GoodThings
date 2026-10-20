# -*- coding: utf-8 -*-
"""
blueprints 包：集中导出各模块蓝图，供 app.py 注册。
"""

from .auth import auth_bp
from .quiz import quiz_bp
from .shop import shop_bp
from .cart import cart_bp
from .order import order_bp
from .admin import admin_bp
