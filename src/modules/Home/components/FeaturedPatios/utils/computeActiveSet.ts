export const computeActiveSet = (
    inViewIndices: readonly number[],
    total: number,
    radius: number,
    looped: boolean
): ReadonlySet<number> => {
    if (total <= 0 || inViewIndices.length === 0) {
        return new Set<number>();
    }

    const next = new Set<number>();
    for (const idx of inViewIndices) {
        for (let offset = -radius; offset <= radius; offset++) {
            const target = idx + offset;
            if (target >= 0 && target < total) {
                next.add(target);
            } else if (looped) {
                next.add(((target % total) + total) % total);
            }
        }
    }
    return next;
};
