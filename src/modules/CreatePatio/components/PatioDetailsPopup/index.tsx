import type { CSSProperties } from 'react';
import type { Patio } from '@/services/patios/types';
import { useState } from 'react';
import ChevronDownIcon from '@/icons/chevron-down_24.svg?react';
import DotIcon from '@/icons/dot_24.svg?react';
import MapPinIcon from '@/icons/map-pin_24.svg?react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { usePatioTransitionNavigate } from '@/hooks/usePatioTransitionNavigate';
import { CONTINENT_LABELS } from '@/services/patios/constants';
import { getPatioQueryOptions } from '@/services/patios/queries';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Typography } from '@/components/ui/Typography';
import { COORDINATE_PRECISION, INDICATOR_PALETTE, START_COORDINATE } from '../../constants';
import { STATUS_LABELS } from './constants';
import { derivePatioMapGeometry } from '../../utils/derivePatioMapGeometry';
import { formatAzimuth } from '../../utils/formatAzimuth';
import { resolveIndicatorType } from '../../utils/resolveIndicatorType';
import { formatCreatedAt } from './utils/formatCreatedAt';
import { useCreatePatioMode } from '../../context/CreatePatioContext';
import { useIsMine } from '../../hooks/useIsMine';
import { CopyLinkRow } from './components/CopyLinkRow';
import { MapPopup, MapPopupFooter, MapPopupHeader, MapPopupRow, MapPopupRows, MapPopupSeparator } from '../MapPopup';
import s from './styles.module.css';

/** Card body once the detail query has resolved. */
const PatioDetails: React.FC<{ patio: Patio }> = ({ patio }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { navigateToPatio } = usePatioTransitionNavigate();
    const { selectPatio } = useCreatePatioMode();
    // The map draws relocated fixtures, so the popup must report the geometry the
    // user is actually looking at — the same derivation the squares and the
    // hit-test use — not the fixture's real-world coordinates.
    const geometry = derivePatioMapGeometry(patio.id, START_COORDINATE);
    // Status wording and dot color both come from the map's indicator matrix, so
    // the card always reads as the square/badge the user tapped.
    const isMine = useIsMine(patio.ownerAddress);
    const indicatorType = resolveIndicatorType(patio.isPublished, isMine);
    // Someone else's unpublished patio: nothing about it is public yet, so the card
    // drops both the preview and the "View Patio" action.
    const isForeignDraft = indicatorType === 'not-published';

    const handleClose = () => {
        selectPatio(null);
    };

    return (
        <>
            <div className={s.name}>
                {isForeignDraft ? (
                    // Nothing about someone else's draft is public — not its preview and
                    // not its name; the card identifies it by id and can be dismissed.
                    <MapPopupHeader title={`ID: ${patio.id}`} onClose={handleClose} />
                ) : (
                    <>
                        <div className={s.thumbnail}>
                            <img className={s.image} src={patio.previewHighUrl} alt="" />
                        </div>
                        <Typography variant="text-md" className={s.title}>
                            {patio.name}
                        </Typography>
                    </>
                )}
                <p className={s.location}>
                    <MapPinIcon className={s.pin} />
                    <span>{CONTINENT_LABELS[patio.continent]}</span>
                    <DotIcon className={s.dot} />
                    <span>
                        {geometry.latitude.toFixed(COORDINATE_PRECISION)},{' '}
                        {geometry.longitude.toFixed(COORDINATE_PRECISION)}
                    </span>
                </p>
            </div>

            <MapPopupSeparator />

            <MapPopupRows>
                <MapPopupRow label="Owner">{patio.author}</MapPopupRow>
                <MapPopupRow label="Status">
                    {/* Same lookup the squares and badges use, so the dot in the card can
                        never disagree with the color of the indicator it was opened from. */}
                    <span
                        className={s['status-dot']}
                        style={
                            { '--status-dot-color': INDICATOR_PALETTE[indicatorType].pressedBorder } as CSSProperties
                        }
                    />
                    {/* Own element so the ellipsis has something to clip — text directly
                        inside the flex `dd` is an anonymous item `text-overflow` can't reach. */}
                    <span className={s.status} title={STATUS_LABELS[indicatorType]}>
                        {STATUS_LABELS[indicatorType]}
                    </span>
                </MapPopupRow>
                {/* A missing link renders no row at all — never an empty value. */}
                {patio.blockchainLink ? <CopyLinkRow label="Blockchain Link" value={patio.blockchainLink} /> : null}
                {patio.navigationLink ? <CopyLinkRow label="Navigation Link" value={patio.navigationLink} /> : null}
                {isExpanded ? (
                    <>
                        <MapPopupRow label="Azimuth">{formatAzimuth(geometry.azimuthDeg)}</MapPopupRow>
                        <MapPopupRow label="When created">{formatCreatedAt(patio.createdAt)}</MapPopupRow>
                    </>
                ) : null}
                <Button
                    className={s.toggle}
                    variant="link"
                    size="sm"
                    aria-expanded={isExpanded}
                    onClick={() => {
                        return setIsExpanded((expanded) => {
                            return !expanded;
                        });
                    }}
                >
                    <ChevronDownIcon className={clsx(s.chevron, isExpanded && s['chevron-up'])} />
                    {isExpanded ? 'View Less' : 'View More'}
                </Button>
            </MapPopupRows>

            {/* No footer at all rather than a disabled button. Own unpublished patios
                keep it — the owner can always walk into their own draft. */}
            {isForeignDraft ? null : (
                <MapPopupFooter>
                    <Button
                        className={s.view}
                        variant="brand"
                        size="md"
                        onClick={() => {
                            return navigateToPatio(patio);
                        }}
                    >
                        View Patio
                    </Button>
                </MapPopupFooter>
            )}
        </>
    );
};

/** Placeholder card so the popup opens with the selection, not after the fetch. */
const PatioDetailsSkeleton: React.FC = () => {
    return (
        <div className={s.skeleton}>
            <Skeleton className={s['skeleton-thumbnail']} />
            <Skeleton className={s['skeleton-title']} />
            <Skeleton className={s['skeleton-line']} />
            <Skeleton className={s['skeleton-line']} />
            <Skeleton className={s['skeleton-line']} />
            <Skeleton className={s['skeleton-action']} />
        </div>
    );
};

/** Split out so the detail query is keyed by a non-null id and remounts per patio. */
const PatioDetailsPopupCard: React.FC<{ id: string }> = ({ id }) => {
    const { data: patio } = useQuery(getPatioQueryOptions(id));

    return <MapPopup>{patio ? <PatioDetails patio={patio} /> : <PatioDetailsSkeleton />}</MapPopup>;
};

/**
 * View mode's payoff: the bottom-right card describing the selected patio. This
 * is what finally consumes `selectedPatioId` — nothing is rendered until a patio
 * is selected, and clearing the selection unmounts the whole card.
 */
export const PatioDetailsPopup: React.FC = () => {
    const { selectedPatioId } = useCreatePatioMode();

    if (!selectedPatioId) return null;

    return <PatioDetailsPopupCard id={selectedPatioId} />;
};
