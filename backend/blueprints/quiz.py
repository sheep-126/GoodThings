# -*- coding: utf-8 -*-
"""
quiz.py —— 风格测试问卷模块蓝图

接口：
  GET  /api/quiz/questions   获取全部题目（含选项及各季得分）
  POST /api/quiz/submit      提交答题，按四季得分计算风格并写入 StyleTestResult
  GET  /api/quiz/records     当前用户的测试记录列表

说明：
  数据库 StyleOption 表设计为一个“选项文字”可能对应多个 StyleTag 行
 （例如第 1 题 A 选项同时给“夏”和“冬”各加 1 分）。
  前端展示时把同一选项的多个季型得分聚合成 scores 字典；
  提交后后端把每个答案对应行里的 Score 分别累加到春/夏/秋/冬四个总分，
  得分最高的季型即为最终风格。
"""

from flask import Blueprint, request, session, jsonify

import db
from .auth import get_login_user

quiz_bp = Blueprint("quiz", __name__)


@quiz_bp.route("/questions", methods=["GET"])
def questions():
    """返回全部题目（按题号排序）+ 每个选项的四季得分"""
    qs = db.query("SELECT QuestionID, QuestionNo, QuestionText FROM StyleQuestion ORDER BY QuestionNo, QuestionID")
    opts = db.query("SELECT OptionID, QuestionID, OptionLetter, OptionText, StyleTag, Score FROM StyleOption")

    # 把选项按题目分组，并聚合每个选项的四季得分
    by_q = {}
    for q in qs:
        by_q[q["QuestionID"]] = {
            "question_id": q["QuestionID"],
            "question_no": q["QuestionNo"],
            "question_text": q["QuestionText"],
            "options": [],
        }

    option_map = {}  # (question_id, letter) -> {letter, text, scores}
    for o in opts:
        key = (o["QuestionID"], o["OptionLetter"])
        if key not in option_map:
            option_map[key] = {
                "letter": o["OptionLetter"],
                "text": o["OptionText"],
                "scores": {"春": 0.0, "夏": 0.0, "秋": 0.0, "冬": 0.0},
            }
        option_map[key]["scores"][o["StyleTag"]] = option_map[key]["scores"].get(o["StyleTag"], 0) + float(o["Score"])

    for (qid, letter), opt in option_map.items():
        if qid in by_q:
            by_q[qid]["options"].append(opt)

    result = sorted(by_q.values(), key=lambda x: x["question_no"])
    return jsonify({"success": True, "data": result})


@quiz_bp.route("/submit", methods=["POST"])
def submit():
    """
    提交答题：body 形如 {"answers": {"1": "A", "2": "B", ...}}
    返回最终季型与四季得分。
    """
    user = get_login_user()
    if not user:
        return jsonify({"success": False, "msg": "请先登录后再做测试"}), 401

    data = request.get_json(silent=True) or {}
    answers = data.get("answers") or {}
    if not answers:
        return jsonify({"success": False, "msg": "请先完成作答"}), 400

    scores = {"春": 0.0, "夏": 0.0, "秋": 0.0, "冬": 0.0}

    for qid, letter in answers.items():
        rows = db.query(
            "SELECT StyleTag, Score FROM StyleOption WHERE QuestionID=%s AND OptionLetter=%s",
            (qid, letter),
        )
        for r in rows:
            scores[r["StyleTag"]] = scores.get(r["StyleTag"], 0) + float(r["Score"])

    # 得分最高的季型为最终风格（并列时按 春>夏>秋>冬 的字典序取第一个）
    order = ["春", "夏", "秋", "冬"]
    final_tag = max(order, key=lambda t: scores[t])

    db.execute(
        """INSERT INTO StyleTestResult(UserID, spring_score, summer_score, autumn_score, winter_score, FinalStyleTag)
           VALUES(%s, %s, %s, %s, %s, %s)""",
        (user["UserID"], scores["春"], scores["夏"], scores["秋"], scores["冬"], final_tag),
    )

    return jsonify({
        "success": True,
        "msg": "测试完成",
        "final_tag": final_tag,
        "scores": scores,
    })


@quiz_bp.route("/records", methods=["GET"])
def records():
    """当前用户的历史测试记录（个人中心 -> 我的测试记录）"""
    user = get_login_user()
    if not user:
        return jsonify({"success": False, "msg": "请先登录"}), 401
    rows = db.query(
        """SELECT TestID, TestTime, spring_score, summer_score, autumn_score, winter_score, FinalStyleTag
           FROM StyleTestResult WHERE UserID=%s ORDER BY TestTime DESC, TestID DESC""",
        (user["UserID"],),
    )
    return jsonify({"success": True, "data": rows})
