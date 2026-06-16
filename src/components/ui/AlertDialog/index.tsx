import type {
    AlertDialogBackdropProps,
    AlertDialogCloseProps,
    AlertDialogDescriptionProps,
    AlertDialogPopupProps,
    AlertDialogPortalProps,
    AlertDialogRootProps,
    AlertDialogTitleProps,
    AlertDialogTriggerProps,
} from './types';
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import clsx from 'clsx';
import s from './styles.module.css';

const Root: React.FC<AlertDialogRootProps> = (props) => {
    return <BaseAlertDialog.Root {...props} />;
};

const Trigger: React.FC<AlertDialogTriggerProps> = (props) => {
    return <BaseAlertDialog.Trigger {...props} />;
};

const Portal: React.FC<AlertDialogPortalProps> = (props) => {
    return <BaseAlertDialog.Portal {...props} />;
};

const Backdrop: React.FC<AlertDialogBackdropProps> = ({ className, ...rest }) => {
    return <BaseAlertDialog.Backdrop className={clsx(s.backdrop, className)} {...rest} />;
};

const Popup: React.FC<AlertDialogPopupProps> = ({ className, ...rest }) => {
    return <BaseAlertDialog.Popup className={clsx(s.popup, className)} {...rest} />;
};

const Title: React.FC<AlertDialogTitleProps> = ({ className, ...rest }) => {
    return <BaseAlertDialog.Title className={className} {...rest} />;
};

const Description: React.FC<AlertDialogDescriptionProps> = ({ className, ...rest }) => {
    return <BaseAlertDialog.Description className={className} {...rest} />;
};

const Close: React.FC<AlertDialogCloseProps> = ({ className, ...rest }) => {
    return <BaseAlertDialog.Close className={className} {...rest} />;
};

export const AlertDialog = {
    Root,
    Trigger,
    Portal,
    Backdrop,
    Popup,
    Title,
    Description,
    Close,
};
