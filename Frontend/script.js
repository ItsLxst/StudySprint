// --- PAGE NAVIGATION ---
function showPage(pageId, element) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");
    
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    element.classList.add("active");
}

// --- POMODORO TIMER SYSTEM ---
let timer;
let time = 1500;
let mode = "focus";
let isRunning = false;

function setMode(selected) {
    mode = selected;
    document.getElementById("focusBtn").classList.toggle("active", mode === "focus");
    document.getElementById("breakBtn").classList.toggle("active", mode === "break");

    if (mode === "focus") {
        time = (document.getElementById("focusTime")?.value || 25) * 60;
        document.getElementById("modeText").innerText = "FOCUS TIME";
    } else {
        time = (document.getElementById("breakTime")?.value || 5) * 60;
        document.getElementById("modeText").innerText = "BREAK TIME";
    }
    updateDisplay();
}

function updateDisplay() {
    let min = Math.floor(time / 60);
    let sec = time % 60;
    document.getElementById("time").innerText = `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

function startTimer() {
    const btn = document.querySelector(".btn-start");
    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
        return;
    }
    isRunning = true;
    btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    timer = setInterval(() => {
        time--;
        updateDisplay();
        if (time <= 0) {
            clearInterval(timer);
            isRunning = false;
            btn.innerHTML = '<i class="fa-solid fa-play"></i>';
            alert("Süre doldu!");
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    document.querySelector(".btn-start").innerHTML = '<i class="fa-solid fa-play"></i>';
    setMode(mode);
}

// --- TASK MANAGEMENT (ADD/DELETE) ---
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
        </button>
    `;
    list.appendChild(li);
    input.value = "";
}

function deleteTask(btn) {
    btn.closest("li").remove();
}

// --- CHARTS INITIALIZATION ---
window.onload = () => {
    setMode('focus');

    // 1. Weekly Focus Hours (Bar Chart)
    const chartCanvas = document.getElementById('chart');
    if (chartCanvas) {
        new Chart(chartCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    data: [4, 3, 5, 4, 6, 2, 3],
                    backgroundColor: '#06b6d4',
                    borderRadius: 6,
                    barThickness: 25
                }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { 
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, 
                    x: { grid: { display: false } } 
                }
            }
        });
    }

    // 2. Tasks Completed (Line Chart)
    const tasksCanvas = document.getElementById('tasksCompletedChart');
    if (tasksCanvas) {
        new Chart(tasksCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    data: [3, 5, 2, 6, 8, 4, 5],
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { 
                    y: { display: false }, 
                    x: { grid: { display: false } } 
                }
            }
        });
    }

    // 3. Distribution (Donut Chart)
    const distCanvas = document.getElementById('focusDistributionChart');
    if (distCanvas) {
        new Chart(distCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Math', 'History', 'Other'],
                datasets: [{
                    data: [55, 30, 15],
                    backgroundColor: ['#06b6d4', '#f59e0b', '#e2e8f0'],
                    borderWidth: 0
                }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false, 
                cutout: '75%',
                plugins: { 
                    legend: { position: 'bottom', labels: { boxWidth: 10 } } 
                }
            }
        });
    }
};