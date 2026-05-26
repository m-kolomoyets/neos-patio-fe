import { Skeleton } from '@/components/ui/Skeleton';
import s from './styles.module.css';

export const PatioLibraryCardSkeleton: React.FC = () => {
    return (
        <div className={s.wrap} aria-hidden>
            <Skeleton className={s.media} />
            <div className={s.body}>
                <div className={s.top}>
                    <Skeleton className={s.name} />
                    <Skeleton className={s.author} />
                    <Skeleton className={s.id} />
                </div>
                <Skeleton className={s.footer} />
            </div>
        </div>
    );
};
