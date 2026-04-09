import os
import sys
from flask import Flask, jsonify, send_from_directory, session, request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
FRONTEND_DIR = os.path.join(PROJECT_DIR, "Frontend")

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from database import init_db
from routes.auth import auth_bp
from routes.tasks import tasks_bp
from routes.sessions import sessions_bp
from routes.stats import stats_bp

app = Flask(__name__)
app.secret_key = "studysprint-secret-key-2024"

# ── CORS ──────────────────────────────────────────────────────────────────────
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin", "")
    response.headers["Access-Control-Allow-Origin"] = origin or "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response

@app.route("/", defaults={"path": ""}, methods=["OPTIONS"])
@app.route("/<path:path>", methods=["OPTIONS"])
def handle_options(path):
    return jsonify({}), 200

# ── Serve static frontend assets ──────────────────────────────────────────────
@app.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, "js"), filename)

@app.route("/css/<path:filename>")
def serve_css(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, "css"), filename)

@app.route("/components/<path:filename>")
def serve_components(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, "components"), filename)

# ── /me – current logged-in user ──────────────────────────────────────────────
@app.route("/me", methods=["GET"])
def me():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401
    return jsonify(user)

# ── Register Blueprints ───────────────────────────────────────────────────────
app.register_blueprint(auth_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(sessions_bp)
app.register_blueprint(stats_bp)

# ── Serve HTML pages (catch-all LAST) ────────────────────────────────────────
@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "login.html")

@app.route("/<path:filename>")
def serve_frontend(filename):
    filepath = os.path.join(FRONTEND_DIR, filename)
    if os.path.isfile(filepath):
        return send_from_directory(FRONTEND_DIR, filename)
    return jsonify({"error": "Not found"}), 404

# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    print("\n✅  StudySprint backend running!")
    print("    Open your browser at: http://127.0.0.1:5000\n")
    app.run(debug=True, port=5000)
