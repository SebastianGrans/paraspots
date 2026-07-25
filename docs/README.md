# ParaSpots web port

Static HTML/CSS/JS port of the ParaSpots desktop app, using [Leaflet](https://leafletjs.com/) for
the map. Independent of the Python/PySide6 desktop app.

## Regenerating the data

`data/takeoffs.json` is a generated snapshot, committed to the repo. To regenerate it from the
source takeoff files (`py/src/paraspots/takeoffs/*.json`):

```sh
python3 scripts/export_takeoffs.py
```

## Previewing locally

From this directory:

```sh
python3 -m http.server
```

Then open `http://localhost:8000`.

**or**  

```bash
make web
```

There is also

```bash
make mobileweb
```

To view the website in a mobile sized browser. Useful for testing responsive design.
