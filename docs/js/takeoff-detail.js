import { escapeHtml, descriptionToHtml } from "./utils.js";
import { drawWindRose } from "./wind-rose.js";
import { goBackFromDetail } from "./mobile-view.js";
import { isDarkActive } from "./theme.js";
import { isFavorite, toggleFavorite } from "./favorites.js";

function buildTakeoffLinks(takeoff) {
    return [
        { label: "Flightlog", url: `https://flightlog.org/fl.html?l=1&a=22&country_id=${takeoff.country_id}&start_id=${takeoff.start_id}` },
        { label: "Holfuy", url: takeoff.holfuy_id ? `http://holfuy.com/en/weather/${takeoff.holfuy_id}` : null },
        { label: "Windy", url: `https://www.windy.com/${takeoff.latitude}/${takeoff.longitude}` },
    ].filter(link => !!link.url);
}

export const MapsProvider = Object.freeze({
    GOOGLE: "google",
    APPLE: "apple",
});
const MAPS_PROVIDER_STORAGE = "paraspots:maps_provider";

function getMapsProvider() {
    return localStorage.getItem(MAPS_PROVIDER_STORAGE) || MapsProvider.GOOGLE;
}

function buildMapsUrl(takeoff, provider) {
    if (provider === MapsProvider.APPLE) {
        return `https://maps.apple.com/place?coordinate=${takeoff.latitude}%2C${takeoff.longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${takeoff.latitude},${takeoff.longitude}`;
}

// Same reasoning as the Yr widget below: the takeoff panel is a narrow,
// vertically-scrolling sidebar, so a CSS-relative dropdown would get
// clipped by the panel's own overflow instead of floating over it.
function setupMapsWidget(widget, takeoff) {
    const link = widget.querySelector(".maps-btn");
    const toggleBtn = widget.querySelector(".maps-toggle");
    const menu = widget.querySelector(".maps-menu");

    function updateActiveOption() {
        const provider = getMapsProvider();
        widget.querySelectorAll(".maps-option").forEach(option => {
            option.classList.toggle("active", option.dataset.provider === provider);
        });
    }
    updateActiveOption();

    function positionMenu() {
        const buttonRect = toggleBtn.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const maxLeft = window.innerWidth - menuRect.width - 8;
        menu.style.left = `${Math.max(8, Math.min(buttonRect.left, maxLeft))}px`;
        const maxTop = window.innerHeight - menuRect.height - 8;
        menu.style.top = `${Math.max(8, Math.min(buttonRect.bottom + 4, maxTop))}px`;
    }

    toggleBtn.addEventListener("click", () => {
        const isVisible = menu.classList.toggle("visible");
        toggleBtn.textContent = isVisible ? "▾" : "◂";
        if (isVisible)
            positionMenu();
    });

    widget.querySelectorAll(".maps-option").forEach(option => {
        option.addEventListener("click", () => {
            const provider = option.dataset.provider;
            localStorage.setItem(MAPS_PROVIDER_STORAGE, provider);
            link.href = buildMapsUrl(takeoff, provider);
            updateActiveOption();
            menu.classList.remove("visible");
        });
    });
}

export function closeMapsMenu() {
    const openMenu = document.querySelector(".maps-menu.visible");
    if (openMenu)
        openMenu.classList.remove("visible");
}

document.addEventListener("click", event => {
    const openMenu = document.querySelector(".maps-menu.visible");
    if (openMenu && !openMenu.closest(".maps-widget").contains(event.target)) {
        closeMapsMenu();
    }
});

async function copyShareUrl() {
    const url = window.location.href;
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(url);
            return;
        } catch {
            // Permission denied or otherwise unavailable - fall through to
            // the execCommand fallback below.
        }
    }
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
}

function buildYrUrls(takeoff) {
    return {
        pageUrl: `https://www.yr.no/nb/v%C3%A6rvarsel/daglig-tabell/${takeoff.latitude},${takeoff.longitude}`,
        meteogramUrl: `https://www.yr.no/nb/innhold/${takeoff.latitude},%20${takeoff.longitude}/meteogram.svg`,
    };
}

// The meteogram popup is fixed-positioned and placed via JS (anchored to the
// toggle button's actual screen position) rather than CSS-anchored relative
// to the button — the takeoff panel is a narrow, vertically-scrolling
// sidebar, so a CSS-relative popup would get clipped by the panel's own
// overflow instead of floating over it. It's wide enough to cover both the
// sidebar and the map, so it's anchored by its right edge (near the
// button) rather than its left, extending leftward over the map instead of
// off the right side of the browser window.
function setupYrWidget(widget, meteogramUrl) {
    const toggleBtn = widget.querySelector(".yr-toggle");
    const wrap = widget.querySelector(".meteogram-wrap");
    const img = wrap.querySelector("img");
    let loaded = false;

    img.addEventListener("error", () => wrap.classList.add("error"));
    img.addEventListener("load", () => {
        if (wrap.classList.contains("visible"))
            positionWrap();
    });

    function positionWrap() {
        const buttonRect = toggleBtn.getBoundingClientRect();

        // On a narrow (mobile-width) viewport the widget takes up nearly
        // the full width anyway, so anchoring it to the button's edge just
        // leaves an awkward gap on one side — center it instead.
        if (window.innerWidth < 800) {
            wrap.style.right = "";
            wrap.style.left = "50%";
            wrap.style.transform = "translateX(-50%)";
        } else {
            wrap.style.left = "";
            wrap.style.transform = "";
            const right = Math.max(8, window.innerWidth - buttonRect.right);
            wrap.style.right = `${right}px`;
        }

        // Clamp vertically so the popup can't open (or end up, once the
        // meteogram image loads and changes its height) below the visible
        // viewport, mirroring the same clamping map.js already does for the
        // map's right-click context menu.
        const wrapHeight = wrap.getBoundingClientRect().height;
        const maxTop = window.innerHeight - wrapHeight - 8;
        wrap.style.top = `${Math.max(8, Math.min(buttonRect.bottom + 4, maxTop))}px`;
    }

    toggleBtn.addEventListener("click", () => {
        const isVisible = wrap.classList.toggle("visible");
        toggleBtn.classList.toggle("open", isVisible);
        toggleBtn.textContent = isVisible ? "▾" : "◂";
        if (isVisible) {
            positionWrap();
            if (!loaded) {
                loaded = true;
                img.src = isDarkActive() ? `${meteogramUrl}?mode=dark` : meteogramUrl;
            }
        }
    });
}

