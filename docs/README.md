# ParaSpots web (html_js_port)

Static HTML/CSS/JS port of the ParaSpots desktop app, using
[Leaflet](https://leafletjs.com/) for the map. Independent of the
Python/PySide6 desktop app — nothing here touches `src/paraspots/`.

This is stage 1: just a map with a marker (and default popup showing the
name) for every takeoff. No search, sort, wind rose, distance-to-location,
GPS, or styling to match the desktop app yet — those come in later stages.

## Regenerating the data

`data/takeoffs.json` is a generated snapshot, committed to the repo. To
regenerate it from the source takeoff files
(`src/paraspots/takeoffs/*.json`):

```sh
python3 scripts/export_takeoffs.py
```

Any Python 3 interpreter works — this script is stdlib-only and doesn't
import the `paraspots` package or need its venv.

## Previewing locally

From this directory:

```sh
python3 -m http.server
```

Then open `http://localhost:8000`.
