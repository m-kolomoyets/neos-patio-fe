/**
 * Module-level constants shared across PatioEditor components.
 */

/**
 * react-map-gl map id. Set on the `<Map>` in MapCanvas and looked up via
 * `useMap()` from overlay widgets (e.g. ViewCube) that live outside `<Map>`.
 */
export const EDITOR_MAP_ID = 'editor-map';

/**
 * Debug flags for stepping through the upload model flow. Flip a flag to
 * `true` to freeze the flow at a stage instead of auto-advancing — useful for
 * inspecting a single step's UI in isolation. Keep all `false` when committing.
 */
export const UPLOAD_FLOW_DEBUG = {
    /** Stay on the `uploading` step; never auto-advance to `preview`. */
    stopAtUploading: false,
};
