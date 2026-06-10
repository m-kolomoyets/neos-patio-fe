/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
    readonly VITE_ANKR_API_KEY: string;
    readonly VITE_MAPTILER_API_KEY: string;
    readonly VITE_CESIUM_ACCESS_TOKEN: string;
    readonly VITE_GOOGLE_MAPS_API_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
