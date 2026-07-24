from __future__ import annotations

from typing import TypeVar

from PySide6.QtQml import QmlElement as _QmlElement
from PySide6.QtQml import QmlSingleton as _QmlSingleton

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
