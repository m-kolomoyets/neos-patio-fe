import CubesFloatingIcon from '@/icons/cubes-floating_100.svg?react';
import SadFaceIcon from '@/icons/sad-face_100.svg?react';
import s from './styles.module.css';

type ScenePlaceholderProps = {
    /** `error` swaps the floating cubes for a sad face when the upload failed. */
    variant?: 'loading' | 'error';
};

/** Holds the scene box while the model is in flight or the upload failed. */
export const ScenePlaceholder: React.FC<ScenePlaceholderProps> = ({ variant = 'loading' }) => {
    return (
        <div className={s.placeholder}>
            {variant === 'error' ? <SadFaceIcon className={s.icon} /> : <CubesFloatingIcon className={s.icon} />}
        </div>
    );
};
