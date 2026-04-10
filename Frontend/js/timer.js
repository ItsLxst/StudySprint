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
            alert("Time's up!");
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    document.querySelector(".btn-start").innerHTML = '<i class="fa-solid fa-play"></i>';
    setMode(mode);
}