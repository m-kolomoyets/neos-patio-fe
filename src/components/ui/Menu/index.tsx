import type {
    MenuItemProps,
    MenuPopupProps,
    MenuPositionerProps,
    MenuRootProps,
    MenuSeparatorProps,
    MenuTriggerProps,
} from './types';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import clsx from 'clsx';
import s from './styles.module.css';

const Root: React.FC<MenuRootProps> = (props) => {
    return <BaseMenu.Root {...props} />;
};

const Trigger: React.FC<MenuTriggerProps> = ({ className, ...rest }) => {
    return <BaseMenu.Trigger className={clsx(s.trigger, 'focus-primary', className)} {...rest} />;
};

const Positioner: React.FC<MenuPositionerProps> = ({ className, sideOffset = 4, ...rest }) => {
    return (
        <BaseMenu.Portal>
            <BaseMenu.Positioner className={clsx(s.positioner, className)} sideOffset={sideOffset} {...rest} />
        </BaseMenu.Portal>
    );
};

const Popup: React.FC<MenuPopupProps> = ({ className, ...rest }) => {
    return <BaseMenu.Popup className={clsx(s.popup, className)} {...rest} />;
};

const Item: React.FC<MenuItemProps> = ({ className, ...rest }) => {
    return <BaseMenu.Item className={clsx(s.item, className)} {...rest} />;
};

const Separator: React.FC<MenuSeparatorProps> = ({ className, ...rest }) => {
    return <BaseMenu.Separator className={clsx(s.separator, className)} {...rest} />;
};

export const Menu = {
    Root,
    Trigger,
    Positioner,
    Popup,
    Item,
    Separator,
};
