import QtQuick
import QtQuick.Layouts

Rectangle {
    id: root

    color: Theme.surfaceLow
    border.color: Theme.divider
    border.width: 1

    ColumnLayout {
        anchors.centerIn: parent
        width: parent.width - 32
        spacing: 8

        Text {
            Layout.fillWidth: true
            text: "🪂 Placeholder"
            font.pointSize: Theme.fontXl * 2
            horizontalAlignment: Text.AlignHCenter
        }
    }
}
