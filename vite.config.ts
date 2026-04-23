import { fileURLToPath } from 'node:url';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint2';
import { createHtmlPlugin } from 'vite-plugin-html';
import svgr from 'vite-plugin-svgr';

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
        ],
        build: {
            target: ['es2022', 'edge100', 'firefox100', 'chrome100', 'safari15.4', 'opera90'],
            assetsInlineLimit(filePath) {
                return !filePath.endsWith('.svg');
            },
        },
        resolve: {
            alias: [
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
