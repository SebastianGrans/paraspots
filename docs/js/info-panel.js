// A panel showing some basic instuctions, settings, and link to github
const infoPanel = document.getElementById("info-panel");
// (?) button at the bottom right of the map
const infoBtn = document.getElementById("info-btn");

export function toggleInfoPanel() {
    infoPanel.classList.toggle("hidden");
}

export function closeInfoPanel() {
    infoPanel.classList.add("hidden");
}

infoBtn.addEventListener("click", toggleInfoPanel);

// Click outside to hide infoPanel
document.addEventListener("click", event => {
    if (!infoPanel.classList.contains("hidden") && !infoPanel.contains(event.target) && event.target !== infoBtn) {
        closeInfoPanel();
    }
});
