#!/usr/bin/env python3
"""Export the takeoff JSON files into a single bundle for the web frontend.

Standalone stdlib-only script — deliberately does not import the `paraspots`
package or need the project's venv, so the web port stays decoupled from the
desktop app's dependencies. Run with any Python 3 interpreter.
"""

import json
from pathlib import Path

SOURCE_DIR = Path(__file__).parent.parent.parent / "src" / "paraspots" / "takeoffs"
OUTPUT_FILE = Path(__file__).parent.parent / "data" / "takeoffs.json"


def main() -> None:
    takeoffs = [json.loads(path.read_text()) for path in sorted(SOURCE_DIR.glob("*.json"))]

    OUTPUT_FILE.write_text(json.dumps(takeoffs, indent=2, ensure_ascii=False))
    print(f"Wrote {len(takeoffs)} takeoffs to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
