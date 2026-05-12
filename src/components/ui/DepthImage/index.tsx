import type { DepthImageProps } from './types';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useDepthParallax } from './hooks/useDepthParallax';
import s from './styles.module.css';

const useReducedMotion = (): boolean => {
    const [reduced, setReduced] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = () => {
            setReduced(mq.matches);
        };
        mq.addEventListener('change', onChange);
        return () => {
            mq.removeEventListener('change', onChange);
        };
    }, []);
    return reduced;
};

export const DepthImage: React.FC<DepthImageProps> = ({
    src,
    alt = '',
    strength = 0.025,
    focus = 0.5,
    invertDepth = false,
    fallback,
    className,
    ...rest
}) => {
    const reduced = useReducedMotion();
    const { canvasRef, wrapRef, state } = useDepthParallax({
        src,
        strength,
        focus,
        invertDepth,
        enabled: !reduced,
    });

    const showCanvas = !reduced && state === 'ready';
    const fallbackNode = fallback ?? <img {...rest} src={src} alt={alt} className={s.fallback} />;

    return (
        <div ref={wrapRef} className={clsx(s.wrap, className)}>
            {fallbackNode}
            {!reduced && state !== 'failed' && (
                <canvas ref={canvasRef} className={s.canvas} data-ready={showCanvas} aria-hidden="true" />
            )}
        </div>
    );
};
