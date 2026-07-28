import AlertCircleIcon from '@/icons/alert-circle_24.svg?react';
import MapPinIcon from '@/icons/map-pin_24.svg?react';
import SearchIcon from '@/icons/search_24.svg?react';
import { useAccount } from 'wagmi';
import { CONTINENT_LABELS } from '@/services/patios/constants';
import { usePatioPoints } from '@/services/patios/queries';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import {
    COORDINATE_PRECISION,
    NEW_PATIO_OWNER_FALLBACK,
    NEW_PATIO_PRICE,
    NEW_PATIO_PRICE_USD,
    NEW_PATIO_STATUS,
    PATIO_SIZE_M,
} from '../../constants';
import { continentAt } from '../../utils/continentAt';
import { formatAzimuth } from '../../utils/formatAzimuth';
import { getProjectedNorthDeg } from '../../utils/getProjectedNorthDeg';
import { truncateMiddle } from '../../utils/truncateMiddle';
import { useCreatePatioMode } from '../../context/CreatePatioContext';
import { useLiveMapText } from '../../hooks/useLiveMapText';
import { useMintZoomGate } from '../../hooks/useMintZoomGate';
import { useOverlapDetected } from '../../hooks/useOverlapDetected';
import { MapPopup, MapPopupFooter, MapPopupHeader, MapPopupRow, MapPopupRows, MapPopupSeparator } from '../MapPopup';
import s from './styles.module.css';

/** `10000` → `10 000 m2`, derived from the footprint rather than hardcoded. */
const formatFootprintArea = (meters: number): string => {
    return `${(meters ** 2).toLocaleString('en-US').replaceAll(',', ' ')} m2`;
};

/** `Europe • 41.38510, 2.17340` — region omitted over open ocean, never empty. */
const formatLocation = (map: mapboxgl.Map): string => {
    const { lat, lng } = map.getCenter();
    const coordinates = `${lat.toFixed(COORDINATE_PRECISION)}, ${lng.toFixed(COORDINATE_PRECISION)}`;
    const continent = continentAt(lng, lat);

    return continent ? `${CONTINENT_LABELS[continent]} • ${coordinates}` : coordinates;
};

/**
 * Geographic azimuth of the footprint about to be minted. The center square is
 * drawn screen-upright (`useSquaresDriver`, `azimuthDeg: 0`), so rotating the map
 * turns the world under it — its world azimuth is the negated screen angle of north.
 */
const formatCenterAzimuth = (map: mapboxgl.Map): string => {
    const { lat, lng } = map.getCenter();

    return formatAzimuth(-getProjectedNorthDeg(map, lng, lat));
};

/** Split out so the popup's hooks only run while create mode is actually on. */
const NewPatioPopupCard: React.FC = () => {
    const { exitCreateMode } = useCreatePatioMode();
    const { address } = useAccount();
    const { data: points } = usePatioPoints();
    const { isZoomedEnough, flyToMintableZoom } = useMintZoomGate();
    const isOverlapping = useOverlapDetected();

    // Live camera values are written straight into their text nodes on every map
    // `render`; panning and rotating never re-render this tree.
    const locationRef = useLiveMapText<HTMLSpanElement>(formatLocation);
    const azimuthRef = useLiveMapText<HTMLSpanElement>(formatCenterAzimuth);

    // TODO(contract): the minted id comes back from the chain; until then the next
    // free id is estimated from the points already on the map.
    const idEstimate = (points?.features.length ?? 0) + 1;

    return (
        <MapPopup>
            <MapPopupHeader title="New Patio" onClose={exitCreateMode} />

            <p className={s.location}>
                <MapPinIcon className={s.pin} />
                <span ref={locationRef} />
            </p>

            <MapPopupSeparator />

            <MapPopupRows>
                <MapPopupRow label="Owner">{address ? truncateMiddle(address) : NEW_PATIO_OWNER_FALLBACK}</MapPopupRow>
                <MapPopupRow label="Size">{formatFootprintArea(PATIO_SIZE_M)}</MapPopupRow>
                <MapPopupRow label="Azimuth">
                    <span ref={azimuthRef} />
                </MapPopupRow>
                <MapPopupRow label="Price" className={s['price-row']}>
                    <span className={s.price}>
                        {NEW_PATIO_PRICE}
                        <span className={s.usd}>{NEW_PATIO_PRICE_USD}</span>
                    </span>
                </MapPopupRow>
                <MapPopupRow label="Status">
                    <span className={s['status-dot']} />
                    {NEW_PATIO_STATUS}
                </MapPopupRow>
                <MapPopupRow label="ID Estimate">#{idEstimate}</MapPopupRow>
            </MapPopupRows>

            {isOverlapping ? (
                <div className={s.warning} role="alert">
                    <AlertCircleIcon className={s['warning-icon']} />
                    <div className={s['warning-text']}>
                        <Typography variant="text-sm" className={s['warning-title']} render={<p />}>
                            Patio overlap detected
                        </Typography>
                        <Typography variant="text-sm" className={s['warning-message']} render={<span />}>
                            Rendering area might be reduced
                        </Typography>
                    </div>
                </div>
            ) : null}

            <MapPopupFooter>
                {/* Never disabled — below the gate it zooms, above it it mints. */}
                {isZoomedEnough ? (
                    <Button className={s.action} variant="brand" size="md">
                        Create Patio
                    </Button>
                ) : (
                    <Button className={s.action} variant="surface" size="md" onClick={flyToMintableZoom}>
                        <SearchIcon className={s.icon} />
                        Zoom In
                    </Button>
                )}
            </MapPopupFooter>
        </MapPopup>
    );
};

/**
 * Create mode's always-present bottom-right card: what is about to be minted,
 * live-bound to the map center, plus the zoom gate in its footer. Only one
 * bottom-right popup exists at a time — entering create mode clears the patio
 * selection, and selecting a patio leaves create mode.
 */
export const NewPatioPopup: React.FC = () => {
    const { mode } = useCreatePatioMode();

    if (mode !== 'create') return null;

    return <NewPatioPopupCard />;
};
