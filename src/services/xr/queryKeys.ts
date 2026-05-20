export const xrKeys = {
    root() {
        return ['xr'] as const;
    },
    loginCode() {
        return [...xrKeys.root(), 'login-code'] as const;
    },
};
