pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: root

    signal takeoffSelected(var takeoff)

    property var selectedTakeoff: null
    property string searchQuery: ""
    property var filteredTakeoffs: {
        if (!root.searchQuery)
            return Bridge.takeoffs;
        return Bridge.takeoffs.filter(t => t.name.toLowerCase().indexOf(root.searchQuery) !== -1);
    }

    color: Theme.surfaceLow
    border.color: Theme.divider
    border.width: 1

    // Empty state (no takeoffs loaded yet)
    ColumnLayout {
        anchors.centerIn: parent
        width: parent.width - 32
        visible: !Bridge.hasData
        spacing: 8

        Text {
            Layout.fillWidth: true
            text: "🪂"
            font.pointSize: Theme.fontXl * 2
            horizontalAlignment: Text.AlignHCenter
        }

        Text {
            Layout.fillWidth: true
            text: "No takeoffs loaded"
            color: Theme.textMuted
            font.pointSize: Theme.fontMd
            wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
        }
    }

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 16
        spacing: 8
        visible: Bridge.hasData

        TextField {
            id: searchField
            Layout.fillWidth: true
            placeholderText: "Search takeoffs…"
            font.pointSize: Theme.fontMd
            background: Rectangle {
                color: Theme.surfaceLow
                border.color: Theme.divider
                border.width: 0
                radius: 4
            }

            onTextChanged: searchDebounce.restart()

            Keys.onDownPressed: event => {
                if (listView.count > 0) {
                    listView.forceActiveFocus();
                    // forceActiveFocus() can itself promote currentIndex from -1 to 0
                    // as a side effect, making this assignment a no-op that doesn't fire
                    // onCurrentIndexChanged. Select explicitly rather than relying on it.
                    listView.currentIndex = 0;
                    root.takeoffSelected(root.filteredTakeoffs[0]);
                }
                event.accepted = true;
            }
        }

        Timer {
            id: searchDebounce
            interval: 200
            onTriggered: root.searchQuery = searchField.text.trim().toLowerCase()
        }

        // Then a vertical divider
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 1
            color: Theme.divider
        }

        ScrollView {
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true
            visible: listView.count > 0

            ListView {
                id: listView
                model: root.filteredTakeoffs
                spacing: 4
                currentIndex: -1

                onCurrentIndexChanged: {
                    if (listView.activeFocus && currentIndex >= 0 && currentIndex < root.filteredTakeoffs.length)
                        root.takeoffSelected(root.filteredTakeoffs[currentIndex]);
                }

                delegate: Rectangle {
                    id: delegateRoot
                    required property var modelData

                    readonly property bool isSelected: delegateRoot.modelData === root.selectedTakeoff

                    width: listView.width
                    height: nameText.implicitHeight + 16
                    radius: 4
                    color: delegateRoot.isSelected ? Qt.rgba(Theme.accent.r, Theme.accent.g, Theme.accent.b, 0.15) : (mouseArea.containsMouse ? Theme.divider : "transparent")
                    border.color: Theme.accent
                    border.width: delegateRoot.isSelected ? 1 : 0

                    Text {
                        id: nameText
                        anchors.verticalCenter: parent.verticalCenter
                        anchors.left: parent.left
                        anchors.right: parent.right
                        anchors.margins: 8
                        text: delegateRoot.modelData.name
                        color: Theme.textPrimary
                        font.pointSize: Theme.fontMd
                        font.bold: delegateRoot.isSelected
                        elide: Text.ElideRight
                    }

                    MouseArea {
                        id: mouseArea
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: root.takeoffSelected(delegateRoot.modelData)
                    }
                }
            }
        }

        Text {
            Layout.fillWidth: true
            Layout.fillHeight: true
            visible: listView.count === 0
            text: "No takeoffs match your search"
            color: Theme.textMuted
            font.pointSize: Theme.fontMd
            wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignVCenter
        }
    }
}
