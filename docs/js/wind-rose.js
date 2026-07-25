const WIND_DIRECTION_ANGLES = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };

export function drawWindRose(canvas, windDirs, size = 64) {
    const padding = 5;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - padding;
    const sliceHalfWidth = Math.PI / 4 / 2;

    // Highlighted 45-degree slices, all added to a single path and filled
    // once so adjacent wedges merge instead of leaving an antialiasing seam.
    ctx.beginPath();
    for (const dir of windDirs || []) {
        const angleDeg = WIND_DIRECTION_ANGLES[dir];
        if (angleDeg === undefined)
            continue;

        // Compass angles have 0deg pointing up (north); canvas angles have
        // 0rad pointing right, so shift by -90deg to align them.
        const centerRad = ((angleDeg - 90) * Math.PI) / 180;

        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, centerRad - sliceHalfWidth, centerRad + sliceHalfWidth);
        ctx.closePath();
    }
    ctx.fillStyle = "#ea580c";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.stroke();

    // No data: show a question mark instead of an empty circle
    if (!windDirs || windDirs.length === 0) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = `bold ${Math.round(radius)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", cx, cy);
    }
}
