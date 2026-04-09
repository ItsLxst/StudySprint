from flask import Blueprint, request, jsonify
from database import get_connection

# İsim çakışmasını önlemek için sessions_bp yapıyoruz
sessions_bp = Blueprint("sessions", __name__)

@sessions_bp.route("/sessions", methods=["GET"])
def get_sessions():
    user_id = request.args.get("user_id")
    conn = get_connection()
    if user_id:
        # Belirli bir kullanıcının çalışma oturumlarını getirir
        sessions = conn.execute(
            "SELECT * FROM study_sessions WHERE user_id = ?", 
            (user_id,)
        ).fetchall()
    else:
        # Tüm oturumları getirir
        sessions = conn.execute("SELECT * FROM study_sessions").fetchall()
    conn.close()
    return jsonify([dict(s) for s in sessions])