import { z } from 'zod';
import { CONTINENTS, PATIO_TYPES, SORT_KEYS } from '@/services/patios/types';

export const continentSchema = z.enum(CONTINENTS);
export const patioTypeSchema = z.enum(PATIO_TYPES);
export const sortKeySchema = z.enum(SORT_KEYS);

export const homeSearchSchema = z.object({
    q: z.string().optional(),
    continents: z.array(continentSchema).optional(),
    types: z.array(patioTypeSchema).optional(),
    sort: sortKeySchema.optional(),
});

export type HomeSearch = z.infer<typeof homeSearchSchema>;
