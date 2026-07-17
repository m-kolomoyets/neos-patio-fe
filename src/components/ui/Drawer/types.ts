import type { Drawer as BaseDrawer } from '@base-ui/react/drawer';

export type DrawerRootProps = BaseDrawer.Root.Props;
export type DrawerTriggerProps = BaseDrawer.Trigger.Props;
export type DrawerPortalProps = BaseDrawer.Portal.Props;
export type DrawerBackdropProps = BaseDrawer.Backdrop.Props;
export type DrawerViewportProps = BaseDrawer.Viewport.Props;
export type DrawerPopupProps = BaseDrawer.Popup.Props;
export type DrawerContentProps = BaseDrawer.Content.Props;
export type DrawerTitleProps = BaseDrawer.Title.Props;
export type DrawerDescriptionProps = BaseDrawer.Description.Props;
export type DrawerCloseProps = BaseDrawer.Close.Props;
export type DrawerSwipeAreaProps = BaseDrawer.SwipeArea.Props;

export type DrawerHeaderProps = React.ComponentPropsWithoutRef<'div'>;
export type DrawerBodyProps = React.ComponentPropsWithoutRef<'div'>;
export type DrawerFooterProps = React.ComponentPropsWithoutRef<'div'>;
