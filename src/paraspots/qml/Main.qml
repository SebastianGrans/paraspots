import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Dialogs

ApplicationWindow {
    id: root
    visible: true
    width: 980
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

    ColumnLayout {
        anchors.fill: parent
        spacing: 10
        // map — grows to fill all remaining space
        Map {
            id: map
            Layout.fillWidth: true
            Layout.fillHeight: true
        }
    }
}
