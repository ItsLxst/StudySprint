from flask import Blueprint, request, jsonify
from database import get_connection
import datetime

stats_bp = Blueprint("stats", __name__)

@stats_bp.route("/stats", methods=["GET"])
def get_stats():
    user_id = request.args.get("user_id")
    conn = get_connection()
    
    # Varsayılan değerler
    daily_focus = [0, 0, 0, 0, 0, 0, 0]
    daily_tasks = [0, 0, 0, 0, 0, 0, 0]

    if user_id:
        # Toplam süre
        total_time = conn.execute(
            "SELECT COALESCE(SUM(duration), 0) AS total FROM study_sessions WHERE user_id = ?",
            (user_id,),
        ).fetchone()["total"]

        # Tamamlanan görevler
        completed = conn.execute(
            "SELECT COUNT(*) AS count FROM tasks WHERE user_id = ? AND completed = 1",
            (user_id,),
        ).fetchone()["count"]

        # Toplam görevler
        total_tasks = conn.execute(
            "SELECT COUNT(*) AS count FROM tasks WHERE user_id = ?",
            (user_id,),
        ).fetchone()["count"]

        daily_focus = [15, 30, 45, 20, 60, 10, 5]  
        daily_tasks = [2, 1, 4, 2, 5, 1, 0]      

    else:
        
        total_time = conn.execute("SELECT COALESCE(SUM(duration), 0) AS total FROM study_sessions").fetchone()["total"]
        completed = conn.execute("SELECT COUNT(*) AS count FROM tasks WHERE completed = 1").fetchone()["count"]
        total_tasks = conn.execute("SELECT COUNT(*) AS count FROM tasks").fetchone()["count"]

    conn.close()

    
    return jsonify({
        "total_study_time_minutes": total_time,
        "completed_tasks": completed,
        "total_tasks": total_tasks,
        "pending_tasks": total_tasks - completed,
        "daily_focus": daily_focus,
        "daily_tasks": daily_tasks,
        "streak": 3,
        "progress": 12
    })