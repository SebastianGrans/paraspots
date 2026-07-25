import { escapeHtml, descriptionToHtml } from "./utils.js";
import { drawWindRose } from "./wind-rose.js";

function buildTakeoffLinks(takeoff) {
    return [
        { label: "Flightlog", url: `https://flightlog.org/fl.html?l=1&a=22&country_id=${takeoff.country_id}&start_id=${takeoff.start_id}` },
        { label: "Holfuy", url: takeoff.holfuy_id ? `http://holfuy.com/en/weather/${takeoff.holfuy_id}` : null },
        { label: "Windy", url: `https://www.windy.com/${takeoff.latitude}/${takeoff.longitude}` },
        { label: "Google Maps", url: `https://www.google.com/maps/search/?api=1&query=${takeoff.latitude},${takeoff.longitude}` },
    ].filter(link => !!link.url);
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
        wrap.style.top = `${buttonRect.bottom + 4}px`;
    }

    toggleBtn.addEventListener("click", () => {
        const isVisible = wrap.classList.toggle("visible");
        toggleBtn.classList.toggle("open", isVisible);
        toggleBtn.textContent = isVisible ? "▼" : "◀";
        if (isVisible) {
            positionWrap();
            if (!loaded) {
                loaded = true;
                img.src = meteogramUrl;
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

    panel.innerHTML = `
        <div class="detail-header">
            <h2>${escapeHtml(takeoff.name)}</h2>
            <canvas class="wind-rose"></canvas>
        </div>
        <div class="link-row">
            ${linksHtml}
            <div class="yr-widget">
                <a class="link-chip yr-btn" href="${escapeHtml(yr.pageUrl)}" target="_blank" rel="noopener noreferrer">Yr.no</a>
                <button class="yr-toggle" type="button" aria-label="Show 2-day forecast">◀</button>
                <div class="meteogram-wrap">
                    <img alt="Yr 2-day meteogram" />
                    <div class="meteogram-error">Couldn't load the forecast.</div>
                </div>
            </div>
        </div>
        <p>${descriptionToHtml(takeoff.description)}</p>
    `;

    drawWindRose(panel.querySelector(".wind-rose"), takeoff.wind_dirs);
    setupYrWidget(panel.querySelector(".yr-widget"), yr.meteogramUrl);
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

document.addEventListener("click", event => {
    const openWrap = document.querySelector(".meteogram-wrap.visible");
    if (openWrap && !openWrap.closest(".yr-widget").contains(event.target)) {
        closeYrWidget();
    }
});
