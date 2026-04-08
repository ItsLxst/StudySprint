function addTask() {
    const input = document.getElementById("taskInput");
    const val = input.value.trim();
    if (!val) return;

    const li = document.createElement("li");
    li.innerHTML = `
        ${val} 
        <button onclick="this.parentElement.remove()">X</button>
    `;

    document.getElementById("taskList").appendChild(li);
    input.value = "";
}