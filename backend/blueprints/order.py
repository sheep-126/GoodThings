# -*- coding: utf-8 -*-
"""
order.py —— 订单模块蓝图

接口：
  POST /api/order/submit    提交模拟订单（调用存储过程 proc_create_order）
  GET  /api/order/list      当前用户订单列表（时间倒序）
  GET  /api/order/<id>      订单详情（含明细）

说明（重点）：
  下单必须调用数据库存储过程 proc_create_order：
    - 过程内部开启事务，汇总购物车金额 -> 写 Orders -> 写 OrderItem
    - OrderItem 插入后由触发器 trg_orderitem_after_insert 自动扣减库存并写 StockRecord
    - 成功后清空该用户购物车
  存储过程里已内置 ROLLBACK 与错误信息返回，后端只需 CALL 并读取 @msg。
  下方同时给出“手写事务备选方案”的完整代码（被注释），演示不依赖触发器的写法，
  与存储过程方案的差异也写在注释里。
"""

from flask import Blueprint, request, jsonify

import pymysql
import db
import config
from .auth import get_login_user

order_bp = Blueprint("order", __name__)

ORDER_STATUS = ["待付款", "已付款", "已发货"]


def call_proc_create_order(user_id):
    """
    调用存储过程 proc_create_order(user_id, @msg) 并读取输出参数 @msg。
    存储过程内部自行 COMMIT/ROLLBACK，因此这里只做 CALL + 读取。
    """
    conn = db.get_conn()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cur:
            cur.execute("CALL proc_create_order(%s, @msg)", (user_id,))
            conn.commit()  # 存储过程已提交事务，这里再 commit 一次保证连接状态干净
            cur.execute("SELECT @msg AS msg")
            row = cur.fetchone()
            return (row or {}).get("msg") or "下单失败"
    finally:
        conn.close()


# ============================================================
# 手写事务备选方案（不依赖触发器，课程演示用，默认未启用）
# 与存储过程方案的差异：
#   存储过程方案：事务、扣库存、写流水都由数据库端完成，代码简洁、性能好，
#                 但调试时问题被封装在数据库内部；
#   手写事务方案：所有步骤都在 Python 中显式写出，逻辑一目了然，适合讲解，
#                 但需要自己保证 BEGIN/COMMIT/ROLLBACK 配对正确。
# ============================================================
def create_order_manual(user_id):
    """
    手写事务下单（备选，注释保留）。
    注意：由于数据库已创建触发器 trg_orderitem_after_insert，
    手动 INSERT OrderItem 同样会自动扣库存写流水，二者并不冲突。
    """
    conn = db.get_conn()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cur:
            cur.execute("START TRANSACTION")
            # 1. 汇总购物车金额
            cur.execute(
                "SELECT SUM(c.Quantity * p.Price) AS total FROM Cart c "
                "JOIN Product p ON c.ProductID=p.ProductID WHERE c.UserID=%s",
                (user_id,),
            )
            total = (cur.fetchone() or {}).get("total")
            if total is None:
                cur.execute("ROLLBACK")
                return "购物车为空，无法下单"
            # 2. 写订单主表
            cur.execute(
                "INSERT INTO Orders(UserID, TotalAmount, OrderStatus) VALUES(%s,%s,'已付款')",
                (user_id, total),
            )
            oid = cur.lastrowid
            # 3. 写订单明细（触发触发器扣库存/写流水）
            cur.execute(
                "INSERT INTO OrderItem(OrderID, ProductID, Quantity, UnitPrice) "
                "SELECT %s, c.ProductID, c.Quantity, p.Price FROM Cart c "
                "JOIN Product p ON c.ProductID=p.ProductID WHERE c.UserID=%s",
                (oid, user_id),
            )
            # 4. 清空购物车
            cur.execute("DELETE FROM Cart WHERE UserID=%s", (user_id,))
            cur.execute("COMMIT")
            return "下单成功，订单编号：%d" % oid
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        return "下单失败：%s" % str(e)
    finally:
        conn.close()


@order_bp.route("/submit", methods=["POST"])
def submit():
    """提交订单：调用数据库存储过程 proc_create_order"""
    user = get_login_user()
    if not user:
        return jsonify({"success": False, "msg": "请先登录"}), 401

    msg = call_proc_create_order(user["UserID"])
    # 存储过程返回：'下单成功，订单编号：x' 或失败信息
    if msg.startswith("下单成功"):
        order_id = msg.split("：")[-1] if "：" in msg else ""
        return jsonify({"success": True, "msg": msg, "order_id": order_id})
    return jsonify({"success": False, "msg": msg}), 400


@order_bp.route("/list", methods=["GET"])
def order_list():
    """当前用户订单列表（时间倒序）"""
    user = get_login_user()
    if not user:
        return jsonify({"success": False, "msg": "请先登录"}), 401
    rows = db.query(
        """SELECT o.OrderID, o.OrderTime, o.TotalAmount, o.OrderStatus,
                  (SELECT COUNT(*) FROM OrderItem i WHERE i.OrderID = o.OrderID) AS ItemCount
           FROM Orders o WHERE o.UserID=%s
           ORDER BY o.OrderTime DESC, o.OrderID DESC""",
        (user["UserID"],),
    )
    return jsonify({"success": True, "data": rows})


@order_bp.route("/<int:order_id>", methods=["GET"])
def order_detail(order_id):
    """订单详情：订单信息 + 明细（含商品名与图片）"""
    user = get_login_user()
    if not user:
        return jsonify({"success": False, "msg": "请先登录"}), 401

    order = db.query_one("SELECT * FROM Orders WHERE OrderID=%s", (order_id,))
    if not order:
        return jsonify({"success": False, "msg": "订单不存在"}), 404
    # 普通用户只能看自己的订单，管理员可看全部
    if order["UserID"] != user["UserID"] and user["IsAdmin"] != 1:
        return jsonify({"success": False, "msg": "无权查看该订单"}), 403

    items = db.query(
        """SELECT i.ItemID, i.ProductID, i.Quantity, i.UnitPrice,
                  p.ProductName, p.Image, p.IsSet
           FROM OrderItem i JOIN Product p ON i.ProductID = p.ProductID
           WHERE i.OrderID=%s""",
        (order_id,),
    )
    for it in items:
        it["Image"] = it["Image"] or "images/p{}.svg".format(it["ProductID"])

    return jsonify({"success": True, "data": {"order": order, "items": items}})
