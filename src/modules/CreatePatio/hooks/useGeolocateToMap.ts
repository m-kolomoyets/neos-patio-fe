import type { Map as MapboxMap } from 'mapbox-gl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from '@/components/ui/Toast';
import { tweenCamera } from '../utils/tweenCamera';

/** Street-level zoom so the user lands on their actual property, not the block. */
const LOCATION_ZOOM = 16;

type GeolocateStatus = 'idle' | 'loading';

type UseGeolocateToMap = {
    /** Request the current position and fly the camera to it. No-op while loading. */
    request: () => void;
    /** `'loading'` while a position is being fetched, else `'idle'`. */
    status: GeolocateStatus;
    /** `true` when geolocation permission is denied — used to disable the button. */
    isDenied: boolean;
};

/**
 * Encapsulates geolocation → `flyTo`. Reads live permission state via the
 * Permissions API (so the button reactively disables on deny), tracks a loading
 * state while fetching, and on success flies to street level. Timeout /
 * position-unavailable surfaces a Toast and returns to idle. Reduced motion
 * makes the move instant.
 */
export const useGeolocateToMap = (map: MapboxMap | undefined): UseGeolocateToMap => {
    const [status, setStatus] = useState<GeolocateStatus>('idle');
    const [isDenied, setIsDenied] = useState(false);

    useEffect(function subscribeToPermission() {
        if (!navigator.permissions?.query) {
            return;
        }

        let permission: PermissionStatus | undefined;

        const sync = () => {
            setIsDenied(permission?.state === 'denied');
        };

        navigator.permissions
            .query({ name: 'geolocation' })
            .then((result) => {
                permission = result;
                permission.addEventListener('change', sync);
                sync();
            })
            .catch(() => {
                // Permissions API unsupported for geolocation — leave button enabled.
            });

        return function cleanup() {
            permission?.removeEventListener('change', sync);
        };
    }, []);

    const request = useCallback(
        function request() {
            if (!map || status === 'loading') {
                return;
            }

            setStatus('loading');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setStatus('idle');
                    // `tweenCamera` (per-frame `jumpTo`), not `flyTo`: the eased
                    // flight builds a non-invertible matrix on this pitch-0 globe.
                    tweenCamera(map, {
                        center: [position.coords.longitude, position.coords.latitude],
                        zoom: LOCATION_ZOOM,
                    });
                },
                (error) => {
                    setStatus('idle');
                    // Denied is reflected by the Permissions API subscription; only
                    // surface the transient failures here.
                    if (error.code !== error.PERMISSION_DENIED) {
                        toast.error('Location unavailable');
                    }
                }
            );
        },
        [map, status]
    );

    return { request, status, isDenied };
};
