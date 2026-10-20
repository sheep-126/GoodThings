# -*- coding: utf-8 -*-
"""
cart.py —— 购物车模块蓝图

接口：
  POST /api/cart/add      添加商品到购物车（已存在则数量累加）
  GET  /api/cart/list     当前用户购物车列表（关联商品信息）
  POST /api/cart/update   修改数量（1-99）
  POST /api/cart/delete   删除购物车条目
  GET  /api/cart/total    批量计算选中条目总金额（ids=1,2,3）

说明：
  购物车表 Cart 有 CHECK(Quantity BETWEEN 1 AND 99) 约束，后端同样校验。
"""

from flask import Blueprint, request, jsonify

import db
from .auth import get_login_user

cart_bp = Blueprint("cart", __name__)


def _require_user():
    user = get_login_user()
    if not user:
        return None, (jsonify({"success": False, "msg": "请先登录"}), 401)
    return user, None


@cart_bp.route("/add", methods=["POST"])
def add():
    user, err = _require_user()
    if err:
        return err
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")
    quantity = int(data.get("quantity") or 1)

    if quantity < 1 or quantity > 99:
        return jsonify({"success": False, "msg": "数量必须在 1-99 之间"}), 400

    p = db.query_one("SELECT ProductID, Stock FROM Product WHERE ProductID=%s", (product_id,))
    if not p:
        return jsonify({"success": False, "msg": "商品不存在"}), 404

    exists = db.query_one("SELECT CartID, Quantity FROM Cart WHERE UserID=%s AND ProductID=%s", (user["UserID"], product_id))
    if exists:
        new_qty = min(exists["Quantity"] + quantity, 99)
        db.execute("UPDATE Cart SET Quantity=%s WHERE CartID=%s", (new_qty, exists["CartID"]))
        msg = "已在购物车中，数量累加为 %d" % new_qty
    else:
        db.execute("INSERT INTO Cart(UserID, ProductID, Quantity) VALUES(%s, %s, %s)",
                   (user["UserID"], product_id, quantity))
        msg = "添加成功"
    return jsonify({"success": True, "msg": msg})


@cart_bp.route("/list", methods=["GET"])
def cart_list():
    user, err = _require_user()
    if err:
        return err
    rows = db.query(
        """SELECT c.CartID, c.ProductID, c.Quantity, c.AddTime,
                  p.ProductName, p.Price, p.Image, p.StyleTag, p.SceneTag, p.IsSet
           FROM Cart c JOIN Product p ON c.ProductID = p.ProductID
           WHERE c.UserID=%s ORDER BY c.AddTime DESC, c.CartID DESC""",
        (user["UserID"],),
    )
    for r in rows:
        r["Image"] = r["Image"] or "images/p{}.svg".format(r["ProductID"])
    return jsonify({"success": True, "data": rows})


@cart_bp.route("/update", methods=["POST"])
def update():
    user, err = _require_user()
    if err:
        return err
    data = request.get_json(silent=True) or {}
    cart_id = data.get("cart_id")
    quantity = int(data.get("quantity") or 1)
    if quantity < 1 or quantity > 99:
        return jsonify({"success": False, "msg": "数量必须在 1-99 之间"}), 400

    row = db.query_one("SELECT CartID FROM Cart WHERE CartID=%s AND UserID=%s", (cart_id, user["UserID"]))
    if not row:
        return jsonify({"success": False, "msg": "购物车条目不存在"}), 404
    db.execute("UPDATE Cart SET Quantity=%s WHERE CartID=%s", (quantity, cart_id))
    return jsonify({"success": True, "msg": "数量已更新"})


@cart_bp.route("/delete", methods=["POST"])
def delete():
    user, err = _require_user()
    if err:
        return err
    data = request.get_json(silent=True) or {}
    cart_id = data.get("cart_id")
    db.execute("DELETE FROM Cart WHERE CartID=%s AND UserID=%s", (cart_id, user["UserID"]))
    return jsonify({"success": True, "msg": "已删除"})


@cart_bp.route("/total", methods=["GET"])
def total():
    """按前端勾选的 ids 批量计算总金额（演示后端计算，前端也会实时显示）"""
    user, err = _require_user()
    if err:
        return err
    ids = request.args.get("ids", "")
    id_list = [x.strip() for x in ids.split(",") if x.strip().isdigit()]
    if not id_list:
        return jsonify({"success": True, "data": {"total": 0.0, "count": 0}})

    placeholders = ",".join(["%s"] * len(id_list))
    sql = ("SELECT SUM(c.Quantity * p.Price) AS total, COUNT(*) AS count "
           "FROM Cart c JOIN Product p ON c.ProductID = p.ProductID "
           "WHERE c.UserID=%s AND c.CartID IN (%s)") % ("%s", placeholders)
    row = db.query_one(sql, [user["UserID"]] + id_list)
    return jsonify({"success": True, "data": {"total": float(row["total"] or 0), "count": row["count"]}})
