import { state } from "./state.js";
import { map, onLocationSet, closeMapContextMenu, resetMapView } from "./map.js";
import { createTakeoffMarker, updateMarkerSelection, setMarkerHovered, updateMarkerFavorite } from "./markers.js";
import { showTakeoffDetails, closeYrWidget, clearTakeoffDetails, updateDetailFavoriteIcon } from "./takeoff-detail.js";
import { initList, updateListSelection, setSortMode, refreshList, closeSortMenu, SortMode } from "./list.js";
import { toggleInfoPanel, closeInfoPanel } from "./info-panel.js";
import { showDetailView, showListView, showMapView } from "./mobile-view.js";
import { onFavoritesChange } from "./favorites.js";
import "./theme.js";
import "./airspace.js";

function isCoordinateVisible(latlng) {
    return map.getBounds().contains(latlng);
}

// If the newly selected takeoff (e.g. picked from the list) isn't within
// the current viewport, bring it into view. When a reference location is
// also known (e.g. the user pressed "locate me"), keep *both* points
// visible together instead of just recentring on the takeoff alone —
// otherwise selecting a takeoff just outside the zoomed-in "locate me"
// view would push the user's own location off-screen.
function ensureTakeoffVisible(takeoff) {
    if (!takeoff)
        return;

    const takeoffLatLng = L.latLng(takeoff.latitude, takeoff.longitude);

    if (!state.referenceLocation) {
        if (isCoordinateVisible(takeoffLatLng))
            return;
        if (map.getZoom() > 10) {
            map.setView(takeoffLatLng, 10, { animate: true });
        } else {
            map.panTo(takeoffLatLng, { animate: true });
        }
        return;
    }

    const referenceLatLng = L.latLng(state.referenceLocation.lat, state.referenceLocation.lng);
    if (isCoordinateVisible(takeoffLatLng) && isCoordinateVisible(referenceLatLng))
        return;

    // Fit both points, then nudge zoom out one more level for breathing room
    // from the edges — matching the desktop app's approach.
    const bounds = L.latLngBounds([takeoffLatLng, referenceLatLng]);
    const targetZoom = Math.max(map.getMinZoom(), map.getBoundsZoom(bounds) - 1);
    map.setView(bounds.getCenter(), targetZoom, { animate: true });
}

function updateUrlForTakeoff(takeoff) {
    const url = new URL(window.location.href);
    url.searchParams.set("country_id", takeoff.country_id);
    url.searchParams.set("start_id", takeoff.start_id);
    history.replaceState(null, "", url);
}

function findTakeoffFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const countryId = Number(params.get("country_id"));
    const startId = Number(params.get("start_id"));
    if (!countryId || !startId)
        return null;
    return state.allTakeoffs.find(t => t.country_id === countryId && t.start_id === startId) || null;
}

function selectTakeoff(takeoff) {
    updateUrlForTakeoff(takeoff);
    state.selectedTakeoff = takeoff;
    showTakeoffDetails(takeoff);
    updateListSelection();
    updateMarkerSelection();
    ensureTakeoffVisible(takeoff);
    // On mobile, selecting a takeoff (from the map or the list) shows its
    // detail split-screen with the map, instead of leaving it hidden behind
    // whichever full-screen view was showing.
    showDetailView();
}

function zoomToTakeoff(takeoff) {
    map.setView([takeoff.latitude, takeoff.longitude], 10, { animate: true });
}

onLocationSet(() => {
    setSortMode(SortMode.DISTANCE_ASC);
    // On mobile, show the (now distance-sorted) list split-screen with the
    // map, whether the location came from "locate me" or the map's
    // right-click "Set as location" menu.
    showListView();
});

initList({ onSelect: selectTakeoff, onZoom: zoomToTakeoff, onHover: setMarkerHovered });

onFavoritesChange(takeoff => {
    updateMarkerFavorite(takeoff);
    refreshList();
    if (state.selectedTakeoff === takeoff) {
        updateDetailFavoriteIcon(takeoff);
    }
});

document.getElementById("home-btn").addEventListener("click", () => {
    state.selectedTakeoff = null;
    clearTakeoffDetails();
    updateListSelection();
    updateMarkerSelection();
    resetMapView();
    showMapView();
    history.replaceState(null, "", window.location.pathname);
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeMapContextMenu();
        closeInfoPanel();
        closeSortMenu();
        closeYrWidget();
        return;
    }

    // Don't hijack these keys while the user is typing into a field.
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")
        return;

    if (event.key === "/" || (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey))) {
        event.preventDefault();
        document.getElementById("search").focus();
    } else if (event.key === "?") {
        event.preventDefault();
        toggleInfoPanel();
    }
});

fetch("data/takeoffs.json")
    .then(response => response.json())
    .then(takeoffs => {
        state.allTakeoffs = takeoffs;
        for (const takeoff of takeoffs) {
            createTakeoffMarker(map, takeoff, { onSelect: selectTakeoff, onZoom: zoomToTakeoff });
        }
        refreshList();

        const linkedTakeoff = findTakeoffFromUrl();
        if (linkedTakeoff) {
            zoomToTakeoff(linkedTakeoff);
            selectTakeoff(linkedTakeoff);
            state.listItems.get(linkedTakeoff)?.scrollIntoView({ block: "center" });
        }
    });
