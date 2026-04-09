const API = "http://127.0.0.1:5000";

// Storage helpers
function getUser() {
    try { return JSON.parse(localStorage.getItem("ss_user")); } catch { return null; }
}
function setUser(u) { localStorage.setItem("ss_user", JSON.stringify(u)); }
function clearUser() { localStorage.removeItem("ss_user"); }

//Fetch helper 
async function apiFetch(path, opts = {}) {
    const res = await fetch(API + path, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
}

// Auth guard 
// Runs immediately (IIFE) - redirects to login if not authenticated
(function authGuard() {
    const page = location.pathname.split("/").pop();
    const publicPages = ["login.html", "register.html", "login", "register", ""];
    if (!getUser() && !publicPages.includes(page)) {
        location.href = "/login.html";
    }
})();

//Header patcher
function watchAndPatchHeader(user) {
    const initials = (user.username || "?")
        .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

    function applyPatch() {
        const nameEl   = document.querySelector(".user-name");
        const avatarEl = document.querySelector(".user-avatar");
        if (nameEl)   nameEl.textContent   = user.username;
        if (avatarEl) avatarEl.textContent = initials;

        // Fix logout button: remove inline onclick, replace with proper handler
        const logoutBtn = document.querySelector("button[title='Logout']");
        if (logoutBtn && !logoutBtn.dataset.patched) {
            logoutBtn.dataset.patched = "1";
            // Remove the hardcoded onclick that just does location.href='login.html'
            logoutBtn.removeAttribute("onclick");
            logoutBtn.addEventListener("click", () => {
                clearUser();
                location.href = "/login.html";
            });
        }
    }

    // Watch the header placeholder for when loader.js sets its innerHTML
    const placeholder = document.getElementById("header-placeholder");
    if (placeholder) {
        const observer = new MutationObserver(() => {
            applyPatch();
            // Keep observing in case loader re-renders (shouldn't happen, but safe)
        });
        observer.observe(placeholder, { childList: true, subtree: true });
    }

    // Also try immediately (in case header was already loaded)
    applyPatch();
}

// Dashboard (index.html) 
async function initDashboard() {
    const user = getUser();
    if (!user) return;

    watchAndPatchHeader(user);

    // Dynamic greeting
    const h1 = document.querySelector(".page-header h1");
    if (h1) {
        const hour  = new Date().getHours();
        const greet = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
        h1.textContent = `${greet}, ${user.username}! 👋`;
    }

    // Real stats from backend
    try {
        const stats = await apiFetch(`/stats?user_id=${user.id}`);
        const cards = document.querySelectorAll(".stat-card .stat-content h3");
        if (cards[0]) cards[0].textContent = (stats.total_study_time_minutes / 60).toFixed(1);
        if (cards[1]) cards[1].textContent = stats.completed_tasks;
    } catch (e) { console.warn("Stats:", e.message); }

    // Real tasks: deadlines + focus of day
    try {
        const tasks = await apiFetch(`/tasks?user_id=${user.id}`);

        // Upcoming deadlines
        const upcoming = tasks
            .filter(t => !t.completed && t.deadline)
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 3);

        const list = document.querySelector(".deadline-list");
        if (list) {
            if (upcoming.length) {
                list.innerHTML = upcoming.map(t => `
                    <li>
                        <div class="deadline-info">
                            <span class="title">${escHtml(t.title)}</span>
                            <span class="date">${formatDate(t.deadline)}</span>
                        </div>
                        <span class="priority ${t.priority}">${cap(t.priority)}</span>
                    </li>`).join("");
            } else {
                list.innerHTML = "<li style='color:var(--text-muted);padding:8px 0'>No upcoming deadlines 🎉</li>";
            }
        }

        // Focus of the day: first incomplete task
        const focus = tasks.find(t => !t.completed);
        if (focus) {
            const focusTitle = document.querySelector(".focus-content h4");
            const focusDesc  = document.querySelector(".focus-content p");
            const focusMeta  = document.querySelector(".focus-meta span");
            if (focusTitle) focusTitle.textContent = focus.title;
            if (focusDesc)  focusDesc.textContent  = focus.description || "No description provided.";
            if (focusMeta && focus.deadline) focusMeta.textContent = `Due: ${formatDate(focus.deadline)}`;
        }
    } catch (e) { console.warn("Tasks:", e.message); }
}

