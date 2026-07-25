const map = L.map("map").setView([61.0, 8.0], 5);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function showTakeoffDetails(takeoff) {
    const panel = document.getElementById("takeoff-panel");
    panel.classList.remove("placeholder");
    panel.classList.add("detail");
    panel.innerHTML = `
        <h2>${escapeHtml(takeoff.name)}</h2>
        <p>${escapeHtml(takeoff.description).replace(/\n/g, "<br>")}</p>
    `;
}

fetch("data/takeoffs.json")
    .then(response => response.json())
    .then(takeoffs => {
        for (const takeoff of takeoffs) {
            L.marker([takeoff.latitude, takeoff.longitude])
                .addTo(map)
                .on("click", () => showTakeoffDetails(takeoff));
        }
    });
