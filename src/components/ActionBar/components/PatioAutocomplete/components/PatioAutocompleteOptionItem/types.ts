import { useRender } from '@base-ui/react/use-render';

export type PatioAutocompleteOptionItemProps = useRender.ComponentProps<'div'> & {
    name: string;
    country: string;
};
