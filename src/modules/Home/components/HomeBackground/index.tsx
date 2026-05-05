import { useState } from 'react';
import { HOME_BACKGROUND_FALLBACK_SRC, HOME_BACKGROUNDS } from '../../constants';
import s from './styles.module.css';

const pickInitialSrc = (): string => {
    if (HOME_BACKGROUNDS.length === 0) {
        return HOME_BACKGROUND_FALLBACK_SRC;
    }
    const index = Math.floor(Math.random() * HOME_BACKGROUNDS.length);
    return HOME_BACKGROUNDS[index] ?? HOME_BACKGROUND_FALLBACK_SRC;
};

const initialSrc = pickInitialSrc();

const HomeBackground: React.FC = () => {
    const [src, setSrc] = useState(initialSrc);
    const [loaded, setLoaded] = useState(false);

    return (
        <img
            className={s.image}
            src={src}
            alt=""
            aria-hidden
            decoding="async"
            fetchPriority="high"
            data-loaded={loaded}
            onLoad={() => {
                void setLoaded(true);
            }}
            onError={() => {
                if (src !== HOME_BACKGROUND_FALLBACK_SRC) {
                    setLoaded(false);
                    setSrc(HOME_BACKGROUND_FALLBACK_SRC);
                }
            }}
        />
    );
};

export default HomeBackground;
