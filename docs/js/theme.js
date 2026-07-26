const STORAGE_KEY = "paraspots:theme";

export const ThemeMode = Object.freeze({
    LIGHT: "light",
    DARK: "dark",
    SYSTEM: "system",
});

export function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || ThemeMode.SYSTEM;
}

export function isDarkActive() {
    const mode = document.documentElement.dataset.theme;
    if (mode === ThemeMode.DARK)
        return true;
    if (mode === ThemeMode.LIGHT)
        return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function setTheme(mode) {
    localStorage.setItem(STORAGE_KEY, mode);
    applyTheme(mode);
    updateThemeButtons(mode);
}

function applyTheme(mode) {
    if (mode === ThemeMode.SYSTEM) {
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
