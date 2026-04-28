import { useRender } from '@base-ui/react/use-render';

export type AspectRatioProps = useRender.ComponentProps<'div'> & {
    ratio?: number;
};
