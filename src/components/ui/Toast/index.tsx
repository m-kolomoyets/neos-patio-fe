import type { ToastType } from './types';
import AlertCircleIcon from '@/icons/alert-circle_24.svg?react';
import CheckmarkCircleIcon from '@/icons/checkmark-circle-filled_24.svg?react';
import XMarkIcon from '@/icons/x-mark_24.svg?react';
import { Toast as BaseToast } from '@base-ui/react/toast';
import clsx from 'clsx';
import { toastManager } from './manager';
import s from './styles.module.css';

const TYPE_ICONS: Record<ToastType, React.FC<React.SVGProps<SVGSVGElement>>> = {
    success: CheckmarkCircleIcon,
    error: AlertCircleIcon,
    info: AlertCircleIcon,
};

const ToastList: React.FC = () => {
    const { toasts } = BaseToast.useToastManager();

    return toasts.map((toast) => {
        const type = (toast.type ?? 'info') as ToastType;
        const Icon = TYPE_ICONS[type] ?? TYPE_ICONS.info;

        return (
            <BaseToast.Root
                key={toast.id}
                toast={toast}
                className={clsx(s.toast, 'surface-thick')}
                data-toast-type={type}
            >
                <Icon className={s.icon} />
                <div className={s.content}>
                    <BaseToast.Title className={s.title} />
                    {toast.description ? <BaseToast.Description className={s.description} /> : null}
                </div>
                <BaseToast.Close className={clsx(s.close, 'focus-primary')} aria-label="Close">
                    <XMarkIcon className={s['close-icon']} />
                </BaseToast.Close>
            </BaseToast.Root>
        );
    });
};

/**
 * Mounts the global toast surface. Render once near the app root.
 * Fire toasts imperatively via the `toast` helper from this module.
 */
export const Toaster: React.FC = () => {
    return (
        <BaseToast.Provider toastManager={toastManager}>
            <BaseToast.Portal>
                <BaseToast.Viewport className={s.viewport}>
                    <ToastList />
                </BaseToast.Viewport>
            </BaseToast.Portal>
        </BaseToast.Provider>
    );
};

export { toast, toastManager } from './manager';
