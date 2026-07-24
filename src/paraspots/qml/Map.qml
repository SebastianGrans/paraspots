pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Controls
import QtLocation
import QtPositioning

Item {
    id: root

    property var selectedTakeoff: null
    property bool locating: false
    property var userLocationMarker: null

    MapView {
        id: mapView
        anchors.fill: parent
        map.center: QtPositioning.coordinate(61.0, 8.0)
        map.zoomLevel: 5
        map.copyrightsVisible: false
        map.plugin: Plugin {
            name: "osm"
        }
    }

    CoordinateAnimation {
        id: centerAnimation
        target: mapView.map
        property: "center"
        duration: 800
        easing.type: Easing.InOutQuad
    }

    NumberAnimation {
        id: zoomAnimation
        target: mapView.map
        property: "zoomLevel"
        to: 10
        duration: 800
        easing.type: Easing.InOutQuad
    }

    PositionSource {
        id: positionSource
        name: "geoclue2"
        PluginParameter {
            name: "desktopId"
            value: "paraspots"
        }

        onPositionChanged: {
            if (position.latitudeValid && position.longitudeValid) {
                centerAnimation.to = position.coordinate;
                centerAnimation.start();
                zoomAnimation.start();
                root.locating = false;
                root.updateUserLocationMarker(position.coordinate);
            }
        }

        onSourceErrorChanged: {
            if (sourceError !== PositionSource.NoError) {
                root.locating = false;
                locateError.visible = true;
                locateErrorTimer.restart();
            }
        }
    }

    Rectangle {
        id: locateButton
        width: 40
        height: 40
        radius: 20
        color: Theme.surfaceLow
        border.color: Theme.divider
        border.width: 1
        z: 10
        anchors {
            right: parent.right
            bottom: parent.bottom
            margins: 12
        }

        Text {
            anchors.centerIn: parent
            text: root.locating ? "…" : "📍"
            font.pointSize: Theme.fontLg
        }

        MouseArea {
            anchors.fill: parent
            cursorShape: Qt.PointingHandCursor
            onClicked: {
                root.locating = true;
                positionSource.update();
            }
        }
    }

    Rectangle {
        id: locateError
        visible: false
        color: Theme.errorBg
        border.color: Theme.errorBorder
        border.width: 1
        radius: 6
        z: 10
        width: locateErrorText.implicitWidth + 24
        height: 32
        anchors {
            right: parent.right
            bottom: locateButton.top
            margins: 12
            bottomMargin: 8
        }

        Text {
            id: locateErrorText
            anchors.centerIn: parent
            text: "Couldn't get your location"
            color: Theme.errorText
            font.pointSize: Theme.fontSm
        }

        Timer {
            id: locateErrorTimer
            interval: 4000
            onTriggered: locateError.visible = false
        }
    }

    // MapView's Map is nested inside a wrapper Item that does not forward
    // declared children to it, so MapItemView/MapQuickItem cannot be added
    // declaratively here. Instead, markers are created from this Component
    // and attached imperatively via Map.addMapItem().
    Component {
        id: markerComponent

        MapQuickItem {
            id: takeoffMarker
            property var takeoff

            coordinate: QtPositioning.coordinate(takeoff.latitude, takeoff.longitude)
            anchorPoint: Qt.point(marker.width / 2, marker.height / 2)

            sourceItem: Rectangle {
                id: marker
                width: 12
                height: 12
                radius: width / 2
                color: takeoffMarker.takeoff === root.selectedTakeoff ? Theme.accent : Theme.chartLine
                border.color: "white"
                border.width: 1

                MouseArea {
                    anchors.fill: parent
                    hoverEnabled: true
                    onEntered: tip.visible = true
                    onExited: tip.visible = false
                    onClicked: root.selectedTakeoff = takeoffMarker.takeoff
                }

                ToolTip {
                    id: tip
                    text: takeoffMarker.takeoff.name
                    visible: false
                }
            }
        }
    }

    Component {
        id: userLocationComponent

        MapQuickItem {
            anchorPoint: Qt.point(locationText.width / 2, locationText.height / 2)

            sourceItem: Text {
                id: locationText
                text: "📍"
                font.pointSize: Theme.fontXl
            }
        }
    }

    function rebuildMarkers() {
        mapView.map.clearMapItems();
        for (const takeoff of Bridge.takeoffs) {
            mapView.map.addMapItem(markerComponent.createObject(root, {
                takeoff: takeoff
            }));
        }
        if (root.userLocationMarker) {
            mapView.map.addMapItem(root.userLocationMarker);
        }
    }

    function updateUserLocationMarker(coordinate) {
        if (root.userLocationMarker) {
            root.userLocationMarker.coordinate = coordinate;
        } else {
            root.userLocationMarker = userLocationComponent.createObject(root, {
                coordinate: coordinate
            });
            mapView.map.addMapItem(root.userLocationMarker);
        }
    }

    Connections {
        target: Bridge
        function onTakeoffsLoaded() {
            root.rebuildMarkers();
        }
    }

    Component.onCompleted: rebuildMarkers()
}
