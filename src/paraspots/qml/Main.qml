import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Dialogs

ApplicationWindow {
    id: root
    visible: true
    width: 1080
    height: 860
    minimumWidth: 700
    minimumHeight: 600
    title: "ParaSpots"
    color: Theme.windowBg

    Connections {
        target: Bridge
        function onSomeError(msg) {
            errorText.text = "⚠️ " + msg;
            errorBar.visible = true;
            errorTimer.restart();
        }
    }
    Rectangle {
        id: errorBar
        visible: false
        anchors {
            bottom: parent.bottom
            horizontalCenter: parent.horizontalCenter
            bottomMargin: 16
        }
        width: errorText.implicitWidth + 32
        height: 36
        radius: 6
        color: Theme.errorBg
        border.color: Theme.errorBorder
        border.width: 1
        z: 10
        Text {
            id: errorText
            anchors.centerIn: parent
            color: Theme.errorText
            font.pointSize: Theme.fontMd
        }
        Timer {
            id: errorTimer
            interval: 4000
            onTriggered: errorBar.visible = false
        }
    }

    SplitView {
        id: mainRow
        anchors.fill: parent
        orientation: Qt.Horizontal

        handle: Rectangle {
            implicitWidth: 6
            color: SplitHandle.pressed ? Theme.chartLine : (SplitHandle.hovered ? Theme.divider : "transparent")

            Rectangle {
                anchors.centerIn: parent
                width: 2
                height: parent.height * 0.3
                radius: 1
                color: Theme.textMuted
            }
        }

        Map {
            id: map
            SplitView.preferredWidth: mainRow.width * 0.8
            SplitView.minimumWidth: 200
        }

        SplitView {
            id: sidePanel
            orientation: Qt.Vertical
            SplitView.preferredWidth: mainRow.width * 0.2
            SplitView.minimumWidth: 550

            handle: Rectangle {
                implicitHeight: 6
                color: SplitHandle.pressed ? Theme.chartLine : (SplitHandle.hovered ? Theme.divider : "transparent")

                Rectangle {
                    anchors.centerIn: parent
                    width: parent.width * 0.3
                    height: 2
                    radius: 1
                    color: Theme.textMuted
                }
            }

            TakeoffPanel {
                id: takeoffPanel
                SplitView.preferredHeight: sidePanel.height * 0.5
                SplitView.minimumHeight: 300
                takeoff: map.selectedTakeoff

                // A callback that prints the current width
                // For debugging purposes
                // onHeightChanged: console.log("TakeoffPanel height changed to", height)
            }

            ListPanel {
                id: listPanel
                SplitView.preferredHeight: sidePanel.height * 0.5
                SplitView.minimumHeight: 0
            }
        }
    }
}
