import type { ChipProps } from './types';
import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import clsx from 'clsx';
import s from './styles.module.css';

export const Chip: React.FC<ChipProps> = ({ className, size = 'md', ...rest }) => {
    return (
        <BaseToggle
            className={clsx(s.wrap, 'surface-thin', 'focus-primary', className)}
            data-chip-size={size}
            {...rest}
        />
    );
};
