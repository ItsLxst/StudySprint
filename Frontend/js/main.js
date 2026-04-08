fetch("components/sidebar.html")
.then(res => res.text())
.then(data => {
    document.getElementById("sidebar").innerHTML = data;
});

fetch("components/header.html")
.then(res => res.text())
.then(data => {
    document.getElementById("header").innerHTML = data;
});