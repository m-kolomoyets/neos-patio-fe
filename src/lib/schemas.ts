import { z } from 'zod';

export type EnvSchema = z.infer<typeof envSchema>;
export const envSchema = z.object({
    VITE_API_URL: z.string(),
    VITE_FEATURED_CURSOR_SCRUB: z.union([z.literal('true'), z.literal('false'), z.undefined()]).transform((v) => {
        return v === 'true';
    }),
});
