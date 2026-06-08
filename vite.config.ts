import { fileURLToPath } from 'node:url';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint2';
import { createHtmlPlugin } from 'vite-plugin-html';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import svgr from 'vite-plugin-svgr';

// Cesium ships pre-built static runtime assets (Workers, web workers' WASM, Assets,
// Widgets CSS, ThirdParty libs) that must be copied verbatim and located at runtime via
// the `CESIUM_BASE_URL` global. We serve/copy them under `/cesium` instead of pulling in
// the dormant, unattested `vite-plugin-cesium` (PRD-sanctioned static-copy fallback).
const CESIUM_SOURCE = 'node_modules/cesium/Build/Cesium';
const CESIUM_BASE_DIR = 'cesium';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    return {
        plugins: [
            devtools(),
            tanstackRouter({
                target: 'react',
                autoCodeSplitting: true,
            }),
            react({
                babel: {
                    plugins: ['babel-plugin-react-compiler'],
                },
            }),
            svgr({
                include: '**/*.svg?react',
                svgrOptions: {
                    plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
                    svgoConfig: {
                        floatPrecision: 2,
                    },
                },
            }),
            eslint({ exclude: ['/virtual:/', 'node_modules/**'] }),
            visualizer({
                filename: './tmp/bundle-visualizer.html',
                gzipSize: true,
                brotliSize: true,
            }),
            createHtmlPlugin({
                minify: true,
                template: 'index.html',
                inject: {
                    data: {
                        injectScript:
                            mode === 'scan'
                                ? `<script
                                    crossOrigin="anonymous"
                                    src="//unpkg.com/react-scan/dist/auto.global.js"
                                  ></script>`
                                : '',
                    },
                },
            }),
            viteStaticCopy({
                // Recursively copy Cesium's static runtime folders into `/cesium`, preserving
                // their internal structure. static-copy always keeps the matched source path
                // under `dest`, so `stripBase` drops the 4 leading segments
                // (`node_modules/cesium/Build/Cesium`) to land `Workers/…`, `Assets/…`, etc.
                // directly under `/cesium`. (A bare-directory or single-`*` glob src either
                // nests the full `node_modules/…` path or skips nested subfolders.)
                targets: [
                    {
                        src: `${CESIUM_SOURCE}/{Workers,Assets,Widgets,ThirdParty}/**/*`,
                        dest: CESIUM_BASE_DIR,
                        rename: { stripBase: CESIUM_SOURCE.split('/').length },
                    },
                ],
            }),
        ],
        // Cesium resolves its runtime assets relative to this global at load time.
        define: {
            CESIUM_BASE_URL: JSON.stringify(`/${CESIUM_BASE_DIR}`),
        },
        build: {
            target: ['es2022', 'edge100', 'firefox100', 'chrome100', 'safari15.4', 'opera90'],
            assetsInlineLimit(filePath) {
                return !filePath.endsWith('.svg');
            },
        },
        resolve: {
            alias: [
                {
                    // Bare `cesium` resolves (per package `exports.import`) to `Source/Cesium.js`,
                    // an ESM entry that fans out into thousands of tiny source modules. Vite's
                    // esbuild dep-optimizer overflows its stack walking that graph
                    // ("Maximum call stack size exceeded" → `deps/cesium.js` 500). Pin the bare
                    // specifier to the pre-combined single-file ESM build instead. Exact-match
                    // regex so deep imports like `cesium/Build/Cesium/Widgets/widgets.css` pass through.
                    find: /^cesium$/,
                    replacement: fileURLToPath(new URL('./node_modules/cesium/Build/Cesium/index.js', import.meta.url)),
                },
                {
                    find: '@/icons',
                    replacement: fileURLToPath(new URL('./src/icons', import.meta.url)),
                },
                {
                    find: '@',
                    replacement: '/src',
                },
            ],
        },
        // Extra free PORTS if you need them (9199, 9889, 9521, 9836, 9713, 9407, 9491)
        server: {
            port: 9777,
        },
        preview: {
            port: 9111,
        },
    };
});
