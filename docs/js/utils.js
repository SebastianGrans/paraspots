// Click actions that have a competing dblclick (select vs. zoom) are delayed
// by this long and cancelled if a dblclick follows — otherwise the single-
// click side effect (e.g. switching mobile views) can move or hide the
// target element before the second tap of a double-tap lands on it.
export const CLICK_DEBOUNCE_MS = 250;

export function formatDistance(meters) {
    if (meters < 1000) {
        return Math.round(meters) + " m";
    }
    return (meters / 1000).toFixed(1) + " km";
}

export function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Matches the desktop app's descriptionHtml linkification exactly (see
// qml_models.py's _URL_RE): escape first, then linkify http(s) URLs in the
// escaped text, trimming trailing punctuation from the match.
const URL_RE = /https?:\/\/[^\s<]+[^\s<.,;:!?)"']/g;

export function descriptionToHtml(description) {
    const escaped = escapeHtml(description);
    const linked = escaped.replace(URL_RE, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    return linked.replace(/\n/g, "<br>\n");
}
