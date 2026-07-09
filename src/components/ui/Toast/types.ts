import type {
    ToastCloseProps,
    ToastDescriptionProps,
    ToastPortalProps,
    ToastProviderProps,
    ToastRootProps,
    ToastTitleProps,
    ToastViewportProps,
} from '@base-ui/react/toast';

export type {
    ToastCloseProps,
    ToastDescriptionProps,
    ToastPortalProps,
    ToastProviderProps,
    ToastRootProps,
    ToastTitleProps,
    ToastViewportProps,
};

/**
 * Visual variant of a toast, surfaced as `data-toast-type` for styling.
 */
export type ToastType = 'success' | 'error' | 'info';

/**
 * Accepted shape for the imperative API — a bare title string or a title + description.
 */
export type ToastInput = string | { title: string; description?: string };
