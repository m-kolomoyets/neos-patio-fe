/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
    readonly VITE_ANKR_API_KEY: string;
    readonly VITE_FEATURED_CURSOR_SCRUB?: 'true' | 'false';
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
