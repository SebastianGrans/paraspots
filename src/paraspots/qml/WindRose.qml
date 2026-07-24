import QtQuick

Canvas {
    id: root

    // List of WindDir bitmask values (1, 2, 4, 8, 16, 32, 64, 128)
    property var windDirs: []

    readonly property var directionAngles: ({
            // N
            128: 0,
            // NE
            64: 45,
            // E
            32: 90,
            // SE
            16: 135,
            // S
            8: 180,
            // SW
            4: 225,
            // W
            2: 270,
            // NW
            1: 315
        })

    width: 96
    height: 96

    onWindDirsChanged: requestPaint()
    onPaint: {
        const ctx = getContext("2d");
        ctx.reset();

        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) / 2 - 10;
        const sliceHalfWidth = (Math.PI / 4) / 2;
        // Slightly overlap neighboring slices so antialiasing doesn't leave
        // a visible seam between two adjacent same-colored fills.
        const overlap = 0.01;

        // Highlighted 45-degree slices
        for (const value of root.windDirs) {
            console.log("Drawing wind direction slice for value:", value);
            const angleDeg = root.directionAngles[value];
            if (angleDeg === undefined)
                continue;

            // Compass angles have 0deg pointing up (north); canvas angles have
            // 0rad pointing right, so shift by -90deg to align them.
            const centerRad = (angleDeg - 90) * Math.PI / 180;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, centerRad - sliceHalfWidth - overlap, centerRad + sliceHalfWidth + overlap);
            ctx.closePath();
            ctx.fillStyle = Theme.accent;
            ctx.fill();
        }

        // Outer circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = Theme.divider;
        ctx.lineWidth = 1;
        ctx.stroke();

        // // Spokes at each slice boundary (offset by 22.5deg from the
        // // cardinal directions, so e.g. North's slice is bounded by the
        // // spokes at -22.5deg and 22.5deg, not centered between two of them)
        // for (let deg = 22.5; deg < 360; deg += 45) {
        //     const rad = (deg - 90) * Math.PI / 180;
        //     ctx.beginPath();
        //     ctx.moveTo(cx, cy);
        //     ctx.lineTo(cx + radius * Math.cos(rad), cy + radius * Math.sin(rad));
        //     ctx.strokeStyle = Theme.divider;
        //     ctx.stroke();
        // }

        // North label
        // ctx.fillStyle = Theme.textMuted;
        // ctx.font = Theme.fontSm + "pt sans-serif";
        // ctx.textAlign = "center";
        // ctx.textBaseline = "middle";
        // ctx.fillText("N", cx, cy - radius - 8);
    }
}
