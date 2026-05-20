import type {
    DialogBackdropProps,
    DialogCloseProps,
    DialogDescriptionProps,
    DialogPopupProps,
    DialogPortalProps,
    DialogRootProps,
    DialogTitleProps,
    DialogTriggerProps,
} from './types';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import clsx from 'clsx';
import s from './styles.module.css';

const Root: React.FC<DialogRootProps> = (props) => {
    return <BaseDialog.Root {...props} />;
};

const Trigger: React.FC<DialogTriggerProps> = (props) => {
    return <BaseDialog.Trigger {...props} />;
};

const Portal: React.FC<DialogPortalProps> = (props) => {
    return <BaseDialog.Portal {...props} />;
};

const Backdrop: React.FC<DialogBackdropProps> = ({ className, ...rest }) => {
    return <BaseDialog.Backdrop className={clsx(s.backdrop, className)} {...rest} />;
};

const Popup: React.FC<DialogPopupProps> = ({ className, ...rest }) => {
    return <BaseDialog.Popup className={clsx(s.popup, className)} {...rest} />;
};

const Title: React.FC<DialogTitleProps> = ({ className, ...rest }) => {
    return <BaseDialog.Title className={className} {...rest} />;
};

const Description: React.FC<DialogDescriptionProps> = ({ className, ...rest }) => {
    return <BaseDialog.Description className={className} {...rest} />;
};

const Close: React.FC<DialogCloseProps> = ({ className, ...rest }) => {
    return <BaseDialog.Close className={className} {...rest} />;
};

export const Dialog = {
    Root,
    Trigger,
    Portal,
    Backdrop,
    Popup,
    Title,
    Description,
    Close,
};
