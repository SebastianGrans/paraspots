const STORAGE_KEY = "paraspots:theme";

export function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || "system";
}

export function isDarkActive() {
    const mode = document.documentElement.dataset.theme;
    if (mode === "dark")
        return true;
    if (mode === "light")
        return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function setTheme(mode) {
    localStorage.setItem(STORAGE_KEY, mode);
    applyTheme(mode);
    updateThemeButtons(mode);
}

function applyTheme(mode) {
    if (mode === "system") {
        delete document.documentElement.dataset.theme;
    } else {
        document.documentElement.dataset.theme = mode;
    }
}

function updateThemeButtons(mode) {
    for (const btn of document.querySelectorAll(".theme-option")) {
        btn.classList.toggle("active", btn.dataset.mode === mode);
    }
}

for (const btn of document.querySelectorAll(".theme-option")) {
    btn.addEventListener("click", () => setTheme(btn.dataset.mode));
}

updateThemeButtons(getTheme());
