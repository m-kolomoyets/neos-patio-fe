import type { CSSProperties } from 'react';
import type { GeoJSONFeature, GeoJSONSource } from 'mapbox-gl';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Marker, useMap } from 'react-map-gl/mapbox';
import {
    BADGE_SIZE_SM,
    CLUSTER_EXPAND_ZOOM_PADDING,
    CREATE_PATIO_MAP_ID,
    DEFAULT_ZOOM,
    PATIO_CLUSTER_SOURCE_ID,
    SINGLE_PATIO_VIEW_ZOOM,
    START_COORDINATE,
} from '../../constants';
import { derivePatioMapGeometry } from '../../utils/derivePatioMapGeometry';
import { getCrossfadeOpacity } from '../../utils/getCrossfadeOpacity';
import { getProjectedNorthDeg } from '../../utils/getProjectedNorthDeg';
import { prefersReducedMotion } from '../../utils/prefersReducedMotion';
import { getBadgeSize } from './utils/getBadgeSize';
import { getMorphStyle } from './utils/getMorphStyle';
import { useCreatePatioMode } from '../../context/CreatePatioContext';
import { useCrossfadeDriver } from '../../hooks/useCrossfadeDriver';
import { usePlacementEnabled } from '../../hooks/usePlacementEnabled';
import { useMorphDriver } from './hooks/useMorphDriver';
import { usePresence } from './hooks/usePresence';
import s from './styles.module.css';

type BaseMarker = {
    /** Stable dedupe/render key: cluster id or patio id. */
    key: string;
    longitude: number;
    latitude: number;
    /** Member count: cluster size, or `1` for a lone patio. */
    count: number;
    /** Blue treatment: cluster holds unpublished work, or the lone patio is unpublished. */
    hasUnpublished: boolean;
};

/** A count bubble; taps fly the camera down to where it breaks apart. */
type ClusterMarker = BaseMarker & { cluster: true; clusterId: number };
/** A lone patio; taps select it via the shared selection path. */
type SingletonMarker = BaseMarker & { cluster: false; patioId: string };
type PatioMarker = ClusterMarker | SingletonMarker;

/** CSS custom properties the morph driver / initial render write onto a marker. */
type MorphVars = CSSProperties & {
    '--morph-size': string;
    '--morph-radius': string;
    '--morph-text-opacity': string;
    '--morph-rotate': string;
    '--crossfade-opacity': string;
};

/** Key for the always-on-top orange create-patio marker (never in the source). */
const CREATE_MARKER_KEY = 'create-patio-marker';

/** Stable key accessor for `usePresence` (must not change identity per render). */
const markerKey = (marker: PatioMarker) => {
    return marker.key;
};

/** How long an outgoing marker lingers to cross-fade out; matches `badge-fade-in`. */
const BADGE_FADE_MS = 220;

/** Fly (or, with reduced motion, jump) the camera to a center + zoom. */
const flyToView = (map: mapboxgl.Map, center: [number, number], zoom: number) => {
    if (prefersReducedMotion()) {
        map.jumpTo({ center, zoom });
        return;
    }
    map.flyTo({ center, zoom });
};

/** Turns resolved morph geometry into the CSS custom properties the badge reads. */
const toMorphVars = (zoom: number, latitude: number, circleSize: number, rotateDeg: number): MorphVars => {
    const { size, radius, progress } = getMorphStyle(zoom, latitude, circleSize);

    return {
        '--morph-size': `${size}px`,
        '--morph-radius': `${radius}px`,
        '--morph-text-opacity': `${progress}`,
        '--morph-rotate': `${rotateDeg}deg`,
        // Seed the browse side of the cross-fade so the first paint is already at the
        // right opacity; the crossfade driver then updates it every frame.
        '--crossfade-opacity': `${getCrossfadeOpacity(zoom, 'browse')}`,
    };
};

/** Narrows one queried source feature into a renderable marker, or `null` to skip. */
const toMarker = (feature: GeoJSONFeature): PatioMarker | null => {
    if (feature.geometry.type !== 'Point') return null;

    const [longitude, latitude] = feature.geometry.coordinates;
    const props = feature.properties ?? {};

    if (props.cluster) {
        return {
            cluster: true,
            clusterId: props.cluster_id,
            key: `cluster-${props.cluster_id}`,
            longitude,
            latitude,
            count: props.point_count,
            hasUnpublished: Boolean(props.hasUnpublished),
        };
    }

    return {
        cluster: false,
        patioId: String(props.id),
        key: `patio-${props.id}`,
        longitude,
        latitude,
        count: 1,
        hasUnpublished: !props.isPublished,
    };
};

