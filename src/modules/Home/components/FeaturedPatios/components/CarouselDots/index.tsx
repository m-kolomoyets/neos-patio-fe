import { memo } from 'react';
import clsx from 'clsx';
import s from './styles.module.css';

type Props = {
    count: number;
    selectedIndex: number;
    onSelect: (_index: number) => void;
    className?: string;
};

const CarouselDotsImpl: React.FC<Props> = ({ count, selectedIndex, onSelect, className }) => {
    if (count <= 1) return null;
    return (
        <div className={clsx(s.wrap, className)} role="tablist" aria-label="Featured patios pagination">
            {Array.from({ length: count }).map((_, index) => {
                const active = index === selectedIndex;
                return (
                    <button
                        key={index}
                        type="button"
                        role="tab"
                        className={clsx(s.dot, 'focus-primary')}
                        data-active={active || undefined}
                        aria-label={`Go to slide ${index + 1}`}
                        title={`Go to slide ${index + 1}`}
                        aria-current={active ? 'true' : undefined}
                        aria-selected={active}
                        onClick={() => {
                            return onSelect(index);
                        }}
                    />
                );
            })}
        </div>
    );
};

export const CarouselDots = memo(CarouselDotsImpl);
