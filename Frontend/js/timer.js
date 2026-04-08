let timer;
let time = 1500;
let isRunning = false;

function updateDisplay() {
    const el = document.getElementById("time");
    if (!el) return;

    let min = Math.floor(time / 60);
    let sec = time % 60;
    el.innerText = `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

function startTimer() {
    const btn = document.querySelector(".btn-start");
    if (!btn) return;

    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
        btn.innerText = "Start";
        return;
    }

    isRunning = true;
    btn.innerText = "Pause";

    timer = setInterval(() => {
        time--;
        updateDisplay();

        if (time <= 0) {
            clearInterval(timer);
            isRunning = false;
            btn.innerText = "Start";
            alert("Süre doldu!");
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    time = 1500;
    updateDisplay();

    const btn = document.querySelector(".btn-start");
    if (btn) btn.innerText = "Start";
}