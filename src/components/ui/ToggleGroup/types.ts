import type { Toggle as BaseToggle } from '@base-ui/react/toggle';
import type { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';

export type ToggleGroupSize = 'md' | 'sm';

export type ToggleGroupRootProps<Value extends string = string> = BaseToggleGroup.Props<Value> & {
    /**
     * The size of the toggle group items
     * @see {@link ToggleGroupSize}
     * @default 'md'
     */
    size?: ToggleGroupSize;
};

export type ToggleGroupItemProps<Value extends string = string> = BaseToggle.Props<Value>;
