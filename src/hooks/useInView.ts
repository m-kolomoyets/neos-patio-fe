import { useEffect, useRef, useState } from 'react';

type Options = IntersectionObserverInit & {
    enabled?: boolean;
};

export const useInView = <T extends Element = HTMLDivElement>({ enabled = true, ...observerInit }: Options = {}) => {
    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node || !enabled || typeof IntersectionObserver === 'undefined') {
            return;
        }

        const observer = new IntersectionObserver(([entry]) => {
            setInView(entry.isIntersecting);
        }, observerInit);

        observer.observe(node);
        return () => {
            return observer.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, observerInit.root, observerInit.rootMargin, observerInit.threshold]);

    return [ref, inView] as const;
};