//Tasks page (tasks.html)
async function initTasks() {
    const user = getUser();
    if (!user) return;

    watchAndPatchHeader(user);
    await loadTasksFromAPI(user.id);
}

async function loadTasksFromAPI(userId) {
    try {
        const tasks = await apiFetch(`/tasks?user_id=${userId}`);
        const list  = document.getElementById("taskList");
        if (!list) return;
        list.innerHTML = "";
        tasks.forEach(renderTask);
    } catch (e) { console.warn("Load tasks:", e.message); }
}

function renderTask(t) {
    const list = document.getElementById("taskList");
    if (!list) return;

    const li = document.createElement("li");
    li.dataset.id = t.id;
    li.innerHTML = `
        <div class="task-main">
            <input type="checkbox" ${t.completed ? "checked" : ""}>
            <div class="task-text">
                <span style="font-weight:500;${t.completed ? "text-decoration:line-through;opacity:.5" : ""}">${escHtml(t.title)}</span>
                ${t.deadline ? `<small style="color:var(--text-muted);display:block;font-size:0.78rem">Due: ${t.deadline}</small>` : ""}
            </div>
        </div>
        <button class="delete-task"><i class="fa-regular fa-trash-can"></i></button>`;

    // Toggle completed
    li.querySelector("input[type=checkbox]").addEventListener("change", async function () {
        try {
            const updated = await apiFetch(`/tasks/${t.id}`, {
                method: "PUT",
                body: JSON.stringify({ completed: this.checked ? 1 : 0 }),
            });
            const span = li.querySelector("span");
            if (span) span.style = updated.completed
                ? "font-weight:500;text-decoration:line-through;opacity:.5"
                : "font-weight:500";
        } catch (e) { console.warn("Toggle:", e.message); }
    });

    // Delete
    li.querySelector(".delete-task").addEventListener("click", async () => {
        try {
            await apiFetch(`/tasks/${t.id}`, { method: "DELETE" });
            li.remove();
        } catch (e) { console.warn("Delete:", e.message); }
    });

    list.appendChild(li);
}


window._origAddTask = null;
function hookAddTask() {
    if (typeof window.addTask === "function" && !window._addTaskHooked) {
        window._addTaskHooked  = true;
        window._origAddTask    = window.addTask;
        window.addTask = async function () {
            const user  = getUser();
            const input = document.getElementById("taskInput");
            const val   = input?.value.trim();
            if (!val) return;

            if (!user) {
                
                window._origAddTask();
                return;
            }

            try {
                const task = await apiFetch("/tasks", {
                    method: "POST",
                    body: JSON.stringify({
                        user_id:  user.id,
                        title:    val,
                        priority: "medium",
                    }),
                });
                input.value = "";
                renderTask(task);
            } catch (e) {
                console.warn("Add task failed:", e.message);
                window._origAddTask();
            }
        };
    }
}

//Analytics page
async function initAnalytics() {
    const user = getUser();
    if (!user) return;

    watchAndPatchHeader(user);

    try {
        const stats = await apiFetch(`/stats?user_id=${user.id}`);
        const vals  = document.querySelectorAll(".stat-card-value");
        if (vals[0]) vals[0].textContent = (stats.total_study_time_minutes / 60).toFixed(1);
        if (vals[1]) vals[1].textContent = stats.completed_tasks;
    } catch (e) { console.warn("Analytics stats:", e.message); }

    
    try {
        const sessions = await apiFetch(`/sessions?user_id=${user.id}`);
        const byDay = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
        sessions.forEach(s => {
            if (s.start_time) {
                const d = new Date(s.start_time).getDay();
                byDay[d] += (s.duration || 0) / 60;
            }
        });
        // Reorder to Mon-Sun
        const monSun = [byDay[1], byDay[2], byDay[3], byDay[4], byDay[5], byDay[6], byDay[0]]
            .map(v => +v.toFixed(1));

        
        const tryPatchCharts = (attempts = 0) => {
            if (attempts > 20) return;
            const charts = Object.values(Chart.instances || {});
            if (charts.length > 0) {
                charts[0].data.datasets[0].data = monSun;
                charts[0].update();
            } else {
                setTimeout(() => tryPatchCharts(attempts + 1), 200);
            }
        };
        if (window.Chart) tryPatchCharts();
        else setTimeout(() => tryPatchCharts(), 500);
    } catch (e) { console.warn("Session chart:", e.message); }
}

