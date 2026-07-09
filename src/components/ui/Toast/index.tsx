import type { ToastType } from './types';
import AlertCircleIcon from '@/icons/alert-circle_24.svg?react';
import CheckmarkIcon from '@/icons/checkmark_24.svg?react';
import { Toast as BaseToast } from '@base-ui/react/toast';
import { toastManager } from './manager';
import s from './styles.module.css';

const TYPE_ICONS: Record<ToastType, React.FC<React.SVGProps<SVGSVGElement>>> = {
    success: CheckmarkIcon,
    error: AlertCircleIcon,
    info: AlertCircleIcon,
};

const ToastList: React.FC = () => {
    const { toasts } = BaseToast.useToastManager();

    return toasts.map((toast) => {
        const type = (toast.type ?? 'info') as ToastType;
        const Icon = TYPE_ICONS[type] ?? TYPE_ICONS.info;

        return (
            <BaseToast.Root key={toast.id} toast={toast} className={s.toast} data-toast-type={type}>
                <Icon className={s.icon} />
                <BaseToast.Title className={s.title} />
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
