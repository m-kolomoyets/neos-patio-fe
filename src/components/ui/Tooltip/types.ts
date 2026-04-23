import type { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { ReactNode } from 'react';

export type TooltipProviderProps = BaseTooltip.Provider.Props;
export type TooltipRootProps = BaseTooltip.Root.Props;
export type TooltipTriggerProps = BaseTooltip.Trigger.Props;
export type TooltipPortalProps = BaseTooltip.Portal.Props;
export type TooltipPositionerProps = BaseTooltip.Positioner.Props;
export type TooltipPopupBaseProps = BaseTooltip.Popup.Props;
export type TooltipArrowProps = BaseTooltip.Arrow.Props;

export type TooltipPopupProps = Omit<TooltipPositionerProps, 'children'> & {
    /**
     * Optional heading rendered above the description.
     * Uses Typography `text-xs` at 500 weight.
     */
    title?: ReactNode;
    /**
     * Required tooltip content. Accepts any JSX; defaults to Typography `text-xs`.
     */
    description: ReactNode;
    /**
     * Props forwarded to the underlying Base UI Popup element.
     */
    popupProps?: Omit<TooltipPopupBaseProps, 'children'>;
    /**
     * Props forwarded to the underlying Base UI Portal.
     */
    portalProps?: TooltipPortalProps;
};
