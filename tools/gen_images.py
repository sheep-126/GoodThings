# -*- coding: utf-8 -*-
"""
tools/gen_images.py —— 批量生成本地 SVG 占位图

原理：
  1. 解析 database/Goodthing.sql 中 Product 表的数据行，得到商品最大 ID；
  2. 为 1..N 每个商品生成 frontend/images/p{ID}.svg；
  3. 每张图 = 随机柔和纯色背景 + 商品名文字（居中），供页面占位展示；
  4. 数据库 Product.Image 字段留空时，后端会自动兜底返回 images/p{ID}.svg。

用法：
  python tools/gen_images.py            # 按 SQL 商品数生成
  python tools/gen_images.py --count 40 # 或强制生成 40 张
"""

import os
import re
import argparse
import random

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQL_PATH = os.path.join(BASE_DIR, 'database', 'Goodthing.sql')
IMG_DIR = os.path.join(BASE_DIR, 'frontend', 'images')

# 柔和低饱和色板，保证纯色背景不刺眼
COLORS = [
    '#f8c6d8', '#cfe4f8', '#d8f0d8', '#fdf0c2', '#e6d9f5',
    '#f9dcc4', '#c2ecf0', '#f5e0e6', '#d9e8c9', '#e2d5c2',
]

def parse_product_count(sql_path):
    """
    从 SQL 中统计 Product 表的数据行数。
    注意：本数据库的 INSERT 不写显式 ProductID（依赖 AUTO_INCREMENT），
    形如 INSERT INTO Product(ProductName,CategoryID,...) VALUES ('卫衣',1,...),('长裙',3,...);
    因此按 "( '名称' " 开头的元组计数，行序号即自增后的 ProductID（1..N）。
    """
    if not os.path.exists(sql_path):
        return 0
    text = open(sql_path, encoding='utf-8', errors='ignore').read()
    # 匹配所有 Product 的 INSERT ... VALUES 语句（表名可能带反引号）
    pattern = re.compile(
        r"INSERT\s+INTO\s+`?Product`?\s*\([^)]*\)\s*VALUES\s*(.*?);",
        re.IGNORECASE | re.DOTALL,
    )
    count = 0
    for m in pattern.finditer(text):
        values_block = m.group(1)
        # 每个商品元组以 ( '名称' 开头（首列 ProductName 是字符串）
        count += len(re.findall(r"\(\s*'", values_block))
    return count

def make_svg(product_id, name):
    """生成一张纯色背景 + 商品名文字的 SVG。"""
    color = COLORS[product_id % len(COLORS)]
    # 商品名可能含中文与特殊字符，HTML 转义后嵌入
    safe_name = name.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">\n'
        f'  <rect width="600" height="600" fill="{color}"/>\n'
        f'  <text x="300" y="285" font-size="34" fill="#333333" text-anchor="middle" '
        f'font-family="Microsoft YaHei, sans-serif">{safe_name}</text>\n'
        f'  <text x="300" y="335" font-size="20" fill="#666666" text-anchor="middle" '
        f'font-family="Microsoft YaHei, sans-serif">p{product_id}.svg</text>\n'
        '</svg>\n'
    )

def extract_product_names(sql_path, count):
    """
    从 SQL 中按行序号（=自增 ProductID）提取每个商品的名称，供图内文字展示。
    返回 {1: '名称1', 2: '名称2', ...}。
    """
    names = {}
    if not os.path.exists(sql_path):
        return names
    text = open(sql_path, encoding='utf-8', errors='ignore').read()
    pattern = re.compile(
        r"INSERT\s+INTO\s+`?Product`?\s*\(([^)]*)\)\s*VALUES\s*(.*?);",
        re.IGNORECASE | re.DOTALL,
    )
    for m in pattern.finditer(text):
        cols = [c.strip().strip('`') for c in m.group(1).split(',')]
        try:
            name_idx = cols.index('ProductName')
        except ValueError:
            name_idx = 0  # 首列兜底
        # 逐个商品元组（以 ( ' 开头），按出现顺序编号
        idx = 1
        for row in re.finditer(r"\(\s*'(.*?)'(.*?)\)\s*,?\s*", m.group(2)):
            parts = re.split(r",(?=(?:[^']*'[^']*')*[^']*$)", row.group(2))
            raw = row.group(1)
            names[idx] = raw
            idx += 1
    return names

def main():
    parser = argparse.ArgumentParser(description='生成商品 SVG 占位图')
    parser.add_argument('--count', type=int, default=0,
                        help='强制生成数量（默认按 SQL 商品数）')
    args = parser.parse_args()

    parsed = parse_product_count(SQL_PATH)
    if args.count:
        count = args.count
    else:
        # 至少生成 20 张：覆盖数据库现有商品，也给后台后续新增商品预留占位图
        # （后端对 Product.Image 为空时统一兜底为 images/p{ProductID}.svg）
        count = max(parsed, 20)
    print(f'SQL 解析到 {parsed} 个商品，本次生成 {count} 张')
    names = extract_product_names(SQL_PATH, count)

    os.makedirs(IMG_DIR, exist_ok=True)
    written = 0
    for pid in range(1, count + 1):
        name = names.get(pid, f'商品 {pid}')
        with open(os.path.join(IMG_DIR, f'p{pid}.svg'), 'w', encoding='utf-8') as f:
            f.write(make_svg(pid, name))
        written += 1
    print(f'占位图生成完成：frontend/images/ 共 {written} 张 SVG（p1.svg ~ p{count}.svg）')

if __name__ == '__main__':
    main()
