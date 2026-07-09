/**
 * Feature flags gate which routes/features are reachable per deployment. Driven
 * by `VITE_IS_DEV` (a string `"true"`/`"false"`), so a production `npm run build`
 * can still expose dev-only features on a staging deploy by flipping the env var.
 *
 * Route guards read these via `assertFeatureEnabled` in `beforeLoad`; UI reads
 * them to hide links to gated features.
 */

const IS_DEV = import.meta.env.VITE_IS_DEV === 'true';

export const FEATURE_FLAGS = {
    createPatio: IS_DEV,
    patioEdit: IS_DEV,
    uiKit: IS_DEV,
} as const;
