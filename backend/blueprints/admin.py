# -*- coding: utf-8 -*-
"""
admin.py —— 后台管理模块蓝图（仅管理员可访问，User.IsAdmin=1）

接口：
  题目管理
    GET    /api/admin/questions            题目列表（含选项）
    POST   /api/admin/question             新增题目（含选项）
    PUT    /api/admin/question/<id>        修改题目（选项整体重建）
    DELETE /api/admin/question/<id>        删除题目（先删选项）
  商品管理
    GET    /api/admin/products             商品列表
    POST   /api/admin/product              新增商品
    PUT    /api/admin/product/<id>         修改商品
    DELETE /api/admin/product/<id>         删除商品
  订单管理
    GET    /api/admin/orders               全部订单（时间倒序）
    PUT    /api/admin/order/<id>/status    修改订单状态（待付款/已付款/已发货）

说明：
  使用 require_admin 装饰器统一做管理员鉴权（session 中的 IsAdmin）。
"""

from functools import wraps

from flask import Blueprint, request, jsonify, session

import db
from .auth import get_login_user

admin_bp = Blueprint("admin", __name__)

ORDER_STATUS = ["待付款", "已付款", "已发货"]
STYLE_TAGS = ["春", "夏", "秋", "冬"]
SCENE_TAGS = ["上课", "约会聚会", "出游逛街", "居家"]


