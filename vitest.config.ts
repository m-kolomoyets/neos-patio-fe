import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Deliberately standalone: the app's `vite.config.ts` wires Cesium static copies, SVGR,
// the eslint plugin and the React Compiler babel pass — none of which pure-function tests
// need, and all of which would slow every run down. Only the `@/*` alias is shared.
export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    test: {
        include: ['src/**/*.test.ts'],
    },
});