/**
 * DOM badges for the clustering source. Derives its set from the features
 * currently rendered in the viewport (`querySourceFeatures`), refreshed on
 * `moveend` — never the full patio set. Clusters render a counted badge; lone
 * patios render the same badge and, across the morph band (z14–17), literally
 * tween from a geo-accurate square into a fixed circle. `SquaresOverlay` owns the
 * geo squares at z ≥ 17, so this hides individual markers there — one
 * representation of a patio at any zoom. The morph itself is driven per-frame via
 * CSS custom properties (`useMorphDriver`), not React re-renders.
 */
export const ClusterMarkers: React.FC = () => {
    const maps = useMap();
    const { setMode, setSelectedPatioId } = useCreatePatioMode();
    const [markers, setMarkers] = useState<PatioMarker[]>([]);
    // Snapshot zoom (updated on `moveend`) seeds each marker's initial morph size;
    // the driver then updates size and rotation per frame.
    const [zoom, setZoom] = useState(DEFAULT_ZOOM);
    // Live map handle for seeding each marker's initial world-pinned rotation.
    const seedMap = (maps.current ?? maps[CREATE_PATIO_MAP_ID])?.getMap();
    const registerMorph = useMorphDriver();
    // Browse side of the browse ⇆ placement cross-fade; the same driver feeds the
    // SVG squares (placement side) so both layers fade in the same frame.
    const registerCrossfade = useCrossfadeDriver();
    // Live threshold gate (flips only when crossing `PLACEMENT_MIN_ZOOM`), shared
    // with `SquaresOverlay` so the create marker and the center square swap in the
    // same frame — no gap.
    const placementEnabled = usePlacementEnabled();

    /**
     * Tapping a cluster reads its supercluster expansion zoom, then flies the
     * camera a bit past it (so the bubble breaks apart with room to spare),
     * centered on the cluster. Reduced motion turns the flight into an instant jump.
     */
    const expandCluster = (marker: ClusterMarker) => {
        const map = (maps.current ?? maps[CREATE_PATIO_MAP_ID])?.getMap();
        const source = map?.getSource(PATIO_CLUSTER_SOURCE_ID) as GeoJSONSource | undefined;
        if (!map || !source) return;

        source.getClusterExpansionZoom(marker.clusterId, (error, expansionZoom) => {
            if (error || expansionZoom === null || expansionZoom === undefined) return;

            flyToView(map, [marker.longitude, marker.latitude], expansionZoom + CLUSTER_EXPAND_ZOOM_PADDING);
        });
    };

    /**
     * Tapping a lone patio selects it and flies in close enough to read its
     * 100×100m square (above the placement threshold), so a "cluster of one"
     * resolves straight to its footprint rather than staying a distant bubble.
     */
    const selectSingleton = (marker: SingletonMarker) => {
        setSelectedPatioId(marker.patioId);
        setMode('view');

        const map = (maps.current ?? maps[CREATE_PATIO_MAP_ID])?.getMap();
        if (map) flyToView(map, [marker.longitude, marker.latitude], SINGLE_PATIO_VIEW_ZOOM);
    };

    useEffect(() => {
        // `current` is set inside the `<Map>` subtree; fall back to the registry id.
        const map = (maps.current ?? maps[CREATE_PATIO_MAP_ID])?.getMap();
        if (!map) return;

        const refresh = () => {
            setZoom(map.getZoom());

            if (!map.getSource(PATIO_CLUSTER_SOURCE_ID) || !map.isSourceLoaded(PATIO_CLUSTER_SOURCE_ID)) {
                return;
            }

            // querySourceFeatures returns tile-local copies, so the same cluster can
            // appear on multiple tiles — dedupe by key before rendering.
            const byKey = new Map<string, PatioMarker>();
            for (const feature of map.querySourceFeatures(PATIO_CLUSTER_SOURCE_ID)) {
                const marker = toMarker(feature);
                if (marker) byKey.set(marker.key, marker);
            }
            setMarkers([...byKey.values()]);
        };

        // The source is empty until its data finishes loading; catch that first fill.
        const onSourceData = (event: mapboxgl.MapSourceDataEvent) => {
            if (event.sourceId === PATIO_CLUSTER_SOURCE_ID && event.isSourceLoaded) refresh();
        };

        refresh();
        map.on('moveend', refresh);
        map.on('sourcedata', onSourceData);

        return () => {
            map.off('moveend', refresh);
            map.off('sourcedata', onSourceData);
        };
    }, [maps]);

    // Below the placement threshold the orange create-patio marker morphs too, as
    // its own always-on-top overlay — never sourced from (or merged into) clusters.
    const showCreateMarker = !placementEnabled;

    // Keep outgoing markers mounted through a fade-out so the cluster ⇆ patio swap
    // cross-fades symmetrically. Reduced motion purges instantly (leaveMs 0).
    const leaveMs = prefersReducedMotion() ? 0 : BADGE_FADE_MS;
    const present = usePresence(markers, markerKey, leaveMs);

    return (
        <>
            {/* At/above the placement threshold each patio is a geo-accurate square
                (SquaresOverlay); hide the browse badges — same live gate as the center
                square so the two swap in one frame, never co-rendering and never gapping. */}
            {!placementEnabled &&
                present.map(({ item: marker, leaving }) => {
                    const size = getBadgeSize(marker.count);

                    if (marker.cluster) {
                        return (
                            <Marker
                                key={marker.key}
                                longitude={marker.longitude}
                                latitude={marker.latitude}
                                anchor="center"
                            >
                                <button
                                    type="button"
                                    className={s.badge}
                                    data-leaving={leaving || undefined}
                                    style={{ width: size, height: size }}
                                    aria-label={`Zoom into cluster of ${marker.count} patios`}
                                    onClick={() => {
                                        return expandCluster(marker);
                                    }}
                                >
                                    {marker.count}
                                </button>
                            </Marker>
                        );
                    }

                    // World azimuth of this patio's footprint, so its square end matches
                    // the geo square in SquaresOverlay. Seed the world-pinned screen
                    // rotation from the projection; the driver refreshes it per frame.
                    const azimuthDeg = derivePatioMapGeometry(marker.patioId, START_COORDINATE).azimuthDeg;
                    const seedRotate =
                        azimuthDeg + (seedMap ? getProjectedNorthDeg(seedMap, marker.longitude, marker.latitude) : 0);

                    return (
                        <Marker
                            key={marker.key}
                            longitude={marker.longitude}
                            latitude={marker.latitude}
                            anchor="center"
                        >
                            <button
                                type="button"
                                className={clsx(s.badge, s.morph)}
                                data-leaving={leaving || undefined}
                                style={toMorphVars(zoom, marker.latitude, size, seedRotate)}
                                ref={(el) => {
                                    registerMorph(
                                        marker.key,
                                        el
                                            ? {
                                                  el,
                                                  longitude: marker.longitude,
                                                  latitude: marker.latitude,
                                                  circleSize: size,
                                                  azimuthDeg,
                                              }
                                            : null
                                    );
                                    registerCrossfade(marker.key, el ? { el, layer: 'browse' } : null);
                                }}
                                aria-label="Select patio"
                                onClick={() => {
                                    return selectSingleton(marker);
                                }}
                            >
                                {/* Count fades in as the square morphs to a circle (hidden as a square). */}
                                <span className={s.count}>{marker.count}</span>
                            </button>
                        </Marker>
                    );
                })}

            {/* Create marker: screen-centered overlay (not geo-anchored), so it stays
                dead-center at every zoom below the placement band. */}
            {showCreateMarker && (
                <div className={s['create-overlay']} aria-hidden="true">
                    <span
                        className={clsx(s.badge, s.morph)}
                        data-variant="create"
                        style={toMorphVars(
                            zoom,
                            seedMap?.getCenter().lat ?? START_COORDINATE.latitude,
                            BADGE_SIZE_SM,
                            0
                        )}
                        ref={(el) => {
                            registerMorph(
                                CREATE_MARKER_KEY,
                                el
                                    ? {
                                          el,
                                          longitude: START_COORDINATE.longitude,
                                          latitude: START_COORDINATE.latitude,
                                          circleSize: BADGE_SIZE_SM,
                                          centered: true,
                                      }
                                    : null
                            );
                            registerCrossfade(CREATE_MARKER_KEY, el ? { el, layer: 'browse' } : null);
                        }}
                    />
                </div>
            )}
        </>
    );
};
