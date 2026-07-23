import QtQuick
import QtQuick.Layouts
import QtLocation
import QtPositioning

Item {
    id: root

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
}
