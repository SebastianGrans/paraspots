from paraspots.bridge import Bridge
import argparse
import logging
import signal
import sys
from pathlib import Path

from PySide6.QtGui import QGuiApplication
from PySide6.QtQml import QQmlApplicationEngine
from rich.logging import RichHandler

log = logging.getLogger(__name__)


def arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Paragliding spots")

    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable verbose logging",
    )
    return parser


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(message)s",
        datefmt="[%X]",
        handlers=[RichHandler(rich_tracebacks=True)],
    )

    signal.signal(signal.SIGINT, signal.SIG_DFL)

    args, qt_args = arg_parser().parse_known_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    app = QGuiApplication([sys.argv[0]] + qt_args)
    app.setApplicationName("Paraspots")
    app.setOrganizationName("paraspots")

    engine = QQmlApplicationEngine()
    engine.addImportPath(str(Path(__file__).parent))
    engine.loadFromModule("qml", "Main")

    if not engine.rootObjects():
        sys.exit(1)

    bridge = Bridge.instance()  # type: ignore[attr-defined]
    bridge.load_takeoffs("/home/grans/Projects/paraspots/data/takeoffs")

    ret = app.exec()
    # Destroy the QML engine before the singleton goes out of scope, otherwise
    # the engine's final binding evaluation fires with FlightBridge=null and
    # produces a flood of TypeError messages.
    del engine
    sys.exit(ret)


if __name__ == "__main__":
    main()
