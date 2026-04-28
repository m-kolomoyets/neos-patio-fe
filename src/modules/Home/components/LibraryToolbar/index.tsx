import { PatioFilters } from '../PatioFilters';
import { PatioSort } from '../PatioSort';
import s from './styles.module.css';

export const LibraryToolbar: React.FC = () => {
    return (
        <div className={s.wrap}>
            <PatioFilters />
            <PatioSort />
        </div>
    );
};
