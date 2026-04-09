function addTask() {
    const input = document.getElementById("taskInput");
    const val = input.value.trim();
    if (!val) return;
    const list = document.getElementById("taskList");
    const li = document.createElement("li");
    li.innerHTML = `
        <div class="task-main">
            <input type="checkbox">
            <div class="task-text">
                <span style="font-weight: 500;">${val}</span>
            </div>
        </div>
        <button class="delete-task" onclick="deleteTask(this)">
            <i class="fa-regular fa-trash-can"></i>
        </button>`;
    list.appendChild(li);
    input.value = "";
}

function deleteTask(btn) {
    btn.closest("li").remove();
}