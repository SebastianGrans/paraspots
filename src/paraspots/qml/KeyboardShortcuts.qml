import QtQuick

// A Shortcut only receives key events once it is part of a real window's
// item tree, so this must be instantiated as a child of Main.qml's
// ApplicationWindow rather than used as a singleton.
Item {
    id: root

    signal focusSearchRequested

    Shortcut {
        // Quit on ctrl+w
        sequences: [StandardKey.Close]
        context: Qt.ApplicationShortcut
        onActivated: Qt.quit()
    }

    Shortcut {
        // Focus the takeoff search field on ctrl+s
        sequences: ["Ctrl+S"]
        context: Qt.ApplicationShortcut
        onActivated: root.focusSearchRequested()
    }
}