export function showTakeoffDetails(takeoff) {
    const panel = document.getElementById("takeoff-panel");
    panel.classList.remove("placeholder");
    panel.classList.add("detail");

    const linksHtml = buildTakeoffLinks(takeoff)
        .map(link => `<a class="link-chip" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`)
        .join("");

    const yr = buildYrUrls(takeoff);
    const mapsUrl = buildMapsUrl(takeoff, getMapsProvider());

    panel.innerHTML = `
        <div class="detail-header">
            <div class="detail-title">
                <button class="detail-back" type="button" aria-label="Back">‹</button>
                <h3>${escapeHtml(takeoff.name)}</h3 >
                <button class="detail-favorite-btn${isFavorite(takeoff) ? " active" : ""}" type="button" aria-label="Toggle favorite">${isFavorite(takeoff) ? "★" : "☆"}</button>
            </div>
            <canvas class="wind-rose"></canvas>
        </div>
        <div class="link-row">
            ${linksHtml}
            <div class="maps-widget">
                <a class="link-chip maps-btn" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer">Maps</a>
                <button class="maps-toggle" type="button" aria-label="Choose maps provider">◂</button>
                <div class="maps-menu">
                    <div class="maps-option" data-provider="google">Google Maps</div>
                    <div class="maps-option" data-provider="apple">Apple Maps</div>
                </div>
            </div>
            <div class="yr-widget">
                <a class="link-chip yr-btn" href="${escapeHtml(yr.pageUrl)}" target="_blank" rel="noopener noreferrer">Yr.no</a>
                <button class="yr-toggle" type="button" aria-label="Show 2-day forecast">◂</button>
                <div class="meteogram-wrap">
                    <img alt="Yr 2-day meteogram" />
                    <div class="meteogram-error">Couldn't load the forecast.</div>
                </div>
            </div>
            <button class="link-chip share-btn" type="button" aria-label="Share"><span class="share-icon"></span></button>
        </div>
        <p>${descriptionToHtml(takeoff.description)}</p>
    `;

    drawWindRose(panel.querySelector(".wind-rose"), takeoff.wind_dirs);
    setupMapsWidget(panel.querySelector(".maps-widget"), takeoff);
    setupYrWidget(panel.querySelector(".yr-widget"), yr.meteogramUrl);
    panel.querySelector(".detail-back").addEventListener("click", goBackFromDetail);
    panel.querySelector(".detail-favorite-btn").addEventListener("click", () => toggleFavorite(takeoff));
    panel.querySelector(".share-btn").addEventListener("click", async event => {
        const btn = event.currentTarget;
        await copyShareUrl();
        const original = btn.innerHTML;
        btn.textContent = "Copied!";
        setTimeout(() => { btn.innerHTML = original; }, 1500);
    });
}

// A lightweight, targeted update for when the currently-open takeoff's
// favorite status changes - avoids a full showTakeoffDetails() re-render,
// which would needlessly reset the Yr widget's loaded state/scroll
// position just to flip one icon.
export function updateDetailFavoriteIcon(takeoff) {
    const btn = document.querySelector(".detail-favorite-btn");
    if (btn) {
        btn.textContent = isFavorite(takeoff) ? "★" : "☆";
        btn.classList.toggle("active", isFavorite(takeoff));
    }
}

// Reverts the panel back to its empty-state placeholder (e.g. for the
// home/reset button) - replacing the innerHTML also discards any open
// Yr/maps popups along with it, so nothing needs closing separately first.
export function clearTakeoffDetails() {
    const panel = document.getElementById("takeoff-panel");
    panel.classList.remove("detail");
    panel.classList.add("placeholder");
    panel.innerHTML = `
        <p class="placeholder-emoji">🪂</p>
        <p>Select a takeoff on the map<br />to see its details</p>
    `;
}

export function closeYrWidget() {
    const openWrap = document.querySelector(".meteogram-wrap.visible");
    if (!openWrap)
        return;
    openWrap.classList.remove("visible");
    const widget = openWrap.closest(".yr-widget");
    const toggleBtn = widget.querySelector(".yr-toggle");
    toggleBtn.classList.remove("open");
    toggleBtn.textContent = "◀";
}

// Close the Yr widget by clicking anywhere outside of the widget.
document.addEventListener("click", event => {
    const openWrap = document.querySelector(".meteogram-wrap.visible");
    if (openWrap && !openWrap.closest(".yr-widget").contains(event.target)) {
        closeYrWidget();
    }
});
