export const SEARCH_TRIGGER_ID = 'search-bar-trigger';

export const stateVariants = {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
};

export const stateTransition = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };
