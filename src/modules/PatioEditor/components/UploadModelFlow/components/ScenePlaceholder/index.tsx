import CubesFloatingIcon from '@/icons/cubes-floating_100.svg?react';
import s from './styles.module.css';

/** Holds the scene box while the model is in flight or the upload failed. */
export const ScenePlaceholder: React.FC = () => {
    return (
        <div className={s.placeholder}>
            <CubesFloatingIcon className={s.icon} />
        </div>
    );
};