def require_admin(fn):
    """管理员鉴权装饰器：未登录或非管理员一律拒绝"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = get_login_user()
        if not user:
            return jsonify({"success": False, "msg": "请先登录"}), 401
        if user["IsAdmin"] != 1:
            return jsonify({"success": False, "msg": "无管理员权限"}), 403
        return fn(*args, **kwargs)
    return wrapper


# ===================== 题目管理 =====================

@admin_bp.route("/questions", methods=["GET"])
@require_admin
def questions():
    qs = db.query("SELECT QuestionID, QuestionNo, QuestionText FROM StyleQuestion ORDER BY QuestionNo, QuestionID")
    opts = db.query("SELECT OptionID, QuestionID, OptionLetter, OptionText, StyleTag, Score FROM StyleOption")
    by_q = {q["QuestionID"]: {**q, "options": []} for q in qs}
    for o in opts:
        if o["QuestionID"] in by_q:
            by_q[o["QuestionID"]]["options"].append(o)
    return jsonify({"success": True, "data": sorted(by_q.values(), key=lambda x: x["QuestionNo"])})


def _parse_question(data):
    """校验并解析题目 + 选项数据"""
    question_no = int(data.get("question_no") or 0)
    question_text = (data.get("question_text") or "").strip()
    options = data.get("options") or []
    if not question_no or not question_text:
        raise ValueError("题号和题目内容不能为空")
    if not options:
        raise ValueError("至少需要一个选项")
    parsed = []
    for o in options:
        letter = (o.get("letter") or "").strip().upper()
        text = (o.get("text") or "").strip()
        style = (o.get("style") or "").strip()
        score = float(o.get("score") or 0)
        if letter not in ("A", "B", "C", "D") or not text or style not in STYLE_TAGS:
            raise ValueError("选项字段不完整或季型不合法")
        parsed.append((letter, text, style, score))
    return question_no, question_text, parsed


@admin_bp.route("/question", methods=["POST"])
@require_admin
def add_question():
    """新增题目 + 选项（使用事务保证题目与选项一起成功/失败）"""
    data = request.get_json(silent=True) or {}
    try:
        qno, qtext, options = _parse_question(data)
    except ValueError as e:
        return jsonify({"success": False, "msg": str(e)}), 400

    conn = db.get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO StyleQuestion(QuestionNo, QuestionText) VALUES(%s,%s)", (qno, qtext))
            qid = cur.lastrowid
            for letter, text, style, score in options:
                cur.execute(
                    "INSERT INTO StyleOption(QuestionID, OptionLetter, OptionText, StyleTag, Score) VALUES(%s,%s,%s,%s,%s)",
                    (qid, letter, text, style, score),
                )
            conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "msg": "保存失败：%s" % str(e)}), 400
    finally:
        conn.close()
    return jsonify({"success": True, "msg": "题目已新增"})


@admin_bp.route("/question/<int:qid>", methods=["PUT"])
@require_admin
def update_question(qid):
    """修改题目：更新题目文字，选项整体删除后重建（保持数据干净）"""
    data = request.get_json(silent=True) or {}
    try:
        qno, qtext, options = _parse_question(data)
    except ValueError as e:
        return jsonify({"success": False, "msg": str(e)}), 400

    conn = db.get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE StyleQuestion SET QuestionNo=%s, QuestionText=%s WHERE QuestionID=%s", (qno, qtext, qid))
            cur.execute("DELETE FROM StyleOption WHERE QuestionID=%s", (qid,))
            for letter, text, style, score in options:
                cur.execute(
                    "INSERT INTO StyleOption(QuestionID, OptionLetter, OptionText, StyleTag, Score) VALUES(%s,%s,%s,%s,%s)",
                    (qid, letter, text, style, score),
                )
            conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "msg": "保存失败：%s" % str(e)}), 400
    finally:
        conn.close()
    return jsonify({"success": True, "msg": "题目已更新"})


@admin_bp.route("/question/<int:qid>", methods=["DELETE"])
@require_admin
def delete_question(qid):
    """删除题目：先删选项再删题目（外键约束要求）"""
    db.execute("DELETE FROM StyleOption WHERE QuestionID=%s", (qid,))
    db.execute("DELETE FROM StyleQuestion WHERE QuestionID=%s", (qid,))
    return jsonify({"success": True, "msg": "题目已删除"})


# ===================== 商品管理 =====================

@admin_bp.route("/products", methods=["GET"])
@require_admin
def products():
    rows = db.query(
        """SELECT p.ProductID, p.ProductName, c.CategoryName, p.CategoryID, p.Price, p.Stock,
                  p.Image, p.StyleTag, p.SceneTag, p.IsSet
           FROM Product p LEFT JOIN Category c ON p.CategoryID=c.CategoryID
           ORDER BY p.ProductID""",
    )
    return jsonify({"success": True, "data": rows})


def _parse_product(data, pid=None):
    name = (data.get("product_name") or "").strip()
    price = float(data.get("price") or 0)
    stock = int(data.get("stock") or 0)
    style = (data.get("style_tag") or "").strip()
    scene = (data.get("scene_tag") or "").strip()
    is_set = int(data.get("is_set") or 0)
    image = (data.get("image") or "").strip() or None
    category_id = data.get("category_id") or None
    if not name or price < 0 or stock < 0:
        raise ValueError("商品名称、价格、库存填写不完整")
    if style not in STYLE_TAGS:
        raise ValueError("季型标签不合法")
    return name, price, stock, style, scene, is_set, image, category_id


@admin_bp.route("/product", methods=["POST"])
@require_admin
def add_product():
    data = request.get_json(silent=True) or {}
    try:
        name, price, stock, style, scene, is_set, image, category_id = _parse_product(data)
    except ValueError as e:
        return jsonify({"success": False, "msg": str(e)}), 400
    db.execute(
        "INSERT INTO Product(ProductName, CategoryID, Price, Stock, Image, StyleTag, SceneTag, IsSet) "
        "VALUES(%s,%s,%s,%s,%s,%s,%s,%s)",
        (name, category_id, price, stock, image, style, scene, is_set),
    )
    return jsonify({"success": True, "msg": "商品已新增"})


@admin_bp.route("/product/<int:pid>", methods=["PUT"])
@require_admin
def update_product(pid):
    data = request.get_json(silent=True) or {}
    try:
        name, price, stock, style, scene, is_set, image, category_id = _parse_product(data)
    except ValueError as e:
        return jsonify({"success": False, "msg": str(e)}), 400
    db.execute(
        "UPDATE Product SET ProductName=%s, CategoryID=%s, Price=%s, Stock=%s, Image=%s, StyleTag=%s, SceneTag=%s, IsSet=%s "
        "WHERE ProductID=%s",
        (name, category_id, price, stock, image, style, scene, is_set, pid),
    )
    return jsonify({"success": True, "msg": "商品已更新"})


@admin_bp.route("/product/<int:pid>", methods=["DELETE"])
@require_admin
def delete_product(pid):
    """删除商品：若被套装明细/购物车/订单引用会失败，捕获外键异常并友好提示"""
    try:
        db.execute("DELETE FROM Product WHERE ProductID=%s", (pid,))
    except Exception as e:
        return jsonify({"success": False, "msg": "删除失败：该商品已被其他数据引用（%s）" % str(e)}), 400
    return jsonify({"success": True, "msg": "商品已删除"})


# ===================== 订单管理 =====================

@admin_bp.route("/orders", methods=["GET"])
@require_admin
def orders():
    rows = db.query(
        """SELECT o.OrderID, o.UserID, u.UserName, o.OrderTime, o.TotalAmount, o.OrderStatus
           FROM Orders o JOIN User u ON o.UserID=u.UserID
           ORDER BY o.OrderTime DESC, o.OrderID DESC""",
    )
    return jsonify({"success": True, "data": rows})


@admin_bp.route("/order/<int:order_id>/status", methods=["PUT"])
@require_admin
def update_order_status(order_id):
    data = request.get_json(silent=True) or {}
    status = (data.get("status") or "").strip()
    if status not in ORDER_STATUS:
        return jsonify({"success": False, "msg": "订单状态不合法（待付款/已付款/已发货）"}), 400
    db.execute("UPDATE Orders SET OrderStatus=%s WHERE OrderID=%s", (status, order_id))
    return jsonify({"success": True, "msg": "订单状态已更新"})
