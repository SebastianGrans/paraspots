const STORAGE_KEY = "paraspots:favorites";

// Takeoff objects are recreated fresh on every page load (fetched from
// data/takeoffs.json), so they can't be used as a persistent key -
// country_id+start_id is the same stable composite identity already used
// for deep-linking in app.js.
function takeoffKey(takeoff) {
    return `${takeoff.country_id}-${takeoff.start_id}`;
}

function loadFavorites() {
    try {
        return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
    } catch {
        return new Set();
    }
}

const favorites = loadFavorites();

export function isFavorite(takeoff) {
    return favorites.has(takeoffKey(takeoff));
}

// Registered once from app.js so this module can fan out to the list,
// markers, and detail panel without importing any of them directly - same
// callback-injection pattern as onLocationSet in map.js.
let onChangeCallback = () => { };

export function onFavoritesChange(callback) {
    onChangeCallback = callback;
}

export function toggleFavorite(takeoff) {
    const key = takeoffKey(takeoff);
    if (favorites.has(key)) {
        favorites.delete(key);
    } else {
        favorites.add(key);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
    onChangeCallback(takeoff);
}
