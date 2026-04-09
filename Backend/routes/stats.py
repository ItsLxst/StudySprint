from flask import Blueprint, request, jsonify
from database import get_connection

stats_bp = Blueprint("stats", __name__)

@stats_bp.route("/stats", methods=["GET"])
def get_stats():
    user_id = request.args.get("user_id")

    conn = get_connection()

    if user_id:
        total_time = conn.execute(
            "SELECT COALESCE(SUM(duration), 0) AS total FROM study_sessions WHERE user_id = ?",
            (user_id,),
        ).fetchone()["total"]

        completed = conn.execute(
            "SELECT COUNT(*) AS count FROM tasks WHERE user_id = ? AND completed = 1",
            (user_id,),
        ).fetchone()["count"]

        total_tasks = conn.execute(
            "SELECT COUNT(*) AS count FROM tasks WHERE user_id = ?",
            (user_id,),
        ).fetchone()["count"]
    else:
        total_time = conn.execute(
            "SELECT COALESCE(SUM(duration), 0) AS total FROM study_sessions"
        ).fetchone()["total"]

        completed = conn.execute(
            "SELECT COUNT(*) AS count FROM tasks WHERE completed = 1"
        ).fetchone()["count"]

        total_tasks = conn.execute(
            "SELECT COUNT(*) AS count FROM tasks"
        ).fetchone()["count"]

    conn.close()

    return jsonify({
        "total_study_time_minutes": total_time,
        "completed_tasks": completed,
        "total_tasks": total_tasks,
        "pending_tasks": total_tasks - completed,
    })