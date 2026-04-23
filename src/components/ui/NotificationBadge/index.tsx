import type { NotificationBadgeProps } from './types';
import clsx from 'clsx';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ className, value, size = 'md', ...rest }) => {
    return (
        <span {...rest} className={clsx(s.wrap, className)} data-notification-badge-size={size}>
            {size === 'xs' ? null : (
                <Typography render={<span />} variant={size === 'lg' ? 'text-md' : 'text-sm'} className={s.label}>
                    {value}
                </Typography>
            )}
        </span>
    );
};
