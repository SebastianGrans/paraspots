export const COUNTRIES = [
    { id: 160, name: "Norway", flag: "🇳🇴" },
    { id: 203, name: "Sweden", flag: "🇸🇪" },
    { id: 73, name: "France", flag: "🇫🇷" },
    { id: 195, name: "Spain", flag: "🇪🇸" },
    { id: 57, name: "Denmark", flag: "🇩🇰" },
    { id: 81, name: "Germany", flag: "🇩🇪" },
    { id: 105, name: "Italy", flag: "🇮🇹" },
    { id: 171, name: "Portugal", flag: "🇵🇹" },
];

const SELECTED_STORAGE = "paraspots:selected_countries";
const ALL_IDS = COUNTRIES.map(c => c.id);

function loadSelected() {
    try {
        const stored = JSON.parse(localStorage.getItem(SELECTED_STORAGE));
        return Array.isArray(stored) ? new Set(stored) : new Set(ALL_IDS);
    } catch {
        return new Set(ALL_IDS);
    }
}

const selected = loadSelected();

export function isCountrySelected(id) {
    return selected.has(id);
}

export function getSelectedCountries() {
    return new Set(selected);
}

let onChangeCallback = () => { };

export function onCountriesChange(callback) {
    onChangeCallback = callback;
}

export function setCountrySelected(id, isSelected) {
    if (isSelected === selected.has(id))
        return;
    if (isSelected) selected.add(id); else selected.delete(id);
    localStorage.setItem(SELECTED_STORAGE, JSON.stringify([...selected]));
    onChangeCallback(id, isSelected);
}

// Cached per country so toggling a country off then back on doesn't refetch.
const loadPromises = new Map();

export function loadCountryTakeoffs(id) {
    if (!loadPromises.has(id)) {
        loadPromises.set(id, fetch(`data/takeoffs_cid_${id}.json`).then(response => response.json()));
    }
    return loadPromises.get(id);
}

// --- self-wired dropdown UI, mirrors #sort-btn/#sort-menu in list.js ---

const countriesBtn = document.getElementById("countries-btn");
const countriesMenu = document.getElementById("countries-menu");

function rowLabel(country) {
    return `${isCountrySelected(country.id) ? "☑" : "☐"} ${country.flag} ${country.name}`;
}

function renderCountriesMenu() {
    countriesMenu.innerHTML = "";
    for (const country of COUNTRIES) {
        const row = document.createElement("div");
        row.className = "country-option";
        row.textContent = rowLabel(country);
        row.addEventListener("click", () => {
            setCountrySelected(country.id, !isCountrySelected(country.id));
            row.textContent = rowLabel(country);
        });
        countriesMenu.appendChild(row);
    }
}
renderCountriesMenu();

function openCountriesMenu() {
    countriesMenu.classList.remove("hidden");
    countriesBtn.classList.add("open");
}

export function closeCountriesMenu() {
    countriesMenu.classList.add("hidden");
    countriesBtn.classList.remove("open");
}

countriesBtn.addEventListener("click", () => {
    countriesMenu.classList.contains("hidden") ? openCountriesMenu() : closeCountriesMenu();
});

document.addEventListener("click", event => {
    if (!countriesMenu.contains(event.target) && event.target !== countriesBtn) {
        closeCountriesMenu();
    }
});
