import os
import sys
from flask import Flask, jsonify, send_from_directory, session, request
from flask_cors import CORS # Yeni eklendi

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

# CORS Ayarı: Frontend ve Backend arasındaki iletişimi açar
CORS(app, supports_credentials=True)

# /me – Mevcut giriş yapmış kullanıcıyı döndürür
@app.route("/me", methods=["GET"])
def me():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401
    return jsonify(user)

# Blueprint Kayıtları
app.register_blueprint(auth_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(sessions_bp)
app.register_blueprint(stats_bp)

# Statik Dosyaları Sunma (CSS, JS, Resimler)
@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "login.html")

@app.route("/<path:filename>")
def serve_frontend(filename):
    filepath = os.path.join(FRONTEND_DIR, filename)
    if os.path.isfile(filepath):
        return send_from_directory(FRONTEND_DIR, filename)
    return jsonify({"error": "Not found"}), 404

if __name__ == "__main__":
    init_db()
    print("\n✅ StudySprint backend running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)