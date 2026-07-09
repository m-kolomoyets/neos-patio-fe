import type {
    TooltipArrowProps,
    TooltipPopupBaseProps,
    TooltipPopupProps,
    TooltipPortalProps,
    TooltipPositionerProps,
    TooltipProviderProps,
    TooltipRootProps,
    TooltipTriggerProps,
} from './types';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import clsx from 'clsx';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

const Provider: React.FC<TooltipProviderProps> = (props) => {
    return <BaseTooltip.Provider {...props} />;
};

const Root: React.FC<TooltipRootProps> = (props) => {
    return <BaseTooltip.Root {...props} />;
};

const Trigger: React.FC<TooltipTriggerProps> = ({ className, ...rest }) => {
    return <BaseTooltip.Trigger className={clsx(className)} {...rest} />;
};

const Portal: React.FC<TooltipPortalProps> = (props) => {
    return <BaseTooltip.Portal {...props} />;
};

const Positioner: React.FC<TooltipPositionerProps> = ({ className, ...rest }) => {
    return <BaseTooltip.Positioner className={clsx(s.positioner, className)} {...rest} />;
};

const PopupBase: React.FC<TooltipPopupBaseProps> = ({ className, ...rest }) => {
    return <BaseTooltip.Popup className={clsx(s.popup, className)} {...rest} />;
};

const Arrow: React.FC<TooltipArrowProps> = ({ className, ...rest }) => {
    return <BaseTooltip.Arrow className={clsx(s.arrow, className)} {...rest} />;
};

const Popup: React.FC<TooltipPopupProps> = ({
    title,
    description,
    popupProps,
    portalProps,
    sideOffset = 8,
    className,
    ...positionerRest
}) => {
    return (
        <BaseTooltip.Portal {...portalProps}>
            <BaseTooltip.Positioner
                sideOffset={sideOffset}
                {...positionerRest}
                className={clsx(s.positioner, className)}
            >
                <BaseTooltip.Popup {...popupProps} className={clsx(s.popup, popupProps?.className)}>
                    <BaseTooltip.Arrow className={s.arrow} />
                    {title ? (
                        <Typography variant="text-xs" className={s.title}>
                            {title}
                        </Typography>
                    ) : null}
                    <Typography variant="text-xs" render={<div />} className={s.description}>
                        {description}
                    </Typography>
                </BaseTooltip.Popup>
            </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
    );
};

export const Tooltip = {
    Provider,
    Root,
    Trigger,
    Portal,
    Positioner,
    PopupBase,
    Arrow,
    Popup,
};
