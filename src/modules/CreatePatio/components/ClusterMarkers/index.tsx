import type { CSSProperties } from 'react';
import type { GeoJSONFeature, GeoJSONSource } from 'mapbox-gl';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Marker, useMap } from 'react-map-gl/mapbox';
import {
    BADGE_SIZE_SM,
    CREATE_PATIO_MAP_ID,
    DEFAULT_ZOOM,
    MORPH_BAND,
    PATIO_CLUSTER_SOURCE_ID,
    START_COORDINATE,
} from '../../constants';
import { prefersReducedMotion } from '../../utils/prefersReducedMotion';
import { getBadgeSize } from './utils/getBadgeSize';
import { getMorphStyle } from './utils/getMorphStyle';
import { useCreatePatioMode } from '../../context/CreatePatioContext';
import { useMorphDriver } from './hooks/useMorphDriver';
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
};

/** Key for the always-on-top orange create-patio marker (never in the source). */
const CREATE_MARKER_KEY = 'create-patio-marker';

/** Turns resolved morph geometry into the CSS custom properties the badge reads. */
const toMorphVars = (zoom: number, latitude: number, circleSize: number): MorphVars => {
    const { size, radius } = getMorphStyle(zoom, latitude, circleSize);

    return { '--morph-size': `${size}px`, '--morph-radius': `${radius}%` };
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
    // Snapshot zoom (updated on `moveend`) seeds each marker's initial morph vars
    // and gates the browse overlay off above the placement threshold.
    const [zoom, setZoom] = useState(DEFAULT_ZOOM);
    const registerMorph = useMorphDriver();

    /**
     * Tapping a cluster reads its supercluster expansion zoom, then flies the
     * camera to it centered on the cluster so the bubble breaks apart. Reduced
     * motion turns the flight into an instant jump.
     */
    const expandCluster = (marker: ClusterMarker) => {
        const map = (maps.current ?? maps[CREATE_PATIO_MAP_ID])?.getMap();
        const source = map?.getSource(PATIO_CLUSTER_SOURCE_ID) as GeoJSONSource | undefined;
        if (!map || !source) return;

        source.getClusterExpansionZoom(marker.clusterId, (error, expansionZoom) => {
            if (error || expansionZoom === null || expansionZoom === undefined) return;

            const center: [number, number] = [marker.longitude, marker.latitude];
            if (prefersReducedMotion()) {
                map.jumpTo({ center, zoom: expansionZoom });
                return;
            }
            map.flyTo({ center, zoom: expansionZoom });
        });
    };

    /** Tapping a lone patio selects it via the shared selection state (view mode). */
    const selectSingleton = (marker: SingletonMarker) => {
        setSelectedPatioId(marker.patioId);
        setMode('view');
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

            // At/above the placement threshold each patio is a geo-accurate square
            // (SquaresOverlay); drop the browse badges so the two never co-render.
            if (map.getZoom() >= MORPH_BAND.max) {
                setMarkers([]);
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
    const showCreateMarker = zoom < MORPH_BAND.max;

    return (
        <>
            {markers.map((marker) => {
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
                                data-unpublished={marker.hasUnpublished || undefined}
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

                return (
                    <Marker key={marker.key} longitude={marker.longitude} latitude={marker.latitude} anchor="center">
                        <button
                            type="button"
                            className={clsx(s.badge, s.morph)}
                            data-unpublished={marker.hasUnpublished || undefined}
                            style={toMorphVars(zoom, marker.latitude, size)}
                            ref={(el) => {
                                registerMorph(
                                    marker.key,
                                    el ? { el, latitude: marker.latitude, circleSize: size } : null
                                );
                            }}
                            aria-label="Select patio"
                            onClick={() => {
                                return selectSingleton(marker);
                            }}
                        />
                    </Marker>
                );
            })}

            {showCreateMarker && (
                <Marker
                    longitude={START_COORDINATE.longitude}
                    latitude={START_COORDINATE.latitude}
                    anchor="center"
                    style={{ zIndex: 1 }}
                >
                    <span
                        aria-hidden="true"
                        className={clsx(s.badge, s.morph)}
                        data-variant="create"
                        style={toMorphVars(zoom, START_COORDINATE.latitude, BADGE_SIZE_SM)}
                        ref={(el) => {
                            registerMorph(
                                CREATE_MARKER_KEY,
                                el ? { el, latitude: START_COORDINATE.latitude, circleSize: BADGE_SIZE_SM } : null
                            );
                        }}
                    />
                </Marker>
            )}
        </>
    );
};
