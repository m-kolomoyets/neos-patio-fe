// Catalog panel occludes the left edge of the map canvas (position: absolute,
// left: 1rem, width: 16rem). New objects spawn at the center of the *visible*
// map region, so the click handler shifts the sample point right by this inset
// (1rem margin + 16rem panel + 1rem breathing room ≈ 18rem at 16px root).
export const CATALOG_PANEL_INSET_PX = 288;
