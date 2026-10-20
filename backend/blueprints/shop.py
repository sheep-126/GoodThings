# -*- coding: utf-8 -*-
"""
shop.py —— 穿搭库（商品）模块蓝图

接口：
  GET  /api/shop/products          穿搭库列表（支持 style / scene 筛选）
  GET  /api/shop/products/<pid>    套装/单品详情（含套装内单品明细）

说明：
  1) 列表基于数据库视图 v_style_scene_product 查询（演示视图这一数据库高级特性），
     再关联 Product 表取出 Image 字段。
  2) 原 Goodthing.sql 的商品样例没有给 Image 字段赋值，后端统一按
     images/p{ProductID}.svg 兜底生成默认相对路径，与 frontend/images 下的占位图对应。
  3) 收藏功能因数据库未设计收藏表，采用浏览器 localStorage 实现（见 frontend/js/common.js），
     这里不提供收藏接口，避免与数据库结构不一致。
"""

from flask import Blueprint, request, jsonify

import db

shop_bp = Blueprint("shop", __name__)

STYLE_TAGS = ["春", "夏", "秋", "冬"]
SCENE_TAGS = ["上课", "约会聚会", "出游逛街", "居家"]


def _image_path(row):
    """图片路径兜底：数据库没存图就默认 images/p{ID}.svg"""
    return row["Image"] or "images/p{}.svg".format(row["ProductID"])


@shop_bp.route("/products", methods=["GET"])
def product_list():
    """穿搭库列表：?style=春&scene=上课 可选筛选；带 keyword 可选搜索"""
    style = (request.args.get("style") or "").strip()
    scene = (request.args.get("scene") or "").strip()
    keyword = (request.args.get("keyword") or "").strip()

    sql = """
        SELECT v.ProductID, v.ProductName, v.CategoryName, v.Price, v.Stock,
               v.StyleTag, v.SceneTag, v.IsSet, p.Image
        FROM v_style_scene_product v
        JOIN Product p ON v.ProductID = p.ProductID
        WHERE 1=1
    """
    args = []
    if style:
        sql += " AND v.StyleTag=%s"
        args.append(style)
    if scene:
        sql += " AND v.SceneTag=%s"
        args.append(scene)
    if keyword:
        sql += " AND v.ProductName LIKE %s"
        args.append("%" + keyword + "%")
    sql += " ORDER BY v.IsSet DESC, v.ProductID ASC"

    rows = db.query(sql, args)
    for r in rows:
        r["Image"] = _image_path(r)
    return jsonify({"success": True, "data": rows})


@shop_bp.route("/products/<int:pid>", methods=["GET"])
def product_detail(pid):
    """商品详情：返回商品信息；若是套装，额外返回套装内单品明细（SetDetail + Product）"""
    p = db.query_one("SELECT * FROM Product WHERE ProductID=%s", (pid,))
    if not p:
        return jsonify({"success": False, "msg": "商品不存在"}), 404
    p["Image"] = _image_path(p)
    p["CategoryName"] = (db.query_one("SELECT CategoryName FROM Category WHERE CategoryID=%s", (p["CategoryID"],)) or {}).get("CategoryName")

    items = []
    if p["IsSet"] == 1:
        items = db.query(
            """SELECT sd.ItemProductID AS ProductID, sd.Quantity, it.ProductName, it.Price, it.Image, it.StyleTag
               FROM SetDetail sd JOIN Product it ON sd.ItemProductID = it.ProductID
               WHERE sd.SetProductID=%s""",
            (pid,),
        )
        for it in items:
            it["Image"] = _image_path(it)

    return jsonify({"success": True, "data": {"product": p, "items": items}})
