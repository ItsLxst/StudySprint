from flask import Blueprint, request, jsonify
from database import get_connection

tasks_bp = Blueprint("tasks", __name__)

@tasks_bp.route("/tasks", methods=["GET"])
def get_tasks():
    user_id = request.args.get("user_id")

    conn = get_connection()
    if user_id:
        tasks = conn.execute(
            "SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC",
            (user_id,),
        ).fetchall()
    else:
        tasks = conn.execute("SELECT * FROM tasks ORDER BY id DESC").fetchall()
    conn.close()

    return jsonify([dict(t) for t in tasks])

@tasks_bp.route("/tasks", methods=["POST"])
def create_task():
    data = request.get_json(silent=True)

    if not data or not data.get("title"):
        return jsonify({"error": "title is required"}), 400

    conn = get_connection()
    cursor = conn.execute(
        """
        INSERT INTO tasks (user_id, title, description, deadline, priority, completed)
        VALUES (?, ?, ?, ?, ?, 0)
        """,
        (
            data.get("user_id"),
            data["title"].strip(),
            data.get("description"),
            data.get("deadline"),
            data.get("priority", "medium"),
        ),
    )
    conn.commit()
    task_id = cursor.lastrowid
    task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    conn.close()

    return jsonify(dict(task)), 201

@tasks_bp.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.get_json(silent=True) or {}

    conn = get_connection()
    task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()

    if not task:
        conn.close()
        return jsonify({"error": "Task not found"}), 404

    conn.execute(
        """
        UPDATE tasks
        SET title = ?, description = ?, deadline = ?, priority = ?, completed = ?
        WHERE id = ?
        """,
        (
            data.get("title", task["title"]),
            data.get("description", task["description"]),
            data.get("deadline", task["deadline"]),
            data.get("priority", task["priority"]),
            data.get("completed", task["completed"]),
            task_id,
        ),
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    conn.close()

    return jsonify(dict(updated))

@tasks_bp.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    conn = get_connection()
    task = conn.execute("SELECT id FROM tasks WHERE id = ?", (task_id,)).fetchone()

    if not task:
        conn.close()
        return jsonify({"error": "Task not found"}), 404

    conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Task deleted"})