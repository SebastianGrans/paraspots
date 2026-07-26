import { state } from "./state.js";
import { drawWindRose } from "./wind-rose.js";
import { CLICK_DEBOUNCE_MS } from "./utils.js";

export const takeoffIcon = L.divIcon({
    html: '<div class="takeoff-marker"></div>',
    className: "takeoff-marker-icon",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

export function createMarkerTooltipContent(takeoff) {
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

export function updateMarkerSelection() {
    for (const [takeoff, marker] of state.takeoffMarkers) {
        const isSelected = takeoff === state.selectedTakeoff;
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
export function setMarkerHovered(takeoff, isHovered) {
    const marker = state.takeoffMarkers.get(takeoff);
    if (!marker)
        return;
    const el = marker.getElement();
    if (el) {
        el.classList.toggle("hovered", isHovered);
    }
    marker.setZIndexOffset(isHovered || takeoff === state.selectedTakeoff ? 1000 : 0);
    if (isHovered) {
        marker.openTooltip();
    } else {
        marker.closeTooltip();
    }
}

export function createTakeoffMarker(map, takeoff, { onSelect, onZoom }) {
    let clickTimer = null;
    const marker = L.marker([takeoff.latitude, takeoff.longitude], { icon: takeoffIcon })
        .addTo(map)
        .on("click", () => {
            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => onSelect(takeoff), CLICK_DEBOUNCE_MS);
        })
        .on("dblclick", event => {
            L.DomEvent.stopPropagation(event);
            clearTimeout(clickTimer);
            onZoom(takeoff);
            onSelect(takeoff);
        });
    marker.bindTooltip(createMarkerTooltipContent(takeoff), { direction: "top", offset: [0, -8] });
    state.takeoffMarkers.set(takeoff, marker);
    return marker;
}
