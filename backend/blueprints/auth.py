# -*- coding: utf-8 -*-
"""
auth.py —— 用户模块蓝图

接口：
  POST   /api/auth/register    注册（密码 MD5 存储）
  POST   /api/auth/login       登录（写入 session）
  GET    /api/auth/me          获取当前登录用户
  POST   /api/auth/logout      退出登录

说明：
  登录态采用 Flask 内置 session（服务端签名后写入浏览器 Cookie），
  是课程阶段最简单的登录方案，无需自己实现 Token。
  密码一律 MD5 加密存储，与数据库样例 admin/123456 的密文
  e10adc3949ba59abbe56e057f20f883e 保持一致。
"""

import hashlib

from flask import Blueprint, request, session, jsonify

import db

auth_bp = Blueprint("auth", __name__)


def md5_password(raw):
    """MD5 加密：与数据库样例密文一致"""
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


def get_login_user():
    """从 session 读取当前登录用户，未登录返回 None"""
    uid = session.get("user_id")
    if not uid:
        return None
    return db.query_one("SELECT UserID, UserName, NickName, Gender, Phone, IsAdmin FROM User WHERE UserID=%s", (uid,))


@auth_bp.route("/register", methods=["POST"])
def register():
    """注册：用户名 + 密码（+ 可选昵称）"""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    nickname = (data.get("nickname") or "").strip()

    # 非空校验
    if not username or not password:
        return jsonify({"success": False, "msg": "用户名和密码不能为空"}), 400
    if len(password) < 6:
        return jsonify({"success": False, "msg": "密码长度至少 6 位"}), 400

    # 用户名唯一校验
    exists = db.query_one("SELECT UserID FROM User WHERE UserName=%s", (username,))
    if exists:
        return jsonify({"success": False, "msg": "用户名已存在"}), 400

    db.execute(
        "INSERT INTO User(UserName, Password, NickName) VALUES(%s, %s, %s)",
        (username, md5_password(password), nickname or username),
    )
    return jsonify({"success": True, "msg": "注册成功，请登录"})


@auth_bp.route("/login", methods=["POST"])
def login():
    """登录：校验账号密码，写入 session"""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"success": False, "msg": "用户名和密码不能为空"}), 400

    user = db.query_one("SELECT * FROM User WHERE UserName=%s", (username,))
    if not user or user["Password"] != md5_password(password):
        return jsonify({"success": False, "msg": "用户名或密码错误"}), 400

    # 写入 session 保持登录态
    session["user_id"] = user["UserID"]
    session["is_admin"] = user["IsAdmin"]
    return jsonify({
        "success": True,
        "msg": "登录成功",
        "user": {
            "user_id": user["UserID"],
            "username": user["UserName"],
            "nickname": user["NickName"] or user["UserName"],
            "is_admin": user["IsAdmin"],
        },
    })


@auth_bp.route("/me", methods=["GET"])
def me():
    """获取当前登录用户信息（前端刷新页面后用于恢复登录态）"""
    user = get_login_user()
    if not user:
        return jsonify({"success": False, "msg": "未登录", "logged_in": False})
    return jsonify({
        "success": True,
        "logged_in": True,
        "user": {
            "user_id": user["UserID"],
            "username": user["UserName"],
            "nickname": user["NickName"] or user["UserName"],
            "gender": user["Gender"],
            "phone": user["Phone"],
            "is_admin": user["IsAdmin"],
        },
    })


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """退出登录：清空 session"""
    session.clear()
    return jsonify({"success": True, "msg": "已退出登录"})
