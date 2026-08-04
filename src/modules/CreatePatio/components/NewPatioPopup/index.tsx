import AlertCircleIcon from '@/icons/alert-circle_24.svg?react';
import MapPinIcon from '@/icons/map-pin_24.svg?react';
import SearchIcon from '@/icons/search_24.svg?react';
import { useAccount } from 'wagmi';
import { usePatioPoints } from '@/services/patios/queries';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import {
    NEW_PATIO_OWNER_FALLBACK,
    NEW_PATIO_PRICE,
    NEW_PATIO_PRICE_USD,
    NEW_PATIO_STATUS,
    PATIO_SIZE_M,
} from '../../constants';
import { truncateMiddle } from '../../utils/truncateMiddle';
import { formatCenterAzimuth } from './utils/formatCenterAzimuth';
import { formatFootprintArea } from './utils/formatFootprintArea';
import { formatLocation } from './utils/formatLocation';
import { useCreatePatioMode } from '../../context/CreatePatioContext';
import { useLiveMapText } from '../../hooks/useLiveMapText';
import { useMintZoomGate } from '../../hooks/useMintZoomGate';
import { useOverlapDetected } from '../../hooks/useOverlapDetected';
import { MapPopup, MapPopupFooter, MapPopupHeader, MapPopupRow, MapPopupRows, MapPopupSeparator } from '../MapPopup';
import s from './styles.module.css';

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
