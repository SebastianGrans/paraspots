from __future__ import annotations
from pathlib import Path
from paraspots.takeoff import Takeoff
import logging

from typing import ClassVar, TypeVar

from PySide6.QtCore import Property, QObject, QUrl, Signal, Slot
from PySide6.QtQml import QmlElement as _QmlElement
from PySide6.QtQml import QmlSingleton as _QmlSingleton


log = logging.getLogger(__name__)


# The type stubs for QmlElement and QmlSingleton are
# def QmlElement(arg__1: object, /) -> object: ...
# They should have been something like this:
_T = TypeVar("_T")


def QmlElement(cls: type[_T]) -> type[_T]:
    return _QmlElement(cls)  # ty: ignore[invalid-return-type]


def QmlSingleton(cls: type[_T]) -> type[_T]:
    return _QmlSingleton(cls)  # ty: ignore[invalid-return-type]


QML_IMPORT_NAME = "qml"
QML_IMPORT_MAJOR_VERSION = 1


@QmlElement
@QmlSingleton
class Bridge(QObject):
    takeoffsLoaded = Signal()
    someError = Signal(str)

    _instance: ClassVar[Bridge | None] = None
    _takeoffs: list[Takeoff] = []

    def __init__(self, parent: QObject | None = None) -> None:
        super().__init__(parent)
        Bridge._instance = self

    @classmethod
    def instance(cls) -> Bridge:
        if cls._instance is None:
            raise RuntimeError("Bridge singleton not yet created")
        return cls._instance

    # ------------------------------------------------------------------ slots

    @Slot(str)
    def load_takeoffs(self, path: str) -> None:
        log.debug(f"Loading takeoffs from {path}")
        local = QUrl(path).toLocalFile() or path
        # Find any .json files in the directory and load them as takeoffs
        takeoffs: list[Takeoff] = []
        for file in Path(local).glob("*.json"):
            takeoffs.append(Takeoff.load(file))

        self._takeoffs = takeoffs
        self.takeoffsLoaded.emit()

    @Property(bool, notify=takeoffsLoaded)
    def hasData(self) -> bool:
        return bool(self._takeoffs)

    @Property(list, notify=takeoffsLoaded)
    def takeoffs(self) -> list[dict]:
        return [
            {
                "name": t.name,
                "latitude": t.coordinates[0],
                "longitude": t.coordinates[1],
                "description": t.description,
                "flightlogUrl": t.flightlog_url,
                "holfuyUrl": getattr(t, "holfuy_url", ""),
            }
            for t in self._takeoffs
        ]
