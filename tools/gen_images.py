# -*- coding: utf-8 -*-
"""
gen_images.py —— 商品图片占位图校验 / 补齐脚本

功能：
  1. 解析 database/Goodthing.sql 中 Product 的 INSERT 数据，得到商品数量与商品名称；
  2. 逐个检查 frontend/images/p{ID}.jpg：
     - 已存在（当前仓库为真实商品图）→ 跳过，绝不覆盖；
     - 缺失 → 用 Pillow 生成 600x600 纯色底 + 商品名的 JPG 占位图；
  3. 数据库 Product.Image 已统一赋值为 images/p{ID}.jpg，后端在 Image 为空时
     也按 images/p{ID}.jpg 兜底，保证页面不出现坏图。

用法：
  python tools/gen_images.py              # 按 SQL 中的商品数校验并补齐缺失图片
  python tools/gen_images.py --count 30   # 强制处理 1..30 号（后台新增商品时预留）
  python tools/gen_images.py --force      # 覆盖已存在的图片（会覆盖真实商品图，慎用）

依赖：Pillow（仅生成占位图时需要；全部图片已存在时不会触发）
"""

import argparse
import os
import re
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQL_PATH = os.path.join(BASE_DIR, "database", "Goodthing.sql")
IMG_DIR = os.path.join(BASE_DIR, "frontend", "images")

# 柔和低饱和色板（与前端整体视觉一致）
COLORS = [
    "#f8c6d8", "#cfe4f8", "#d8f0d8", "#fdf0c2", "#e6d9f5",
    "#f9dcc4", "#c2ecf0", "#f5e0e6", "#d9e8c9", "#e2d5c2",
]


def _read_sql(sql_path):
    with open(sql_path, "r", encoding="utf-8") as f:
        return f.read()


def _product_insert_block(sql):
    """截取 INSERT INTO Product(...) VALUES 之后的商品元组块"""
    m = re.search(r"INSERT INTO Product\([^)]*\)\s*VALUES", sql)
    if not m:
        return ""
    tail = sql[m.end():]
    end = tail.find(";")
    return tail if end < 0 else tail[:end]


def parse_product_count(sql_path=SQL_PATH):
    """统计商品条数（本脚本的商品 INSERT 不写显式 ProductID，行序号即自增 ID）"""
    block = _product_insert_block(_read_sql(sql_path))
    return len(re.findall(r"\(\s*'", block))


def extract_product_names(sql_path=SQL_PATH):
    """按出现顺序提取商品名称，返回 {序号: 名称}，序号从 1 开始等于自增 ProductID"""
    block = _product_insert_block(_read_sql(sql_path))
    names = {}
    for idx, m in enumerate(re.finditer(r"\(\s*'([^']*)'", block), start=1):
        names[idx] = m.group(1)
    return names


def make_jpg(product_id, name, out_path):
    """生成 600x600 纯色占位图，居中写商品名（Pillow）"""
    from PIL import Image, ImageDraw, ImageFont

    color = COLORS[(product_id - 1) % len(COLORS)]
    img = Image.new("RGB", (600, 600), color)
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype("msyh.ttc", 34)
    except Exception:
        font = ImageFont.load_default()

    text = name or ("商品 %d" % product_id)
    # 文本居中：按实际包围盒计算
    try:
        box = draw.textbbox((0, 0), text, font=font)
        w, h = box[2] - box[0], box[3] - box[1]
    except Exception:
        w, h = len(text) * 34, 34
    draw.text(((600 - w) / 2, (600 - h) / 2 - 20), text, fill="#5b4a4a", font=font)

    try:
        font_small = ImageFont.truetype("msyh.ttc", 20)
    except Exception:
        font_small = font
    tag = "p%d.jpg" % product_id
    draw.text((250, 340), tag, fill="#7a6a6a", font=font_small)
    img.save(out_path, "JPEG", quality=88)


def main():
    parser = argparse.ArgumentParser(description="商品图片占位图校验 / 补齐")
    parser.add_argument("--count", type=int, default=0, help="强制处理 1..N 号（默认按 SQL 商品数）")
    parser.add_argument("--force", action="store_true", help="覆盖已存在的图片（会覆盖真实商品图）")
    args = parser.parse_args()

    if not os.path.isdir(IMG_DIR):
        os.makedirs(IMG_DIR)

    count = parse_product_count()
    if count == 0:
        print("未从 SQL 中解析到商品数据，请检查 database/Goodthing.sql")
        return 1
    names = extract_product_names()
    total = args.count if args.count > 0 else max(count, 20)
    print("SQL 解析到 %d 个商品，本次处理 p1.jpg ~ p%d.jpg" % (count, total))

    created, skipped = 0, 0
    for pid in range(1, total + 1):
        out_path = os.path.join(IMG_DIR, "p%d.jpg" % pid)
        if os.path.exists(out_path) and not args.force:
            skipped += 1
            continue
        make_jpg(pid, names.get(pid, "商品 %d" % pid), out_path)
        created += 1

    print("完成：新增占位图 %d 张，已存在跳过 %d 张（不覆盖真实商品图）" % (created, skipped))
    print("图片目录：frontend/images/（p1.jpg ~ p%d.jpg）" % total)
    return 0


if __name__ == "__main__":
    sys.exit(main())
