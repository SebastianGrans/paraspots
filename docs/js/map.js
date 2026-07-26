import { state } from "./state.js";

const PROD_MAPTILER_KEY = "P6PT7U3h7q2WPvTYodlq";
const DEV_KEY_STORAGE = "paraspots:maptiler_key";

// A dev key passed via ?maptiler_key= (see `make web`/`make mobileweb`) is
// stashed in localStorage and immediately scrubbed from the URL, so it
// doesn't linger in the address bar or get copied by the Share button.
export function getMaptilerKey() {
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get("maptiler_key");
    if (urlKey) {
        localStorage.setItem(DEV_KEY_STORAGE, urlKey);
        params.delete("maptiler_key");
        const url = new URL(window.location.href);
        url.search = params.toString();
        history.replaceState(null, "", url);
        return urlKey;
    }
    return localStorage.getItem(DEV_KEY_STORAGE) || PROD_MAPTILER_KEY;
}

const DEFAULT_CENTER = [61.0, 8.0];
const DEFAULT_ZOOM = 5;

export const map = L.map("map", { attributionControl: false }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

export function resetMapView() {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
}

const mapControls = document.getElementById("map-controls");
const controlsToggle = document.getElementById("controls-toggle");

function setControlsExpanded(expanded) {
    mapControls.classList.toggle("expanded", expanded);
    controlsToggle.setAttribute("aria-expanded", String(expanded));
}

controlsToggle.addEventListener("click", () => {
    setControlsExpanded(!mapControls.classList.contains("expanded"));
});

// Desktop has room to spare, so start with all the controls showing;
// mobile starts collapsed under the toggle since space is tight there.
setControlsExpanded(window.innerWidth >= 800);

const MAPTILER_ATTRIBUTION =
    '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
    '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';
const OSM_ATTRIBUTION =
    '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

export const MapType = Object.freeze({
    SATELLITE: "satellite",
    OUTDOOR: "outdoor",
    STANDARD: "standard",
});

const MAP_TYPES = [
    { id: MapType.OUTDOOR, icon: "⛰️", tileUrl: key => `https://api.maptiler.com/maps/outdoor-v4/{z}/{x}/{y}.png?key=${key}`, attribution: MAPTILER_ATTRIBUTION },
    { id: MapType.SATELLITE, icon: "🛰️", tileUrl: key => `https://api.maptiler.com/maps/hybrid-v4/{z}/{x}/{y}.jpg?key=${key}`, attribution: MAPTILER_ATTRIBUTION },
    { id: MapType.STANDARD, icon: "🗺️", tileUrl: () => "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: OSM_ATTRIBUTION },
];
const MAP_TYPE_STORAGE = "paraspots:map_type";

const attributionControl = L.control.attribution({ position: "bottomleft" }).addTo(map);
const maptypeBtn = document.getElementById("maptype-btn");
let currentTileLayer = null;
let currentAttribution = null;

function setMapType(id) {
    const mapType = MAP_TYPES.find(t => t.id === id) || MAP_TYPES[0];
    if (currentTileLayer)
        map.removeLayer(currentTileLayer);
    currentTileLayer = L.tileLayer(mapType.tileUrl(getMaptilerKey())).addTo(map);
    if (currentAttribution)
        attributionControl.removeAttribution(currentAttribution);
    attributionControl.addAttribution(mapType.attribution);
    currentAttribution = mapType.attribution;
    maptypeBtn.textContent = mapType.icon;
    localStorage.setItem(MAP_TYPE_STORAGE, mapType.id);
}

maptypeBtn.addEventListener("click", () => {
    const currentId = localStorage.getItem(MAP_TYPE_STORAGE) || MAP_TYPES[0].id;
    const currentIndex = MAP_TYPES.findIndex(t => t.id === currentId);
    setMapType(MAP_TYPES[(currentIndex + 1) % MAP_TYPES.length].id);
});

setMapType(localStorage.getItem(MAP_TYPE_STORAGE) || MAP_TYPES[0].id);

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
