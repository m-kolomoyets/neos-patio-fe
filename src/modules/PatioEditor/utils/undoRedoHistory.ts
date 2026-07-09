export type HistoryStacks<T> = {
    past: T[];
    future: T[];
};

const DEFAULT_CAP = 50;

export const createEmptyHistory = <T>(): HistoryStacks<T> => {
    return { past: [], future: [] };
};

export const pushHistory = <T>(stacks: HistoryStacks<T>, prev: T, cap: number = DEFAULT_CAP): HistoryStacks<T> => {
    const past = [...stacks.past, prev];
    return {
        past: past.length > cap ? past.slice(past.length - cap) : past,
        future: [],
    };
};

export type UndoResult<T> = {
    stacks: HistoryStacks<T>;
    next: T;
};

export const undoHistory = <T>(
    stacks: HistoryStacks<T>,
    current: T,
    cap: number = DEFAULT_CAP
): UndoResult<T> | null => {
    if (stacks.past.length === 0) return null;
    const next = stacks.past[stacks.past.length - 1];
    const future = [current, ...stacks.future];
    return {
        stacks: {
            past: stacks.past.slice(0, -1),
            future: future.length > cap ? future.slice(0, cap) : future,
        },
        next,
    };
};

export const redoHistory = <T>(
    stacks: HistoryStacks<T>,
    current: T,
    cap: number = DEFAULT_CAP
): UndoResult<T> | null => {
    if (stacks.future.length === 0) return null;
    const next = stacks.future[0];
    const past = [...stacks.past, current];
    return {
        stacks: {
            past: past.length > cap ? past.slice(past.length - cap) : past,
            future: stacks.future.slice(1),
        },
        next,
    };
};

export const canUndo = <T>(stacks: HistoryStacks<T>) => {
    return stacks.past.length > 0;
};

export const canRedo = <T>(stacks: HistoryStacks<T>) => {
    return stacks.future.length > 0;
};
