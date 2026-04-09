from flask import Blueprint, request, jsonify, session
from database import get_connection
import hashlib

auth_bp = Blueprint("auth", __name__)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body required"}), 400

    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    if not username or not email or not password:
        return jsonify({"error": "username, email, and password are required"}), 400

    conn = get_connection()

    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "Email already registered"}), 409

    cursor = conn.execute(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        (username, email, hash_password(password)),
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    return jsonify({"id": user_id, "username": username, "email": email}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body required"}), 400

    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    conn = get_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if not user or user["password"] != hash_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    session["user"] = {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
    }

    return jsonify(session["user"])