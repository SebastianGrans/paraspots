from __future__ import annotations
from enum import IntEnum

import re
from dataclasses import dataclass
import logging
from pathlib import Path
from typing import Self

from serde import serde, field
from serde.json import from_json, to_json

log = logging.getLogger(__name__)


class WindDir(IntEnum):
    NW = 1
    W = 2
    SW = 4
    S = 8
    SE = 16
    E = 32
    NE = 64
    N = 128

    @staticmethod
    def wind_dirs_from_bitmask(bitmask: int) -> list[WindDir]:
        """Return a list of wind directions from a bitmask."""
        return [dir for dir in WindDir if bitmask & dir.value]


def safe_filename(name: str) -> str:
    # Replace any non-alphanumeric characters with underscores
    safe_name = re.sub(r"[^\w\-.]", "_", name).strip()
    # Squash multiple underscores into a single underscore
    safe_name = re.sub(r"_+", "_", safe_name)
    # Strip any leading or trailing underscores
    safe_name = safe_name.strip("_")
    log.debug(f"Safe filename for `{name}` is `{safe_name}`")
    return safe_name


@serde
@dataclass
class Takeoff:
    country_id: int
    start_id: int
    name: str
    latitude: float
    longitude: float
    description: str
    holfuy_id: int | None
    # Rather than storing the enum values, we store the enum names
    # This makes the json file human-readable
    wind_dirs: list[WindDir] = field(
        serializer=lambda lst: [e.name for e in lst],
        deserializer=lambda lst: [WindDir[v] for v in lst],
    )

    holfuy_url: str = field(skip_deserializing=True, init=False)
    flightlog_url: str = field(skip_deserializing=True, init=False)

    def __post_init__(self):
        if self.holfuy_id is not None:
            self.holfuy_url = f"http://holfuy.com/en/weather/{self.holfuy_id}"
        else:
            self.holfuy_url = ""

        self.flightlog_url = f"https://flightlog.org/fl.html?l=1&a=22&country_id={self.country_id}&start_id={self.start_id}"

    def save(self, path: Path) -> Path:
        """Save the takeoff data to a JSON file.

        Args:
            path (Path): The file path to save the JSON data.
                        If the path is a directory, the directory, and any parents will be created.
                        And a filename will be generated.
            description_width (int): Max line width to wrap `description` to in the
                        saved file. The in-memory `description` is left untouched.
        """

        if not path.suffix:
            # If the path doesn't have a suffix, we assume it's a directory
            # Because `is_dir()` returns false if the directory doesn't exists yet.
            path.mkdir(parents=True, exist_ok=True)
            safe_takeoff_name = safe_filename(self.name)
            filepath = (
                path
                / f"takeoff_{safe_takeoff_name}_cid_{self.country_id}_sid_{self.start_id}.json"
            )
        else:
            # If the path has a suffix, we assume it's a file path
            filepath = path

        filepath.write_text(to_json(self, indent=4))
        return filepath

    @classmethod
    def load(cls, path: Path) -> Self:
        return from_json(cls, path.read_text())
