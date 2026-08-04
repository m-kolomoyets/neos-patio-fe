import type { IndicatorType } from '../../types';

/**
 * Status wording per indicator type. Ownership is carried by the dot color alone
 * (orange / yellow), never repeated in the text — the wording only ever states
 * whether the patio is published.
 */
export const STATUS_LABELS: Record<IndicatorType, string> = {
    owned: 'Published',
    'not-published': 'Unpublished',
    'owned-and-published': 'Published',
    'owned-and-not-published': 'Unpublished',
    // Unreachable: `target` is the create-mode cursor, never a saved patio.
    target: 'Draft',
};
