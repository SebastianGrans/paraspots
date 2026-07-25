pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtPositioning

Rectangle {
    id: root

    signal takeoffSelected(var takeoff)
    signal takeoffDoubleClicked(var takeoff)

    enum SortMode {
        Az,
        Za,
        DistAsc,
        DistDesc
    }

    property var selectedTakeoff: null
    property var hoveredTakeoff: null
    property var referenceCoordinate: null
    property string searchQuery: ""
    property int sortMode: ListPanel.Az
    property var filteredTakeoffs: {
        let list = root.searchQuery ? Bridge.takeoffs.filter(t => t.name.toLowerCase().indexOf(root.searchQuery) !== -1) : Bridge.takeoffs.slice();

        switch (root.sortMode) {
        case ListPanel.Za:
            list.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case ListPanel.DistAsc:
            if (root.referenceCoordinate)
                list.sort((a, b) => root.distanceToTakeoff(a) - root.distanceToTakeoff(b));
            else
                list.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case ListPanel.DistDesc:
            if (root.referenceCoordinate)
                list.sort((a, b) => root.distanceToTakeoff(b) - root.distanceToTakeoff(a));
            else
                list.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            // ListPanel.Az
            list.sort((a, b) => a.name.localeCompare(b.name));
        }
        return list;
    }

    color: Theme.surfaceLow
    border.color: Theme.divider
    border.width: 1

    onReferenceCoordinateChanged: {
        if (root.referenceCoordinate)
            root.sortMode = ListPanel.DistAsc;
    }

    onSelectedTakeoffChanged: {
        const index = root.filteredTakeoffs.indexOf(root.selectedTakeoff);
        if (index >= 0)
            listView.positionViewAtIndex(index, ListView.Contain);
    }

    function focusSearch() {
        searchField.forceActiveFocus();
    }

    function formatDistance(meters) {
        if (meters < 1000)
            return Math.round(meters) + " m";
        return (meters / 1000).toFixed(1) + " km";
    }

    function distanceToTakeoff(takeoff) {
        return root.referenceCoordinate.distanceTo(QtPositioning.coordinate(takeoff.latitude, takeoff.longitude));
    }

    Component.onCompleted: root.focusSearch()

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

        RowLayout {
            Layout.fillWidth: true
            spacing: 8

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

                Keys.onEscapePressed: event => {
                    searchField.text = "";
                    event.accepted = true;
                }
            }

            Rectangle {
                id: clearSearchButton
                visible: searchField.text.length > 0
                Layout.preferredWidth: 24
                Layout.preferredHeight: 24
                Layout.alignment: Qt.AlignVCenter
                radius: width / 2
                color: clearSearchButtonArea.containsMouse ? Theme.divider : "transparent"
                border.color: Theme.divider
                border.width: 0

                Text {
                    anchors.centerIn: parent
                    text: "×"
                    color: Theme.textMuted
                    font.pointSize: Theme.fontXl
                }

                MouseArea {
                    id: clearSearchButtonArea
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        searchField.text = "";
                        searchField.forceActiveFocus();
                    }
                }
            }

            Rectangle {
                id: sortButton
                Layout.preferredWidth: 36
                Layout.preferredHeight: searchField.implicitHeight
                radius: 0
                color: sortButtonArea.containsMouse || sortMenu.visible ? Theme.divider : "transparent"
                border.color: Theme.divider
                border.width: 1

                Text {
                    anchors.centerIn: parent
                    text: "▲▼"
                    color: Theme.textMuted
                    font.pointSize: Theme.fontMd
                }

                MouseArea {
                    id: sortButtonArea
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: sortMenu.open()
                }

                // A plain Popup rather than Menu/MenuItem, since Menu closes
                // itself whenever a MenuItem is triggered — here we want
                // picking a sort option to stay open.
                Popup {
                    id: sortMenu
                    x: parent.width - width
                    y: parent.height
                    padding: 4

                    background: Rectangle {
                        color: Theme.surfaceLow
                        border.color: Theme.divider
                        border.width: 1
                    }

                    contentItem: Column {
                        spacing: 2

                        Repeater {
                            model: [
                                {
                                    label: "A-Z",
                                    mode: ListPanel.Az,
                                    requiresLocation: false
                                },
                                {
                                    label: "Z-A",
                                    mode: ListPanel.Za,
                                    requiresLocation: false
                                },
                                {
                                    label: "Dist. asc.",
                                    mode: ListPanel.DistAsc,
                                    requiresLocation: true
                                },
                                {
                                    label: "Dist. desc.",
                                    mode: ListPanel.DistDesc,
                                    requiresLocation: true
                                }
                            ]

                            delegate: Rectangle {
                                id: sortOption
                                required property var modelData

                                readonly property bool isEnabled: !sortOption.modelData.requiresLocation || !!root.referenceCoordinate

                                width: 130
                                height: optionText.implicitHeight + 12
                                radius: 4
                                opacity: sortOption.isEnabled ? 1 : 0.4
                                color: optionArea.containsMouse && sortOption.isEnabled ? Theme.divider : "transparent"

                                Text {
                                    id: optionText
                                    anchors.verticalCenter: parent.verticalCenter
                                    anchors.left: parent.left
                                    anchors.margins: 8
                                    text: sortOption.modelData.label
                                    color: Theme.textPrimary
                                    font.pointSize: Theme.fontMd
                                    font.bold: root.sortMode === sortOption.modelData.mode
                                }

                                MouseArea {
                                    id: optionArea
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    enabled: sortOption.isEnabled
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: root.sortMode = sortOption.modelData.mode
                                }
                            }
                        }
                    }
                }
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
                        anchors.right: distanceText.visible ? distanceText.left : parent.right
                        anchors.margins: 8
                        text: delegateRoot.modelData.name
                        color: Theme.textPrimary
                        font.pointSize: Theme.fontMd
                        font.bold: delegateRoot.isSelected
                        elide: Text.ElideRight
                    }

                    Text {
                        id: distanceText
                        visible: !!root.referenceCoordinate
                        anchors.verticalCenter: parent.verticalCenter
                        anchors.right: parent.right
                        anchors.margins: 8
                        text: visible ? root.formatDistance(root.distanceToTakeoff(delegateRoot.modelData)) : ""
                        color: Theme.textMuted
                        font.pointSize: Theme.fontSm
                    }

                    MouseArea {
                        id: mouseArea
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: root.takeoffSelected(delegateRoot.modelData)
                        onDoubleClicked: root.takeoffDoubleClicked(delegateRoot.modelData)
                        onEntered: root.hoveredTakeoff = delegateRoot.modelData
                        onExited: {
                            if (root.hoveredTakeoff === delegateRoot.modelData)
                                root.hoveredTakeoff = null;
                        }
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
