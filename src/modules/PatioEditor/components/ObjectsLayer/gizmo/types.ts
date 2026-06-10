import type { Matrix4 } from 'cesium';

/** World ENU axis a handle drives: east (`x`), north (`y`), up (`z`). */
export type GizmoAxis = 'x' | 'y' | 'z';

/** The kind of handle, by transform mode. */
export type GizmoHandleKind = 'translate' | 'rotate' | 'scale';

/**
 * Key carried on a gizmo handle's pickable `id`. Lets `scene.pick` tell a gizmo
 * handle apart from a placed object (which carries `editorObjectId`) and from the
 * world tileset, so selection can ignore handle picks and the drag machine can
 * read back which axis/kind was grabbed.
 */
export const GIZMO_HANDLE_ID = 'gizmoHandle';

/** Typed pick id every handle instance carries. */
export type GizmoPickId = {
    [GIZMO_HANDLE_ID]: { axis: GizmoAxis; kind: GizmoHandleKind };
};

/** Narrow an arbitrary `scene.pick` id to a gizmo handle pick id. */
export const isGizmoPickId = (value: unknown): value is GizmoPickId => {
    return typeof value === 'object' && value !== null && GIZMO_HANDLE_ID in value;
};

/** Anything carrying a writable `modelMatrix` (e.g. a loaded Cesium `Model`). */
export type GizmoTarget = { modelMatrix: Matrix4 };

export type TransformGizmoHandle = {
    /** Remove the gizmo's primitive, input handler, and per-frame hook. */
    destroy: () => void;
};
