import type { AppBackgroundProps } from './types';
import { useState } from 'react';
import { APP_BACKGROUND_FALLBACK_SRC } from '@/lib/appBackground';
import s from './styles.module.css';

/**
 * Fixed full-viewport background image. `src` is chosen by the caller
 * (`selectAppBackground` on Home, `getAppBackground` on inheriting screens) so
 * the same image is shared across screens without re-rolling.
 */
export const AppBackground: React.FC<AppBackgroundProps> = ({ src }) => {
    const [currentSrc, setCurrentSrc] = useState(src);
    const [loaded, setLoaded] = useState(false);

    return (
        <img
            className={s.image}
            src={currentSrc}
            alt=""
            aria-hidden
            decoding="async"
            fetchPriority="high"
            data-loaded={loaded}
            onLoad={() => {
                setLoaded(true);
            }}
            onError={() => {
                if (currentSrc !== APP_BACKGROUND_FALLBACK_SRC) {
                    setLoaded(false);
                    setCurrentSrc(APP_BACKGROUND_FALLBACK_SRC);
                }
            }}
        />
    );
};
