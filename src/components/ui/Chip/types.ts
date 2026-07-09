import type { Toggle as BaseToggle } from '@base-ui/react/toggle';

export type ChipSize = 'sm' | 'md' | 'lg';

export type ChipProps = BaseToggle.Props & {
    /**
     * The size of the chip
     * @see {@link ChipSize}
     * @default 'md'
     */
    size?: ChipSize;
};