//Profile page
async function initProfile() {
    const user = getUser();
    if (!user) return;

    watchAndPatchHeader(user);

    const initials     = (user.username || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const avatarLarge  = document.querySelector(".profile-avatar-large");
    const nameH2       = document.querySelector(".profile-card h2");
    const nameInput    = document.querySelector(".settings-item input[type=text]");
    const emailInput   = document.querySelector(".settings-item input[type=email]");

    if (avatarLarge) avatarLarge.textContent = initials;
    if (nameH2)      nameH2.textContent      = user.username;
    if (nameInput)   nameInput.value         = user.username;
    if (emailInput)  emailInput.value        = user.email;

    // Update profile button
    const btn = document.querySelector(".btn-primary");
    if (btn) {
        btn.addEventListener("click", async () => {
            const newName = nameInput?.value.trim();
            if (!newName) return;
            // Update locally (no dedicated endpoint, but keep it in sync)
            const updated = { ...user, username: newName };
            setUser(updated);
            if (nameH2)    nameH2.textContent    = newName;
            if (avatarLarge) {
                const newInitials = newName.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
                avatarLarge.textContent = newInitials;
            }
            btn.textContent = "✓ Saved!";
            setTimeout(() => btn.textContent = "Update Profile", 2000);
        });
    }

    // Real stats
    try {
        const stats     = await apiFetch(`/stats?user_id=${user.id}`);
        const streakEl  = document.querySelector(".streak-badge");
        if (streakEl) {
            streakEl.innerHTML = `<i class="fa-solid fa-fire"></i> ${stats.completed_tasks} Tasks Completed &nbsp;|&nbsp; ${stats.total_tasks} Total`;
        }
    } catch (e) { console.warn("Profile stats:", e.message); }
}

//Login page
function initLogin() {
    // If already logged in, go straight to dashboard
    if (getUser()) { location.href = "/index.html"; return; }

    const form = document.querySelector("form");
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const email    = form.querySelector("input[type=email]").value.trim();
        const password = form.querySelector("input[type=password]").value.trim();
        const btn      = form.querySelector("button[type=submit]");
        btn.textContent = "Signing in…";
        btn.disabled    = true;
        try {
            const user = await apiFetch("/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            setUser(user);
            location.href = "/index.html";
        } catch (err) {
            btn.textContent = "Sign In";
            btn.disabled    = false;
            showError(form, "Invalid email or password. Please try again.");
        }
    };
}

//Register page
function initRegister() {
    if (getUser()) { location.href = "/index.html"; return; }

    const form = document.querySelector("form");
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const inputs   = form.querySelectorAll("input");
        const username = inputs[0].value.trim();
        const email    = inputs[1].value.trim();
        const password = inputs[2].value.trim();
        const btn      = form.querySelector("button[type=submit]");
        btn.textContent = "Creating account…";
        btn.disabled    = true;
        try {
            await apiFetch("/register", {
                method: "POST",
                body: JSON.stringify({ username, email, password }),
            });
            showError(form, "✅ Account created! Redirecting to login…", "success");
            setTimeout(() => location.href = "/login.html", 1500);
        } catch (err) {
            btn.textContent = "Join Now";
            btn.disabled    = false;
            showError(form, err.message);
        }
    };
}

//Utilities
function showError(form, msg, type = "error") {
    let el = form.querySelector(".api-msg");
    if (!el) {
        el = document.createElement("p");
        el.className = "api-msg";
        el.style = `text-align:center;margin-top:12px;font-size:.9rem;font-weight:600;padding:10px;border-radius:8px`;
        form.appendChild(el);
    }
    el.textContent = msg;
    el.style.color = type === "success" ? "#16a34a" : "#dc2626";
    el.style.background = type === "success" ? "#f0fdf4" : "#fef2f2";
}

function escHtml(str) {
    return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function cap(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
        return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric"
        });
    } catch { return dateStr; }
}

//Auto-router 
document.addEventListener("DOMContentLoaded", () => {
    const page = location.pathname.split("/").pop() || "login.html";

    if (page === "login.html"     || page === "login")    { initLogin();    return; }
    if (page === "register.html"  || page === "register") { initRegister(); return; }

    // All pages below require auth
    if (page === "index.html"     || page === "")         initDashboard();
    else if (page === "tasks.html"  || page === "tasks")  initTasks();
    else if (page === "analytics.html")                   initAnalytics();
    else if (page === "profile.html")                     initProfile();

    // Hook addTask after tasks.js has defined it
    hookAddTask();
});
