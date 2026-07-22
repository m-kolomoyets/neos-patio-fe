export const HOME_SCROLL_ROOT_CLASS = 'home-scroll-root';
export const HOME_SCROLL_ROOT_SELECTOR = `.${HOME_SCROLL_ROOT_CLASS}`;

// Re-exported so Home keeps its single constants entry point; the map popup reads
// the same map straight from the service layer.
export { CONTINENT_LABELS } from '@/services/patios/constants';
