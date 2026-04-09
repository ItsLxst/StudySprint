const API = "http://127.0.0.1:5000";

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("ss_user"));
    } catch {
        return null;
    }
}

function setUser(u) {
    localStorage.setItem("ss_user", JSON.stringify(u));
}

function clearUser() {
    localStorage.removeItem("ss_user");
}

async function apiFetch(path, opts = {}) {
    const res = await fetch(API + path, {
        method: opts.method || 'GET',
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Error");
    return data;
}

(function authGuard() {
    const page = location.pathname.split("/").pop();
    const publicPages = ["login.html", "register.html", ""];
    if (!getUser() && !publicPages.includes(page)) {
        location.href = "login.html";
    }
})();

function patchUI() {
    const user = getUser();
    if (!user) return;

    const nameElements = document.querySelectorAll(".user-name, #display-name");
    nameElements.forEach(el => {
        if (el.textContent !== user.username) {
            el.textContent = user.username;
        }
    });

    const h1 = document.querySelector(".page-header h1");
    if (h1 && (location.pathname.includes("index.html") || location.pathname.endsWith("/"))) {
        const hour = new Date().getHours();
        const greet = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
        const newText = `${greet}, ${user.username}! 👋`;
        if (h1.textContent !== newText) {
            h1.textContent = newText;
        }
    }

    const avatarElements = document.querySelectorAll(".user-avatar, .profile-avatar-large");
    let initials = "?";
    if (user.username) {
        const parts = user.username.trim().split(/\s+/);
        if (parts.length === 1) {
            initials = parts[0].charAt(0).toUpperCase();
        } else if (parts.length > 1) {
            initials = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
    }

    avatarElements.forEach(el => {
        if (el.textContent !== initials) {
            el.textContent = initials;
        }
    });

    const logoutBtn = document.querySelector("button[title='Logout']");
    if (logoutBtn && !logoutBtn.dataset.patched) {
        logoutBtn.dataset.patched = "true";
        logoutBtn.removeAttribute("onclick");
        logoutBtn.onclick = () => {
            clearUser();
            location.href = "login.html";
        };
    }
}

async function initDashboard() {
    const user = getUser();
    if (!user) return;
    patchUI();
    try {
        const stats = await apiFetch(`/stats?user_id=${user.id}`);
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        
        setVal("stat-focus-hours", stats.focus_hours || 0);
        setVal("stat-tasks-completed", stats.tasks_completed || 0);
        setVal("stat-streak", (stats.streak || 0) + " days");
        setVal("stat-progress", (stats.progress >= 0 ? "+" : "") + (stats.progress || 0) + "%");

        const tasks = await apiFetch(`/tasks?user_id=${user.id}`);
        const focusContainer = document.getElementById("focus-task-container");
        const deadlineList = document.getElementById("deadline-list");

        if (focusContainer) {
            const incomplete = tasks.filter(t => !t.completed);
            if (incomplete.length > 0) {
                const top = incomplete[0];
                focusContainer.innerHTML = `<h4>${top.title}</h4><p>Stay focused on this task to complete your daily goal.</p><div class="focus-meta"><span>Estimated: 1 hour</span></div>`;
            } else {
                focusContainer.innerHTML = "<p>All tasks completed! Great job.</p>";
            }
        }

        if (deadlineList) {
            deadlineList.innerHTML = tasks.slice(0, 3).map(t => `<li><div class="deadline-info"><span class="title">${t.title}</span></div><span class="priority ${t.completed ? 'medium' : 'high'}">${t.completed ? 'Done' : 'Active'}</span></li>`).join('');
        }
    } catch (e) { console.error(e); }
}

async function initAnalytics() {
    const user = getUser();
    if (!user) return;
    patchUI();
    const timeframe = document.getElementById("analytics-timeframe")?.value || "weekly";
    try {
        const data = await apiFetch(`/analytics?user_id=${user.id}&timeframe=${timeframe}`);
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setVal("stat-total-focus", data.total_focus || 0);
        setVal("stat-total-tasks", data.total_tasks || 0);
        const trendF = document.getElementById("focus-trend");
        const trendT = document.getElementById("tasks-trend");
        if(trendF) trendF.textContent = `${data.focus_trend || '+0'}% This Week`;
        if(trendT) trendT.textContent = `${data.tasks_trend || '+0'} This Week`;
        renderCharts(data.chart_data || [0, 0, 0, 0, 0, 0, 0]);
    } catch (e) { 
        renderCharts([0, 0, 0, 0, 0, 0, 0]);
    }
}

function renderCharts(chartData) {
    const commonOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } };
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    
    const ctx1 = document.getElementById('chart')?.getContext('2d');
    if (ctx1) {
        if (window.myChart1) window.myChart1.destroy();
        window.myChart1 = new Chart(ctx1, {
            type: 'bar',
            data: { labels: labels, datasets: [{ data: chartData, backgroundColor: '#06b6d4', borderRadius: 6 }] },
            options: commonOpts
        });
    }

    const ctx2 = document.getElementById('tasksCompletedChart')?.getContext('2d');
    if (ctx2) {
        if (window.myChart2) window.myChart2.destroy();
        window.myChart2 = new Chart(ctx2, {
            type: 'line',
            data: { labels: labels, datasets: [{ data: chartData, borderColor: '#06b6d4', fill: true, tension: 0.4 }] },
            options: commonOpts
        });
    }
}

async function initTasks() {
    const user = getUser();
    if (!user) return;
    patchUI();
    const list = document.getElementById("taskList");
    if (!list) return;
    try {
        const tasks = await apiFetch(`/tasks?user_id=${user.id}`);
        list.innerHTML = "";
        tasks.forEach(t => {
            const li = document.createElement("li");
            li.innerHTML = `
                <div class="task-main">
                    <input type="checkbox" ${t.completed ? "checked" : ""}>
                    <div class="task-text">
                        <span style="font-weight:500; ${t.completed ? 'text-decoration:line-through; opacity:0.5;' : ''}">${t.title}</span>
                    </div>
                </div>
                <button class="delete-task"><i class="fa-regular fa-trash-can"></i></button>`;

            li.querySelector("input").onchange = async (e) => {
                const isChecked = e.target.checked;
                await apiFetch(`/tasks/${t.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ completed: isChecked ? 1 : 0 })
                });
                initTasks();
                if (document.getElementById("stat-tasks-completed")) initDashboard();
            };

            li.querySelector(".delete-task").onclick = async () => {
                await apiFetch(`/tasks/${t.id}`, { method: "DELETE" });
                li.remove();
                if (document.getElementById("stat-tasks-completed")) initDashboard();
            };

            list.appendChild(li);
        });
    } catch (e) { console.error(e); }
}

window.addTask = async () => {
    const input = document.getElementById("taskInput");
    const val = input?.value.trim();
    const user = getUser();
    if (!val || !user) return;
    try {
        await apiFetch("/tasks", {
            method: "POST",
            body: JSON.stringify({ user_id: user.id, title: val })
        });
        input.value = "";
        initTasks();
        if (document.getElementById("stat-tasks-completed")) initDashboard();
    } catch (e) { console.error(e); }
};

// YENİ KAYIT FONKSİYONU
async function initRegister() {
    const form = document.querySelector("form"); // register.html içindeki form
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const username = form.querySelector("input[type=text]").value;
        const email = form.querySelector("input[type=email]").value;
        const password = form.querySelector("input[type=password]").value;
        const btn = form.querySelector("button");
        btn.textContent = "Creating Account...";
        try {
            await apiFetch("/register", {
                method: "POST",
                body: JSON.stringify({ username, email, password })
            });
            alert("Account created! Please sign in.");
            location.href = "login.html";
        } catch (err) {
            btn.textContent = "Join Now";
            alert(err.message);
        }
    };
}

async function initProfile() {
    const user = getUser();
    if (!user) return;
    patchUI();
    const nameInput = document.getElementById("profile-name");
    const emailInput = document.getElementById("profile-email");
    const btn = document.getElementById("update-profile-btn");
    if (nameInput) nameInput.value = user.username;
    if (emailInput) emailInput.value = user.email;
    if (btn) {
        btn.onclick = () => {
            const newName = nameInput.value.trim();
            if (!newName) return;
            const updated = { ...user, username: newName, email: emailInput.value };
            setUser(updated);
            patchUI();
            btn.textContent = "✓ Saved!";
            setTimeout(() => { btn.textContent = "Update Profile"; }, 2000);
        };
    }
}

async function initSettings() {
    const user = getUser();
    if (!user) return;
    patchUI();
    const nameInput = document.getElementById("settings-name");
    const emailInput = document.getElementById("settings-email");
    const focusInput = document.getElementById("focusTime");
    const breakInput = document.getElementById("breakTime");
    const btn = document.getElementById("save-settings-btn");
    if (nameInput) nameInput.value = user.username;
    if (emailInput) emailInput.value = user.email;
    if (focusInput) focusInput.value = localStorage.getItem("timer_focus") || 25;
    if (breakInput) breakInput.value = localStorage.getItem("timer_break") || 5;
    if (btn) {
        btn.onclick = () => {
            const updated = { ...user, username: nameInput.value.trim(), email: emailInput.value.trim() };
            setUser(updated);
            localStorage.setItem("timer_focus", focusInput.value);
            localStorage.setItem("timer_break", breakInput.value);
            patchUI();
            btn.textContent = "✓ Saved!";
            setTimeout(() => { btn.textContent = "Save Settings"; }, 2000);
        };
    }
}

async function initLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const email = form.querySelector("input[type=email]").value;
        const password = form.querySelector("input[type=password]").value;
        const btn = form.querySelector("button");
        btn.textContent = "Logging in...";
        try {
            const user = await apiFetch("/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });
            setUser(user);
            location.href = "index.html";
        } catch (err) {
            btn.textContent = "Sign In";
            alert(err.message);
        }
    };
}

document.addEventListener("DOMContentLoaded", () => {
    const path = location.pathname.split("/").pop() || "index.html";
    if (path === "login.html") {
        initLogin();
    } else if (path === "register.html") {
        initRegister(); // Register sayfasını başlatan ekleme
    } else if (path === "index.html" || path === "" || path === "index.html#") {
        initDashboard();
    } else if (path === "analytics.html") {
        initAnalytics();
        document.getElementById("analytics-timeframe")?.addEventListener("change", initAnalytics);
    } else if (path === "profile.html") {
        initProfile();
    } else if (path === "settings.html") {
        initSettings();
    } else if (path === "tasks.html") {
        initTasks();
    } else {
        patchUI();
    }
    const placeholder = document.getElementById("header-placeholder");
    if (placeholder) {
        new MutationObserver(() => patchUI()).observe(placeholder, { childList: true, subtree: true });
    }
});