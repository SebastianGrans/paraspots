from __future__ import annotations

import html
import re

from PySide6.QtCore import Property, QObject

from paraspots.qml_registration import QmlElement
from paraspots.takeoff import Takeoff

_URL_RE = re.compile(r'https?://[^\s<]+[^\s<.,;:!?)"\']')


@QmlElement
class TakeoffObject(QObject):
    takeoff: Takeoff

    def __init__(self, takeoff: Takeoff, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._takeoff = takeoff

    @Property(str, constant=True)
    def name(self) -> str:
        return self._takeoff.name

    @Property(float, constant=True)
    def latitude(self) -> float:
        return self._takeoff.latitude

    @Property(float, constant=True)
    def longitude(self) -> float:
        return self._takeoff.longitude

    @Property(str, constant=True)
    def description(self) -> str:
        return self._takeoff.description

    @Property(str, constant=True)
    def descriptionHtml(self) -> str:
        escaped = html.escape(self._takeoff.description)
        linked = _URL_RE.sub(lambda m: f'<a href="{m[0]}">{m[0]}</a>', escaped)
        return linked.replace("\n", "<br>\n")

    @Property(str, constant=True)
    def flightlogUrl(self) -> str:
        return self._takeoff.flightlog_url

    @Property(str, constant=True)
    def holfuyUrl(self) -> str:
        return self._takeoff.holfuy_url

    @Property(int, constant=True)
    def countryId(self) -> int:
        return self._takeoff.country_id

    @Property(int, constant=True)
    def startId(self) -> int:
        return self._takeoff.start_id

    @Property(int, constant=True)
    def holfuyId(self) -> int:
        return self._takeoff.holfuy_id or 0

    @Property("QVariantList", constant=True)  # ty: ignore[invalid-argument-type]
    def windDirs(self) -> list[int]:
        return [int(d) for d in self._takeoff.wind_dirs]
