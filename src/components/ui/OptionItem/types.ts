import { useRender } from '@base-ui/react/use-render';

export type OptionItemVariant = 'default' | 'surface';

export type OptionItemProps = useRender.ComponentProps<'div'> & {
    /**
     * Visual variant.
     * - `default`: plain background highlight on checked/hover.
     * - `surface`: `surface-thin` background when checked, Button-surface gradient on hover-when-checked.
     * @default 'default'
     */
    variant?: OptionItemVariant;
    /**
     * Content rendered in the reserved left slot (icon, avatar, swatch, etc.).
     * The slot always reserves space so items align vertically across a list.
     */
    leftAddon?: React.ReactNode;
    /**
     * Optional override for the checked visual state. When omitted, CSS reads
     * `data-selected` / `data-checked` emitted by the Base UI render target.
     */
    checked?: boolean;
    isWithChecked?: boolean;
};
