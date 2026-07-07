import { useEffect, useRef, useState } from 'react';

/** One rendered entry: the item plus whether it is animating out. */
export type Presence<T> = {
    key: string;
    item: T;
    leaving: boolean;
};

/**
 * Keeps items mounted for `leaveMs` after they leave `items`, flagged
 * `leaving: true`, so a caller can fade them out before React drops them —
 * React has no built-in exit transition. Entering/persisting items are returned
 * `leaving: false`. Re-adding a key before its timer fires cancels the purge, so
 * a flicker in the source set never orphans an element. `leaveMs: 0` purges on the
 * next tick (instant, for reduced motion). `keyOf` must be stable across renders.
 */
export const usePresence = <T>(items: T[], keyOf: (_item: T) => string, leaveMs: number): Presence<T>[] => {
    const [rendered, setRendered] = useState<Presence<T>[]>([]);
    const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

    useEffect(() => {
        const incoming = new Set(items.map(keyOf));

        setRendered((prev) => {
            const next: Presence<T>[] = [];

            // Incoming items render as present; cancel any pending purge for them.
            for (const item of items) {
                const key = keyOf(item);
                const timer = timers.current.get(key);
                if (timer) {
                    clearTimeout(timer);
                    timers.current.delete(key);
                }
                next.push({ key, item, leaving: false });
            }

            // Items that dropped out linger as `leaving` until their timer purges them.
            for (const entry of prev) {
                if (incoming.has(entry.key)) continue;
                if (!timers.current.has(entry.key)) {
                    const timer = setTimeout(() => {
                        timers.current.delete(entry.key);
                        setRendered((current) => {
                            return current.filter((candidate) => {
                                return candidate.key !== entry.key;
                            });
                        });
                    }, leaveMs);
                    timers.current.set(entry.key, timer);
                }
                next.push({ key: entry.key, item: entry.item, leaving: true });
            }

            return next;
        });
    }, [items, keyOf, leaveMs]);

    useEffect(() => {
        const pending = timers.current;

        return () => {
            for (const timer of pending.values()) clearTimeout(timer);
            pending.clear();
        };
    }, []);

    return rendered;
};
