import { useState } from 'react';
import { DEFAULT_AZIMUTH } from '../constants';

/**
 * Holds the center square's azimuth (degrees, clockwise from north). The setter
 * is exposed for a future control panel to drive rotation; no UI consumes it in
 * this slice.
 */
export const useAzimuth = () => {
    const [azimuth, setAzimuth] = useState(DEFAULT_AZIMUTH);

    return { azimuth, setAzimuth };
};
