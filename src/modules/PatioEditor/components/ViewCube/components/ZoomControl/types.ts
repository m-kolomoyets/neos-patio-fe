export type ZoomControlProps = {
    /** Current zoom expressed as a percentage of the reference zoom (100% = ref). */
    percent: number;
    /** Step zoom by ±1 level (+1 in, -1 out). */
    onStepZoom: (_delta: 1 | -1) => void;
    /** Jump to a preset zoom percentage (50 / 100 / 200). */
    onZoomToPercent: (_percent: number) => void;
    /** Frame the whole patio footprint (`fitBounds`). */
    onZoomToFit: () => void;
    /** Persist the live camera as the Home view. */
    onSetHome: () => void;
    /** Clear the saved Home and return to the editor default. */
    onResetHome: () => void;
};
