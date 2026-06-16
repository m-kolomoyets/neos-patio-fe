import type { ToastInput, ToastType } from './types';
import { Toast as BaseToast } from '@base-ui/react/toast';

/**
 * Global toast manager — lets non-React code (e.g. the query client) fire toasts.
 * Passed to the `<Toaster />` provider via the `toastManager` prop.
 */
export const toastManager = BaseToast.createToastManager();

const show = (type: ToastType, input: ToastInput) => {
    const options = typeof input === 'string' ? { title: input } : input;
    return toastManager.add({ ...options, type });
};

/**
 * Imperative toast API. Usable inside and outside React.
 * @example toast.error('Something went wrong')
 * @example toast.success({ title: 'Saved', description: 'Asset uploaded' })
 */
export const toast = {
    success: (input: ToastInput) => {
        return show('success', input);
    },
    error: (input: ToastInput) => {
        return show('error', input);
    },
    info: (input: ToastInput) => {
        return show('info', input);
    },
};
