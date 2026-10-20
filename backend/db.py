# -*- coding: utf-8 -*-
"""
db.py —— pymysql 数据库访问封装（不引入 ORM）

提供三个最常用的函数：
  query(sql, args)       查询多行，返回 list[dict]
  query_one(sql, args)   查询单行，返回 dict 或 None
  execute(sql, args)     执行增/删/改，返回自增主键 lastrowid
另有：
  call_create_order(user_id)  调用存储过程 proc_create_order（见 order.py 使用）
"""

import pymysql
import config


def get_conn():
    """创建一条数据库连接，统一指定字典游标（查询结果每行是 dict，方便取值）"""
    return pymysql.connect(
        host=config.DB_HOST,
        port=config.DB_PORT,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME,
        charset=config.DB_CHARSET,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


def query(sql, args=None):
    """查询多行：SELECT 语句，返回 list[dict]"""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, args or ())
            return cur.fetchall()
    finally:
        conn.close()


def query_one(sql, args=None):
    """查询单行：返回 dict 或 None"""
    rows = query(sql, args)
    return rows[0] if rows else None


def execute(sql, args=None):
    """执行写操作（INSERT/UPDATE/DELETE），返回自增主键（无自增时返回 0）"""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, args or ())
            conn.commit()
            return cur.lastrowid
    finally:
        conn.close()
