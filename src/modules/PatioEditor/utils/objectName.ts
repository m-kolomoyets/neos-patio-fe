import type { PlacedObject } from '@/services/patios/types';

type NamedObject = Pick<PlacedObject, 'modelId' | 'name'>;

// Parse the trailing numeric suffix of an auto-generated name relative to its
// model name. The bare model name counts as suffix 1 (`Anvil`), `Anvil 2` as 2,
// etc. Anything not matching the pattern (e.g. a future renamed object) is 0 so
// it never influences the next counter.
const suffixOf = (name: string, modelName: string): number => {
    if (name === modelName) return 1;
    if (!name.startsWith(`${modelName} `)) return 0;
    const rest = name.slice(modelName.length + 1);
    const n = Number(rest);
    return Number.isInteger(n) && n >= 2 ? n : 0;
};

/**
 * Generate a unique, stable name for a newly added object. The first instance
 * of a model keeps the bare display name; each subsequent instance gets a
 * space-separated suffix one past the highest existing suffix among objects
 * sharing the same `modelId`, so deleting an earlier instance never reshuffles
 * names or causes a collision.
 */
export const generateObjectName = (modelName: string, modelId: string, objects: NamedObject[]): string => {
    let max = 0;
    for (const o of objects) {
        if (o.modelId !== modelId) continue;
        const suffix = suffixOf(o.name, modelName);
        if (suffix > max) max = suffix;
    }
    const next = max + 1;
    return next === 1 ? modelName : `${modelName} ${next}`;
};
