import { map } from "./map.js";

const toggleBtn = document.getElementById("mobile-view-toggle");

// Mobile has 3 states (see docs/css/responsive.css for the layout each one
// produces): "map" (fullscreen, nothing below), "detail" (map on top half,
// takeoff detail on bottom half), "list" (map on top half, search + list on
// bottom half). The map is never fully hidden once something is below it.
let previousView = "map";

function setView(view) {
    const current = document.body.dataset.mobileView;
    if (view === "detail" && current !== "detail") {
        previousView = current;
    }
    document.body.dataset.mobileView = view;
    toggleBtn.textContent = view === "list" ? "Map" : "Search";
    // The map container's rendered size changes between states, so
    // Leaflet's cached size goes stale — recompute it whenever the layout
    // changes (its center/zoom are tracked independently and unaffected).
    map.invalidateSize();
}

export function showMapView() {
    setView("map");
}

export function showDetailView() {
    setView("detail");
}

export function showListView() {
    setView("list");
}

export function goBackFromDetail() {
    setView(previousView);
}

toggleBtn.addEventListener("click", () => {
    if (document.body.dataset.mobileView === "list") {
        showMapView();
    } else {
        showListView();
    }
});

setView("map");
