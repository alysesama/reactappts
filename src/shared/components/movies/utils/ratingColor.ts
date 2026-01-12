function clamp01(v: number) {
    return Math.min(1, Math.max(0, v));
}

export function ratingColor(rating0to10: number) {
    const t = clamp01(rating0to10 / 10);

    const r0 = 239;
    const g0 = 68;
    const b0 = 68;

    const r1 = 34;
    const g1 = 197;
    const b1 = 94;

    const r = Math.round(r0 + (r1 - r0) * t);
    const g = Math.round(g0 + (g1 - g0) * t);
    const b = Math.round(b0 + (b1 - b0) * t);

    return `rgb(${r}, ${g}, ${b})`;
}
