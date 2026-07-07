import { DEFAULT_AZIMUTH } from '../constants';
import { useMapCamera } from './useMapCamera';

/**
 * The center square's bounds azimuth — its real-world orientation, in degrees
 * clockwise from north — which equals the live map bearing. Read-only and
 * derived: the map drag-rotate gesture is the only thing that turns it. There is
 * no manual setter, because the square stays screen-upright while the world (and
 * thus the recorded footprint's azimuth) rotates under it.
 */
export const useAzimuth = (): number => {
    const camera = useMapCamera();

    return camera?.bearing ?? DEFAULT_AZIMUTH;
};
