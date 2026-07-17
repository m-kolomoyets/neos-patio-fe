import type {
    DrawerBackdropProps,
    DrawerBodyProps,
    DrawerCloseProps,
    DrawerContentProps,
    DrawerDescriptionProps,
    DrawerFooterProps,
    DrawerHeaderProps,
    DrawerPopupProps,
    DrawerPortalProps,
    DrawerRootProps,
    DrawerSwipeAreaProps,
    DrawerTitleProps,
    DrawerTriggerProps,
    DrawerViewportProps,
} from './types';
import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import clsx from 'clsx';
import { Typography } from '../Typography';
import s from './styles.module.css';

const Root: React.FC<DrawerRootProps> = ({ swipeDirection = 'down', ...rest }) => {
    return <BaseDrawer.Root swipeDirection={swipeDirection} {...rest} />;
};

const Trigger: React.FC<DrawerTriggerProps> = (props) => {
    return <BaseDrawer.Trigger {...props} />;
};

const Portal: React.FC<DrawerPortalProps> = (props) => {
    return <BaseDrawer.Portal {...props} />;
};

const Backdrop: React.FC<DrawerBackdropProps> = ({ className, ...rest }) => {
    return <BaseDrawer.Backdrop className={clsx(s.backdrop, className)} {...rest} />;
};

const Viewport: React.FC<DrawerViewportProps> = ({ className, ...rest }) => {
    return <BaseDrawer.Viewport className={clsx(s.viewport, className)} {...rest} />;
};

const Popup: React.FC<DrawerPopupProps> = ({ className, ...rest }) => {
    return <BaseDrawer.Popup className={clsx(s.popup, 'surface-thin', className)} {...rest} />;
};

const Content: React.FC<DrawerContentProps> = ({ className, ...rest }) => {
    return <BaseDrawer.Content className={clsx(s.content, className)} {...rest} />;
};

const SwipeArea: React.FC<DrawerSwipeAreaProps> = ({ className, ...rest }) => {
    return <BaseDrawer.SwipeArea className={clsx(s['swipe-area'], className)} {...rest} />;
};

const Header: React.FC<DrawerHeaderProps> = ({ className, ...rest }) => {
    return <div className={clsx(s.header, className)} {...rest} />;
};

const Title: React.FC<DrawerTitleProps> = ({ className, ...rest }) => {
    return (
        <Typography variant="text-xs" render={<BaseDrawer.Title className={clsx(s.title, className)} {...rest} />} />
    );
};

const Description: React.FC<DrawerDescriptionProps> = ({ className, ...rest }) => {
    return <BaseDrawer.Description className={className} {...rest} />;
};

const Close: React.FC<DrawerCloseProps> = ({ className, ...rest }) => {
    return <BaseDrawer.Close className={className} {...rest} />;
};

const Body: React.FC<DrawerBodyProps> = ({ className, ...rest }) => {
    return <div className={clsx(s.body, className)} {...rest} />;
};

const Footer: React.FC<DrawerFooterProps> = ({ className, ...rest }) => {
    return <div className={clsx(s.footer, className)} {...rest} />;
};

export const Drawer = {
    Root,
    Trigger,
    Portal,
    Backdrop,
    Viewport,
    Popup,
    Content,
    SwipeArea,
    Header,
    Title,
    Description,
    Close,
    Body,
    Footer,
};
