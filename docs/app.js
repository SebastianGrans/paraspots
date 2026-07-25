const map = L.map("map").setView([61.0, 8.0], 5);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

let allTakeoffs = [];
let selectedTakeoff = null;
let searchDebounceTimer = null;
const listItems = new Map(); // takeoff -> <li>

// The point takeoff distances are measured from (set via GPS "locate me" or
// manually via the map's right-click "Set as location" menu).
let referenceLocation = null;
let referenceMarker = null;

const referenceIcon = L.divIcon({
    html: "📍",
    className: "reference-marker-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

function setReferenceLocation(lat, lng) {
    referenceLocation = { lat, lng };
    map.setView([lat, lng], 10, { animate: true });
    if (referenceMarker) {
        referenceMarker.setLatLng([lat, lng]);
    } else {
        referenceMarker = L.marker([lat, lng], { icon: referenceIcon, zIndexOffset: 1000 }).addTo(map);
    }
    document.getElementById("sort-distance-option").disabled = false;
    if (sortMode === "distance") {
        refreshList();
    }
}

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
    const list = document.getElementById("list");
    list.innerHTML = "";
    listItems.clear();
    for (const takeoff of takeoffs) {
        const item = document.createElement("li");
        item.textContent = takeoff.name;
        item.addEventListener("click", () => selectTakeoff(takeoff));
        list.appendChild(item);
        listItems.set(takeoff, item);
    }
    updateListSelection();
}

let currentSearchQuery = "";
let sortMode = "name-asc";

function sortTakeoffs(takeoffs) {
    const sorted = takeoffs.slice();
    if (sortMode === "name-desc") {
        sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortMode === "distance" && referenceLocation) {
        const reference = L.latLng(referenceLocation.lat, referenceLocation.lng);
        sorted.sort(
            (a, b) =>
                reference.distanceTo(L.latLng(a.latitude, a.longitude)) -
                reference.distanceTo(L.latLng(b.latitude, b.longitude))
        );
    } else {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
}

function refreshList() {
    const normalized = currentSearchQuery.trim().toLowerCase();
    const filtered = normalized
        ? allTakeoffs.filter(takeoff => takeoff.name.toLowerCase().includes(normalized))
        : allTakeoffs;
    renderList(sortTakeoffs(filtered));
}

function applySearch(query) {
    currentSearchQuery = query;
    refreshList();
}

document.getElementById("search").addEventListener("input", event => {
    clearTimeout(searchDebounceTimer);
    const query = event.target.value;
    searchDebounceTimer = setTimeout(() => applySearch(query), 200);
});

document.getElementById("sort").addEventListener("change", event => {
    sortMode = event.target.value;
    refreshList();
});

const locateBtn = document.getElementById("locate-btn");
const locateError = document.getElementById("locate-error");
let locateErrorTimer = null;

function showLocateError() {
    locateError.classList.remove("hidden");
    clearTimeout(locateErrorTimer);
    locateErrorTimer = setTimeout(() => locateError.classList.add("hidden"), 4000);
}

function setLocating(isLocating) {
    locateBtn.textContent = isLocating ? "…" : "📍";
}

locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        showLocateError();
        return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
        position => {
            setLocating(false);
            setReferenceLocation(position.coords.latitude, position.coords.longitude);
        },
        () => {
            setLocating(false);
            showLocateError();
        }
    );
});

// Right-click ("contextmenu") on the map shows a small custom menu to
// manually set the reference location — mirrors the desktop app's
// right-click "Set as location", since browsers reserve the native
// context menu for their own use. Leaflet prevents the native browser
// menu from appearing and fires its own "contextmenu" event instead.
let mapContextMenu = null;

function closeMapContextMenu() {
    if (mapContextMenu) {
        mapContextMenu.remove();
        mapContextMenu = null;
    }
}

map.on("contextmenu", event => {
    closeMapContextMenu();
    const { lat, lng } = event.latlng;
    const point = map.latLngToContainerPoint(event.latlng);

    mapContextMenu = document.createElement("div");
    mapContextMenu.className = "map-context-menu";
    mapContextMenu.style.left = `${point.x}px`;
    mapContextMenu.style.top = `${point.y}px`;

    const item = document.createElement("div");
    item.textContent = "Set as location";
    item.addEventListener("click", () => setReferenceLocation(lat, lng));
    mapContextMenu.appendChild(item);

    document.getElementById("map").appendChild(mapContextMenu);
});

map.on("movestart zoomstart", closeMapContextMenu);
document.addEventListener("click", event => {
    if (mapContextMenu && !mapContextMenu.contains(event.target)) {
        closeMapContextMenu();
    }
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeMapContextMenu();
    }
});

fetch("data/takeoffs.json")
    .then(response => response.json())
    .then(takeoffs => {
        allTakeoffs = takeoffs;
        for (const takeoff of takeoffs) {
            L.marker([takeoff.latitude, takeoff.longitude])
                .addTo(map)
                .on("click", () => selectTakeoff(takeoff));
        }
        refreshList();
    });
