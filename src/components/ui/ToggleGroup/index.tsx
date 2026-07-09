import type { ToggleGroupItemProps, ToggleGroupRootProps } from './types';
import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import clsx from 'clsx';
import s from './styles.module.css';

const Root = <Value extends string = string>({ className, size = 'md', ...rest }: ToggleGroupRootProps<Value>) => {
    return <BaseToggleGroup className={clsx(s.root, className)} data-toggle-group-size={size} {...rest} />;
};

const Item = <Value extends string = string>({ className, ...rest }: ToggleGroupItemProps<Value>) => {
    return <BaseToggle className={clsx(s.item, 'surface-thin', 'focus-primary', className)} {...rest} />;
};

export const ToggleGroup = {
    Root,
    Item,
};
