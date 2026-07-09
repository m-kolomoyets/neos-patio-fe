/** Narrowest the sidebar may be dragged; also the CSS `min-width` floor. */
export const SIDEBAR_MIN_WIDTH = 240;
/** Widest the sidebar may be dragged before it eats the canvas. */
export const SIDEBAR_MAX_WIDTH = 354;
/** Width applied when nothing is stored (or storage is invalid). */
export const SIDEBAR_DEFAULT_WIDTH = 240;
/** Pixels per arrow-key press when the resize handle is focused. */
export const SIDEBAR_KEYBOARD_STEP = 16;
/** Global localStorage key — width is a UI preference, shared across patios. */
export const SIDEBAR_WIDTH_STORAGE_KEY = 'patio-editor:sidebar-width';
