import { BADGE_SIZE_LG, BADGE_SIZE_LG_THRESHOLD, BADGE_SIZE_SM } from '../../../constants';

/**
 * Pure count → badge-diameter (px) bucket. Below the threshold the badge is
 * small; at/above it steps up. Boundary is inclusive at `BADGE_SIZE_LG_THRESHOLD`
 * (a count of exactly 10 is large).
 */
export const getBadgeSize = (count: number): number => {
    return count >= BADGE_SIZE_LG_THRESHOLD ? BADGE_SIZE_LG : BADGE_SIZE_SM;
};
