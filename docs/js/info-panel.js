const infoPanel = document.getElementById("info-panel");
const infoBtn = document.getElementById("info-btn");

export function toggleInfoPanel() {
    infoPanel.classList.toggle("hidden");
}

export function closeInfoPanel() {
    infoPanel.classList.add("hidden");
}

infoBtn.addEventListener("click", toggleInfoPanel);

document.addEventListener("click", event => {
    if (!infoPanel.classList.contains("hidden") && !infoPanel.contains(event.target) && event.target !== infoBtn) {
        closeInfoPanel();
    }
});
