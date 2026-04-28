import { ButtonProps as BaseButtonProps } from '@base-ui/react';

export type ButtonVariant = 'brand' | 'surface' | 'link';
export type ButtonSize = 'xl' | 'lg' | 'md' | 'sm';

export type ButtonProps = BaseButtonProps & {
    /**
     * The variant of the button
     * @see {@link ButtonVariant}
     * @default 'primary'
     */
    variant?: ButtonVariant;
    /**
     * The size of the button
     * @see {@link ButtonSize}
     * @default 'big'
     */
    size?: ButtonSize;
    /**
     * Whether the button is an icon button
     * @default false
     */
    isIcon?: boolean;
    /**
     * Whether the button is loading
     * @default false
     */
    isLoading?: boolean;
};
