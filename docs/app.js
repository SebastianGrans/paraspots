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
    sortMode = "distance";
    document.getElementById("sort").value = "distance";
    refreshList();
}

function formatDistance(meters) {
    if (meters < 1000) {
        return Math.round(meters) + " m";
    }
    return (meters / 1000).toFixed(1) + " km";
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

const WIND_DIRECTION_ANGLES = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };

function drawWindRose(canvas, windDirs, size = 64) {
    const padding = 5;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - padding;
    const sliceHalfWidth = Math.PI / 4 / 2;

    // Highlighted 45-degree slices, all added to a single path and filled
    // once so adjacent wedges merge instead of leaving an antialiasing seam.
    ctx.beginPath();
    for (const dir of windDirs || []) {
        const angleDeg = WIND_DIRECTION_ANGLES[dir];
        if (angleDeg === undefined)
            continue;

        // Compass angles have 0deg pointing up (north); canvas angles have
        // 0rad pointing right, so shift by -90deg to align them.
        const centerRad = ((angleDeg - 90) * Math.PI) / 180;

        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, centerRad - sliceHalfWidth, centerRad + sliceHalfWidth);
        ctx.closePath();
    }
    ctx.fillStyle = "#ea580c";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.stroke();

    // No data: show a question mark instead of an empty circle
    if (!windDirs || windDirs.length === 0) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = `bold ${Math.round(radius)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", cx, cy);
    }
}

const takeoffMarkers = new Map(); // takeoff -> L.marker

const takeoffIcon = L.divIcon({
    html: '<div class="takeoff-marker"></div>',
    className: "takeoff-marker-icon",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

function createMarkerTooltipContent(takeoff) {
    const container = document.createElement("div");
    container.className = "marker-tooltip";

    const canvas = document.createElement("canvas");
    container.appendChild(canvas);
    drawWindRose(canvas, takeoff.wind_dirs, 32);

    const label = document.createElement("span");
    label.textContent = takeoff.name;
    container.appendChild(label);

    return container;
}

function updateMarkerSelection() {
    for (const [takeoff, marker] of takeoffMarkers) {
        const isSelected = takeoff === selectedTakeoff;
        const el = marker.getElement();
        if (el) {
            el.classList.toggle("selected", isSelected);
        }
        marker.setZIndexOffset(isSelected ? 1000 : 0);
    }
}

// List rows aren't themselves on the map, so hovering one has to reach into
// the map to grow/tooltip the matching marker. The reverse (hovering a
// marker directly) needs no JS at all — CSS :hover handles the grow, and
// Leaflet's own tooltip binding handles showing it.
function setMarkerHovered(takeoff, isHovered) {
    const marker = takeoffMarkers.get(takeoff);
    if (!marker)
        return;
    const el = marker.getElement();
    if (el) {
        el.classList.toggle("hovered", isHovered);
    }
    marker.setZIndexOffset(isHovered || takeoff === selectedTakeoff ? 1000 : 0);
    if (isHovered) {
        marker.openTooltip();
    } else {
        marker.closeTooltip();
    }
}

function buildTakeoffLinks(takeoff) {
    return [
        { label: "Flightlog", url: `https://flightlog.org/fl.html?l=1&a=22&country_id=${takeoff.country_id}&start_id=${takeoff.start_id}` },
        { label: "Holfuy", url: takeoff.holfuy_id ? `http://holfuy.com/en/weather/${takeoff.holfuy_id}` : null },
        { label: "Windy", url: `https://www.windy.com/${takeoff.latitude}/${takeoff.longitude}` },
        { label: "Google Maps", url: `https://www.google.com/maps/search/?api=1&query=${takeoff.latitude},${takeoff.longitude}` },
        { label: "Yr.no", url: `https://www.yr.no/nb/v%C3%A6rvarsel/daglig-tabell/${takeoff.latitude},${takeoff.longitude}` },
    ].filter(link => !!link.url);
}

function showTakeoffDetails(takeoff) {
    const panel = document.getElementById("takeoff-panel");
    panel.classList.remove("placeholder");
    panel.classList.add("detail");

    const linksHtml = buildTakeoffLinks(takeoff)
        .map(link => `<a class="link-chip" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`)
        .join("");

    panel.innerHTML = `
        <div class="detail-header">
            <h2>${escapeHtml(takeoff.name)}</h2>
            <canvas class="wind-rose"></canvas>
        </div>
        <div class="link-row">${linksHtml}</div>
        <p>${escapeHtml(takeoff.description).replace(/\n/g, "<br>")}</p>
    `;

    drawWindRose(panel.querySelector(".wind-rose"), takeoff.wind_dirs);
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
    updateMarkerSelection();
}

function zoomToTakeoff(takeoff) {
    map.setView([takeoff.latitude, takeoff.longitude], 10, { animate: true });
}

function renderList(takeoffs) {
    const list = document.getElementById("list");
    list.innerHTML = "";
    listItems.clear();
    const reference = referenceLocation ? L.latLng(referenceLocation.lat, referenceLocation.lng) : null;
    for (const takeoff of takeoffs) {
        const item = document.createElement("li");

        const nameSpan = document.createElement("span");
        nameSpan.className = "name";
        nameSpan.textContent = takeoff.name;
        item.appendChild(nameSpan);

        if (reference) {
            const distanceSpan = document.createElement("span");
            distanceSpan.className = "distance";
            distanceSpan.textContent = formatDistance(reference.distanceTo(L.latLng(takeoff.latitude, takeoff.longitude)));
            item.appendChild(distanceSpan);
        }

        item.addEventListener("click", () => selectTakeoff(takeoff));
        item.addEventListener("dblclick", () => zoomToTakeoff(takeoff));
        item.addEventListener("mouseenter", () => setMarkerHovered(takeoff, true));
        item.addEventListener("mouseleave", () => setMarkerHovered(takeoff, false));
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
            const marker = L.marker([takeoff.latitude, takeoff.longitude], { icon: takeoffIcon })
                .addTo(map)
                .on("click", () => selectTakeoff(takeoff))
                .on("dblclick", event => {
                    L.DomEvent.stopPropagation(event);
                    zoomToTakeoff(takeoff);
                });
            marker.bindTooltip(createMarkerTooltipContent(takeoff), { direction: "top", offset: [0, -8] });
            takeoffMarkers.set(takeoff, marker);
        }
        refreshList();
    });
