import { z } from 'zod';

export type EnvSchema = z.infer<typeof envSchema>;
export const envSchema = z.object({
    VITE_API_URL: z.string(),
    VITE_WALLET_CONNECT_PROJECT_ID: z.string(),
    VITE_ANKR_API_KEY: z.string(),
    VITE_MAPTILER_API_KEY: z.string(),
    VITE_CESIUM_ACCESS_TOKEN: z.string(),
});
