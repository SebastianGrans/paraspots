pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: root

    property var takeoff: null

    color: Theme.surfaceLow
    border.color: Theme.divider
    border.width: 1

    // Empty state
    ColumnLayout {
        anchors.centerIn: parent
        width: parent.width - 32
        visible: !root.takeoff
        spacing: 8

        Text {
            Layout.fillWidth: true
            text: "🪂"
            font.pointSize: Theme.fontXl * 2
            horizontalAlignment: Text.AlignHCenter
        }

        Text {
            Layout.fillWidth: true
            text: "Select a takeoff on the map\nto see its details"
            color: Theme.textMuted
            font.pointSize: Theme.fontMd
            wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
        }
    }

    Loader {
        anchors.fill: parent
        active: !!root.takeoff
        sourceComponent: detailsComponent
    }

    Component {
        id: detailsComponent

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 16
            spacing: 12

            TextEdit {
                Layout.fillWidth: true
                text: root.takeoff.name
                color: Theme.textPrimary
                font.pointSize: Theme.fontXl
                font.bold: true
                wrapMode: Text.WordWrap
                readOnly: true
                selectByMouse: true
            }

            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 1
                color: Theme.divider
            }

            RowLayout {
                Layout.fillWidth: true
                spacing: 10

                Repeater {
                    model: [
                        {
                            label: "Flightlog",
                            url: root.takeoff.flightlogUrl
                        },
                        {
                            label: "Holfuy",
                            url: root.takeoff.holfuyUrl
                        },
                        {
                            label: "Windy",
                            url: `https://www.windy.com/${root.takeoff.latitude}/${root.takeoff.longitude}`
                        },
                        {
                            label: "Google Maps",
                            url: `https://www.google.com/maps/search/?api=1&query=${root.takeoff.latitude},${root.takeoff.longitude}`
                        },
                        {
                            label: "Yr.no",
                            url: `https://www.yr.no/nb/v%C3%A6rvarsel/daglig-tabell/${root.takeoff.latitude},${root.takeoff.longitude}`
                        }
                    ]

                    delegate: Rectangle {
                        id: linkChip
                        required property var modelData

                        visible: !!modelData.url
                        color: linkArea.containsMouse ? Theme.divider : "transparent"
                        border.color: Theme.chartLine
                        border.width: 1
                        Layout.preferredWidth: linkLabel.implicitWidth + 20
                        Layout.preferredHeight: linkLabel.implicitHeight + 12

                        Text {
                            id: linkLabel
                            anchors.centerIn: parent
                            text: linkChip.modelData.label
                            color: Theme.chartLine
                            font.pointSize: Theme.fontSm
                        }

                        MouseArea {
                            id: linkArea
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: Qt.openUrlExternally(linkChip.modelData.url)
                        }
                    }
                }
            }

            RowLayout {
                Layout.fillWidth: true
                spacing: 12

                WindRose {
                    windDirs: root.takeoff.windDirs
                }
            }

            ScrollView {
                Layout.fillWidth: true
                Layout.fillHeight: true
                clip: true

                TextEdit {
                    width: root.width - 32
                    textFormat: TextEdit.RichText
                    text: root.takeoff.descriptionHtml
                    color: Theme.textSecondary
                    font.pointSize: Theme.fontMd
                    wrapMode: Text.WordWrap
                    readOnly: true
                    selectByMouse: true
                    onLinkActivated: link => Qt.openUrlExternally(link)
                }
            }
        }
    }
}
