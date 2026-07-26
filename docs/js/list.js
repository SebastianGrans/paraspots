import { state } from "./state.js";
import { formatDistance, CLICK_DEBOUNCE_MS } from "./utils.js";

const listEl = document.getElementById("list");
const searchInput = document.getElementById("search");
const clearSearchBtn = document.getElementById("clear-search");
const sortBtn = document.getElementById("sort-btn");
const sortMenu = document.getElementById("sort-menu");

// Wired once from app.js via initList() to avoid a circular import with the
// cross-cutting selection logic (selectTakeoff/zoomToTakeoff/setMarkerHovered
// live in app.js since they also touch the map and marker layers).
let callbacks = { onSelect: () => { }, onZoom: () => { }, onHover: () => { } };

export function initList(cb) {
    callbacks = cb;
}

export function updateListSelection() {
    for (const [takeoff, item] of state.listItems) {
        item.classList.toggle("selected", takeoff === state.selectedTakeoff);
    }
}

function renderList(takeoffs) {
    listEl.innerHTML = "";
    state.listItems.clear();
    const reference = state.referenceLocation ? L.latLng(state.referenceLocation.lat, state.referenceLocation.lng) : null;
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

        item.tabIndex = -1;
        item.takeoff = takeoff;
        let clickTimer = null;
        item.addEventListener("click", () => {
            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => callbacks.onSelect(takeoff), CLICK_DEBOUNCE_MS);
        });
        item.addEventListener("dblclick", () => {
            clearTimeout(clickTimer);
            callbacks.onZoom(takeoff);
            callbacks.onSelect(takeoff);
        });
        // onHover triggers the "tooltip" of the takeoff to be visible
        item.addEventListener("mouseenter", () => callbacks.onHover(takeoff, true));
        item.addEventListener("mouseleave", () => callbacks.onHover(takeoff, false));
        listEl.appendChild(item);
        state.listItems.set(takeoff, item);
    }
    updateListSelection();
}

export const SortMode = Object.freeze({
    NAME_ASC: "name-asc",
    NAME_DESC: "name-desc",
    DISTANCE_ASC: "distance-asc",
    DISTANCE_DESC: "distance-desc",
});

let currentSearchQuery = "";
let sortMode = SortMode.NAME_ASC;

function sortTakeoffs(takeoffs) {
    const sorted = takeoffs.slice();
    if (sortMode === SortMode.NAME_DESC) {
        sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortMode === SortMode.DISTANCE_ASC && state.referenceLocation) {
        const reference = L.latLng(state.referenceLocation.lat, state.referenceLocation.lng);
        sorted.sort(
            (a, b) =>
                reference.distanceTo(L.latLng(a.latitude, a.longitude)) -
                reference.distanceTo(L.latLng(b.latitude, b.longitude))
        );
    } else if (sortMode === SortMode.DISTANCE_DESC && state.referenceLocation) {
        const reference = L.latLng(state.referenceLocation.lat, state.referenceLocation.lng);
        sorted.sort(
            (a, b) =>
                reference.distanceTo(L.latLng(b.latitude, b.longitude)) -
                reference.distanceTo(L.latLng(a.latitude, a.longitude))
        );
    } else {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
}

function updateSortMenu() {
    const hasLocation = !!state.referenceLocation;
    // Sort by distance requires a location to have been specified, so these are 
    // disabled if that's not the case.
    document.querySelectorAll(".sort-option").forEach(option => {
        const requiresLocation = option.dataset.requiresLocation === "true";
        option.classList.toggle("disabled", requiresLocation && !hasLocation);
        option.classList.toggle("active", option.dataset.mode === sortMode);
    });
}

export function setSortMode(mode) {
    sortMode = mode;
    updateSortMenu();
    refreshList();
}

export function refreshList() {
    const normalized = currentSearchQuery.trim().toLowerCase();
    const filtered = normalized
        ? state.allTakeoffs.filter(takeoff => takeoff.name.toLowerCase().includes(normalized))
        : state.allTakeoffs;
    renderList(sortTakeoffs(filtered));
}

function applySearch(query) {
    currentSearchQuery = query;
    // Show the clear-search button (x) if the search field has text in it.
    clearSearchBtn.classList.toggle("visible", query.length > 0);
    refreshList();
}

let searchDebounceTimer = null;

searchInput.addEventListener("input", event => {
    // Debounce the search field.
    // This will delay the actual search for 200 ms after the last input
    // Without this, the search experience is very laggy, since every input would
    // trigger a "costly" search.
    clearTimeout(searchDebounceTimer);
    const query = event.target.value;
    searchDebounceTimer = setTimeout(() => applySearch(query), 200);
});

function clearSearch() {
    clearTimeout(searchDebounceTimer);
    searchInput.value = "";
    searchInput.focus();
    applySearch("");
}

clearSearchBtn.addEventListener("click", clearSearch);

searchInput.addEventListener("keydown", event => {
    if (event.key === "ArrowDown") {
        // When the user has searched for something, the down button will move the focus
        // down to the list -> select and show the takeoff in the details panel.
        event.preventDefault();
        const firstItem = listEl.querySelector("li");
        if (firstItem) {
            firstItem.focus();
            callbacks.onSelect(firstItem.takeoff);
        }
    } else if (event.key === "Escape") {
        // Clear the search text (mouseless alternative to the clear-serach button)
        clearSearch();
    }
});

listEl.addEventListener("keydown", event => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp")
        return;
    event.preventDefault();
    const items = Array.from(listEl.querySelectorAll("li"));
    const currentIndex = items.indexOf(document.activeElement);

    if (event.key === "ArrowUp" && currentIndex <= 0) {
        searchInput.focus();
        return;
    }

    const step = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(items.length - 1, (currentIndex === -1 ? 0 : currentIndex + step)));
    const nextItem = items[nextIndex];
    if (nextItem) {
        nextItem.focus();
        callbacks.onSelect(nextItem.takeoff);
        nextItem.scrollIntoView({ block: "nearest" });
    }
});

function openSortMenu() {
    sortMenu.classList.remove("hidden");
    sortBtn.classList.add("open");
}

export function closeSortMenu() {
    sortMenu.classList.add("hidden");
    sortBtn.classList.remove("open");
}

sortBtn.addEventListener("click", () => {
    if (sortMenu.classList.contains("hidden")) {
        openSortMenu();
    } else {
        closeSortMenu();
    }
});

// The menu deliberately stays open after picking an option so you can compare list order 
// across a few sort modes without having to reopen the menu each time.
document.querySelectorAll(".sort-option").forEach(option => {
    option.addEventListener("click", () => {
        if (option.classList.contains("disabled"))
            return;
        setSortMode(option.dataset.mode);
    });
});

// Click anywhere outside the sort menu closes it.
document.addEventListener("click", event => {
    if (!sortMenu.contains(event.target) && event.target !== sortBtn) {
        closeSortMenu();
    }
});

updateSortMenu();
