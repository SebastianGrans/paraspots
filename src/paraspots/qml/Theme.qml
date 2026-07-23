pragma Singleton
import QtQuick
import QtCore

QtObject {
    id: root

    enum Mode {
        Light,
        System,
        Dark
    }

    property int mode: Theme.Mode.System

    property Settings settings: Settings {
        category: "appearance"
        property alias mode: root.mode
    }

    readonly property bool isDark: {
        if (mode === Theme.Mode.System)
            return Application.styleHints.colorScheme === Qt.ColorScheme.Dark;
        return mode === Theme.Mode.Dark;
    }

    readonly property color windowBg: isDark ? "#0a0e17" : "#f1f5f9"
    readonly property color surfaceLow: isDark ? "#0f172a" : "#ffffff"
    readonly property color divider: isDark ? "#1e293b" : "#e2e8f0"
    readonly property color textPrimary: isDark ? "#f1f5f9" : "#0f172a"
    readonly property color textSecondary: isDark ? "#94a3b8" : "#475569"
    readonly property color textMuted: isDark ? "#64748b" : "#94a3b8"
    readonly property color textSuccess: isDark ? "#86efac" : "#16a34a"
    readonly property color errorBg: isDark ? "#7f1d1d" : "#fef2f2"
    readonly property color errorBorder: "#ef4444"
    readonly property color errorText: isDark ? "#fca5a5" : "#dc2626"
    // Font sizes (pointSize) — scaled by fontScale
    property real fontScale: 1.0
    readonly property int fontXs: Math.round(8 * fontScale)
    readonly property int fontSm: Math.round(9 * fontScale)
    readonly property int fontMd: Math.round(10 * fontScale)
    readonly property int fontLg: Math.round(11 * fontScale)
    readonly property int fontXl: Math.round(15 * fontScale)

    readonly property color chartBg: isDark ? "#0a0e17" : "#f8fafc"
    readonly property color chartGrid: isDark ? "#334155" : "#94a3b8"
    readonly property color chartLine: isDark ? "#8b5cf6" : "#7c3aed"
    readonly property color chartLabel: isDark ? "#64748b" : "#475569"
}
