export const modelsKeys = {
    root() {
        return ['models'] as const;
    },
    list() {
        return [...modelsKeys.root(), 'list'] as const;
    },
};
