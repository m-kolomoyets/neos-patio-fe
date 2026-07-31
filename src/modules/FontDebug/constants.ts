/**
 * Temporary font-weight tuning tool. Enabled with the `?font-debug` search param.
 * Delete this folder and its usage in `src/routes/__root.tsx` to remove it entirely.
 */

export const FONT_DEBUG_SEARCH_PARAM = 'font-debug';

/** Every custom property starting with this prefix is treated as a font-weight token. */
export const FONT_WEIGHT_TOKEN_PREFIX = '--fw-';

/** Inter declares a `100 900` weight axis (see `src/styles/index.css`). */
export const WEIGHT_MIN = 100;
export const WEIGHT_MAX = 900;
export const WEIGHT_STEP = 10;

export const SPECIMEN_TEXT = 'Handgloves 0123456789';
