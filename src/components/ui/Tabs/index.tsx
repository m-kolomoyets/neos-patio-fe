import type { TabsIndicatorProps, TabsListProps, TabsPanelProps, TabsRootProps, TabsTabProps } from './types';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import clsx from 'clsx';
import s from './styles.module.css';

const Root: React.FC<TabsRootProps> = ({ className, ...rest }) => {
    return <BaseTabs.Root className={clsx(s.root, className)} {...rest} />;
};

const List: React.FC<TabsListProps> = ({ className, ...rest }) => {
    return <BaseTabs.List className={clsx(s.list, 'surface-thicker', className)} {...rest} />;
};

const Tab: React.FC<TabsTabProps> = ({ className, ...rest }) => {
    return <BaseTabs.Tab className={clsx(s.tab, 'focus-primary', className)} {...rest} />;
};

const Indicator: React.FC<TabsIndicatorProps> = ({ className, ...rest }) => {
    return <BaseTabs.Indicator className={clsx(s.indicator, className)} {...rest} />;
};

const Panel: React.FC<TabsPanelProps> = ({ className, ...rest }) => {
    return <BaseTabs.Panel className={clsx(s.panel, className)} {...rest} />;
};

export const Tabs = {
    Root,
    List,
    Tab,
    Indicator,
    Panel,
};
