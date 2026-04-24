import type { Input as BaseInput } from '@base-ui/react/input';
import type { ComponentPropsWithoutRef } from 'react';

type BaseInputProps = ComponentPropsWithoutRef<typeof BaseInput>;

export type InputProps = Omit<BaseInputProps, 'className'> & {
    /**
     * Class name applied to the outer wrapper element.
     */
    className?: string;
    /**
     * JSX rendered on the left side of the input, inside the wrapper.
     */
    leftAddon?: React.ReactNode;
    /**
     * JSX rendered on the right side of the input, inside the wrapper.
     */
    rightAddon?: React.ReactNode;
    /**
     * Whether the wrapper uses a fully rounded (pill) radius.
     * @default false
     */
    isRounded?: boolean;
};
