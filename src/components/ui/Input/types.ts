import type { Input as BaseInput } from '@base-ui/react/input';

type BaseInputProps = React.ComponentPropsWithoutRef<typeof BaseInput>;

export type InputProps = BaseInputProps & {
    /**
     * Ref to the outer wrapper element. Useful when an anchor (e.g. a popover positioner)
     * needs to align to the full input wrapper rather than the native input element.
     */
    wrapperRef?: React.Ref<HTMLDivElement>;
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
