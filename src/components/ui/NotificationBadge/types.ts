export type NotificationBadgeSize = 'lg' | 'md' | 'xs';

export type NotificationBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
    /**
     * The numeric value shown inside the badge.
     */
    value: number;
    /**
     * The size of the badge.
     * @see {@link NotificationBadgeSize}
     * @default 'md'
     */
    size?: NotificationBadgeSize;
};
