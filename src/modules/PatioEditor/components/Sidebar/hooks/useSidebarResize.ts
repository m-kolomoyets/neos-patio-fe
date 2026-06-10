import { useCallback, useEffect, useRef, useState } from 'react';
import {
    SIDEBAR_DEFAULT_WIDTH,
    SIDEBAR_KEYBOARD_STEP,
    SIDEBAR_MAX_WIDTH,
    SIDEBAR_MIN_WIDTH,
    SIDEBAR_WIDTH_STORAGE_KEY,
} from '../constants';

const clampWidth = (value: number): number => {
    return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, value));
};

/** Read the persisted width, clamping into range and falling back to default. */
const readStoredWidth = (): number => {
    try {
        const raw = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
        if (!raw) return SIDEBAR_DEFAULT_WIDTH;
        const parsed = Number.parseFloat(raw);
        return Number.isFinite(parsed) ? clampWidth(parsed) : SIDEBAR_DEFAULT_WIDTH;
    } catch {
        return SIDEBAR_DEFAULT_WIDTH;
    }
};

const persistWidth = (width: number): void => {
    try {
        localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(width));
    } catch {
        // Storage unavailable (private mode / quota) — width stays in memory only.
    }
};

/**
 * Drag/keyboard resize for the sidebar, persisted to localStorage.
 *
 * Width lives in React state and updates live on every pointer move; storage is
 * written only on release (`pointerup`) to avoid thrashing. The stored value is
 * clamped to [{@link SIDEBAR_MIN_WIDTH}, {@link SIDEBAR_MAX_WIDTH}] on read.
 *
 * Returns the live `width` plus `handleProps` to spread onto the resize handle:
 * pointer drag, arrow-key nudges, and double-click reset to default.
 */
const keyDelta = (key: string): number => {
    if (key === 'ArrowRight') return SIDEBAR_KEYBOARD_STEP;
    if (key === 'ArrowLeft') return -SIDEBAR_KEYBOARD_STEP;
    return 0;
};

export const useSidebarResize = () => {
    const [width, setWidth] = useState<number>(readStoredWidth);
    // True while a pointer drag is in flight; used to suppress transitions that
    // would otherwise lag behind the live width (e.g. the tabs indicator).
    const [isResizing, setIsResizing] = useState(false);
    // Latest width, synced after each render so drag listeners read it without re-binding.
    const widthRef = useRef(width);
    useEffect(() => {
        widthRef.current = width;
    }, [width]);
    // Detaches the active drag's global listeners; set while a drag is in flight.
    const endDragRef = useRef<(() => void) | null>(null);

    const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        const pointerX = event.clientX;
        const startWidth = widthRef.current;

        const onMove = (moveEvent: PointerEvent) => {
            setWidth(clampWidth(startWidth + (moveEvent.clientX - pointerX)));
        };
        const onUp = () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            document.body.style.removeProperty('cursor');
            document.body.style.removeProperty('user-select');
            endDragRef.current = null;
            setIsResizing(false);
            persistWidth(widthRef.current);
        };

        endDragRef.current = onUp;
        setIsResizing(true);
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        const delta = keyDelta(event.key);
        if (!delta) return;
        event.preventDefault();
        setWidth((current) => {
            const next = clampWidth(current + delta);
            persistWidth(next);
            return next;
        });
    }, []);

    const onDoubleClick = useCallback(() => {
        setWidth(SIDEBAR_DEFAULT_WIDTH);
        persistWidth(SIDEBAR_DEFAULT_WIDTH);
    }, []);

    // Detach global listeners if the component unmounts mid-drag.
    useEffect(() => {
        return () => {
            endDragRef.current?.();
        };
    }, []);

    return {
        width,
        isResizing,
        handleProps: {
            'aria-valuenow': width,
            'aria-valuemin': SIDEBAR_MIN_WIDTH,
            'aria-valuemax': SIDEBAR_MAX_WIDTH,
            onPointerDown,
            onKeyDown,
            onDoubleClick,
        },
    };
};
