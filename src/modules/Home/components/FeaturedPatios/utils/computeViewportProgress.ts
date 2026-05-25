type Params = {
    slideCenterX: number;
    viewportCenterX: number;
    viewportHalfWidth: number;
};

export const computeViewportProgress = ({ slideCenterX, viewportCenterX, viewportHalfWidth }: Params): number => {
    if (viewportHalfWidth <= 0) return 0.5;
    const rawDiff = (slideCenterX - viewportCenterX) / viewportHalfWidth;
    const clamped = Math.max(-1, Math.min(1, rawDiff));
    return (clamped + 1) / 2;
};
