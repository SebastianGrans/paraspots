import { map } from "./map.js";

// Pinned to a specific commit of relet/pg-xc (same source/URL luftrom.info's
// own viewer uses) so this data is stable and cacheable, but it also means it
// won't pick up upstream updates automatically - bumping this hash by hand
// periodically is expected maintenance.
const AIRSPACE_URL =
    "https://rawcdn.githack.com/relet/pg-xc/10f28d07b22d625804e1ca1fb35aee93c0f6d244/geojson/luftrom.geojson?min=1";
const VISIBLE_STORAGE = "paraspots:airspace_visible";

const airspaceBtn = document.getElementById("airspace-btn");
let airspaceLayer = null;
let loadPromise = null;

function popupContent(feature) {
    const p = feature.properties;
    let warning = "";
    if (p["notam_only"] === "true") {
        warning = '<span style="color:red">ONLY ACTIVE IF NOTAM IS SENT.</span><br>';
        if (p["to (m amsl)"] === 99999) {
            warning += "Please check NOTAM for updated altitude limits.<br>";
        }
    }
    return `<b>${p.name}</b><br>` +
        warning +
        `Class: ${p.class}<br>` +
        `Floor: ${p["from (m amsl)"]}m AMSL<br>` +
        `Ceiling: ${p["to (m amsl)"]}m AMSL<br>` +
        `<a href="${p.source_href}" target="_blank" rel="noopener noreferrer">Source</a>`;
}

function airspaceStyle(feature) {
    const p = feature.properties;
    return { color: p.color, fillColor: p.fillColor, fillOpacity: p.fillOpacity, weight: 1, opacity: 0.8 };
}

function loadAirspaceData() {
    if (!loadPromise) {
        loadPromise = fetch(AIRSPACE_URL).then(response => response.json());
    }
    return loadPromise;
}

async function showAirspace() {
    const airspaceData = await loadAirspaceData();
    airspaceLayer = L.geoJSON(airspaceData, {
        style: airspaceStyle,
        onEachFeature: (feature, layer) => layer.bindPopup(popupContent(feature)),
    }).addTo(map);
}

function hideAirspace() {
    if (airspaceLayer) {
        map.removeLayer(airspaceLayer);
        airspaceLayer = null;
    }
}

async function setAirspaceVisible(visible) {
    airspaceBtn.classList.toggle("active", visible);
    airspaceBtn.setAttribute("aria-pressed", String(visible));
    localStorage.setItem(VISIBLE_STORAGE, String(visible));
    if (visible) {
        await showAirspace();
    } else {
        hideAirspace();
    }
}

airspaceBtn.addEventListener("click", () => {
    setAirspaceVisible(!airspaceLayer);
});

if (localStorage.getItem(VISIBLE_STORAGE) === "true") {
    setAirspaceVisible(true);
}
