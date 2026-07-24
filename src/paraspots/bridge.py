from __future__ import annotations
from pathlib import Path
from paraspots.qml_models import TakeoffObject
from paraspots.qml_registration import QmlElement, QmlSingleton
from paraspots.takeoff import Takeoff
import logging

from typing import ClassVar

from PySide6.QtCore import Property, QObject, QUrl, Signal, Slot


log = logging.getLogger(__name__)


@QmlElement
@QmlSingleton
class Bridge(QObject):
    takeoffsLoaded = Signal()
    someError = Signal(str)

    _instance: ClassVar[Bridge | None] = None
    _takeoffs: list[Takeoff] = []
    _takeoff_objects: list[TakeoffObject] = []

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

        log.info(f"Loaded {len(takeoffs)} takeoffs from {path}")
        self._takeoffs = takeoffs
        self._takeoff_objects = [TakeoffObject(t, self) for t in takeoffs]
        self.takeoffsLoaded.emit()

    @Property(bool, notify=takeoffsLoaded)
    def hasData(self) -> bool:
        return bool(self._takeoffs)

    @Property("QVariantList", notify=takeoffsLoaded)  # ty: ignore[invalid-argument-type]
    def takeoffs(self) -> list[TakeoffObject]:
        return self._takeoff_objects
