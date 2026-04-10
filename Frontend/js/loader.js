async function loadComponent(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        const content = await response.text();
        const placeholder = document.getElementById(elementId);
        if (!placeholder) return;
        
        placeholder.innerHTML = content;
        
        if (elementId === 'sidebar-placeholder') {
            const path = window.location.pathname.split("/").pop() || "index.html";
            document.querySelectorAll(".nav-item").forEach(item => {
                const text = item.querySelector("span")?.innerText.toLowerCase();
                if (path === "index.html" || path === "") {
                    if (text === "dashboard") item.classList.add("active");
                } else if (text && path.includes(text.split(" ")[0])) {
                    item.classList.add("active");
                }
            });
        }
    } catch (error) {
        console.error("Component loading error:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadComponent('sidebar-placeholder', 'components/sidebar.html');
    loadComponent('header-placeholder', 'components/header.html');
});