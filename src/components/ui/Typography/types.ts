import { useRender } from '@base-ui/react/use-render';

export type TypographyVariant =
    | 'display-2xl'
    | 'display-xl'
    | 'display-lg'
    | 'display-md'
    | 'display-sm'
    | 'display-xs'
    | 'text-xl'
    | 'text-lg'
    | 'text-md'
    | 'text-sm'
    | 'text-xs';

export type TypographyProps = useRender.ComponentProps<'p'> & {
    /**
     * The variant of the typography
     * @see {@link TypographyVariant}
     * @default 'body-m'
     */
    variant?: TypographyVariant;
};
