import { state } from "./state.js";

export const map = L.map("map", { attributionControl: false }).setView([61.0, 8.0], 5);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

L.control.attribution({ position: "bottomleft" })
    .addAttribution("&copy; OpenStreetMap contributors")
    .addTo(map);

let referenceMarker = null;

const referenceIcon = L.divIcon({
    html: "📍",
    className: "reference-marker-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

// Called after a reference location is set (locate-me or map right-click),
// registered once from app.js. Kept as a callback rather than an import of
// list.js to avoid a circular module dependency.
let onLocationSetCallback = null;

export function onLocationSet(callback) {
    onLocationSetCallback = callback;
}

export function setReferenceLocation(lat, lng) {
    state.referenceLocation = { lat, lng };
    map.setView([lat, lng], 10, { animate: true });
    if (referenceMarker) {
        referenceMarker.setLatLng([lat, lng]);
    } else {
        referenceMarker = L.marker([lat, lng], { icon: referenceIcon, zIndexOffset: 1000 }).addTo(map);
    }
    if (onLocationSetCallback) {
        onLocationSetCallback();
    }
}

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

export function closeMapContextMenu() {
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

    const mapContainer = document.getElementById("map");
    mapContainer.appendChild(mapContextMenu);

    // Keep the menu fully on-screen — near an edge, anchoring at the exact
    // tap point would otherwise push part of it off the visible map.
    const containerRect = mapContainer.getBoundingClientRect();
    const menuRect = mapContextMenu.getBoundingClientRect();
    const maxLeft = containerRect.width - menuRect.width;
    const maxTop = containerRect.height - menuRect.height;
    mapContextMenu.style.left = `${Math.max(0, Math.min(point.x, maxLeft))}px`;
    mapContextMenu.style.top = `${Math.max(0, Math.min(point.y, maxTop))}px`;
});

map.on("movestart zoomstart", closeMapContextMenu);
document.addEventListener("click", event => {
    if (mapContextMenu && !mapContextMenu.contains(event.target)) {
        closeMapContextMenu();
    }
});
