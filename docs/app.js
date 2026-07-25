const map = L.map("map").setView([61.0, 8.0], 5);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

fetch("data/takeoffs.json")
    .then(response => response.json())
    .then(takeoffs => {
        for (const takeoff of takeoffs) {
            L.marker([takeoff.latitude, takeoff.longitude])
                .addTo(map)
                .bindPopup(takeoff.name);
        }
    });
