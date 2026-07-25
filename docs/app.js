const map = L.map("map").setView([61.0, 8.0], 5);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

let selectedTakeoff = null;
const listItems = new Map(); // takeoff -> <li>

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

function updateListSelection() {
    for (const [takeoff, item] of listItems) {
        item.classList.toggle("selected", takeoff === selectedTakeoff);
    }
}

function selectTakeoff(takeoff) {
    selectedTakeoff = takeoff;
    showTakeoffDetails(takeoff);
    updateListSelection();
}

function renderList(takeoffs) {
    const list = document.getElementById("list-panel");
    list.innerHTML = "";
    listItems.clear();
    for (const takeoff of takeoffs) {
        const item = document.createElement("li");
        item.textContent = takeoff.name;
        item.addEventListener("click", () => selectTakeoff(takeoff));
        list.appendChild(item);
        listItems.set(takeoff, item);
    }
}

fetch("data/takeoffs.json")
    .then(response => response.json())
    .then(takeoffs => {
        for (const takeoff of takeoffs) {
            L.marker([takeoff.latitude, takeoff.longitude])
                .addTo(map)
                .on("click", () => selectTakeoff(takeoff));
        }
        renderList(takeoffs);
    });
