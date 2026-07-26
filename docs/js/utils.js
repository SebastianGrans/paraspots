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

// There are often URLs in the description
// We want to make this clickable, so we try to find them using this regex
// And then we add them back to the description as an anchor element
// Ensuring to escape any HTML first 
const URL_RE = /https?:\/\/[^\s<]+[^\s<.,;:!?)"']/g;

export function descriptionToHtml(description) {
    const escaped = escapeHtml(description);
    const linked = escaped.replace(URL_RE, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    return linked.replace(/\n/g, "<br>\n");
}
