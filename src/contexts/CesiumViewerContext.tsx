import type { Viewer } from 'cesium';
import { createContext, useContext, useMemo, useState } from 'react';

type CesiumViewerContextValue = {
    /** The single map `Viewer`, or `null` until the canvas has mounted it. */
    viewer: Viewer | null;
    /** Called by the canvas to register/unregister the imperatively-created Viewer. */
    registerViewer: (_viewer: Viewer | null) => void;
    /**
     * True once the scene has framed the patio and painted its first tiles (or
     * the bootstrap safety timeout elapsed). Camera-driving widgets (idle orbit)
     * gate on this so they never start while the camera is still at Cesium's
     * default whole-earth position during the async tile load.
     */
    ready: boolean;
    /** Called by the canvas to flag the scene ready / reset on teardown. */
    setReady: (_ready: boolean) => void;
};

const CesiumViewerContext = createContext<CesiumViewerContextValue | null>(null);

/**
 * Holds the single map {@link Viewer} in context. Mirrors react-map-gl's
 * `MapProvider`/`useMap()` single-instance registry shape: the provider is a
 * plain context holder (it renders no DOM), the canvas creates the Viewer
 * imperatively against its own container ref and registers it here, and overlay
 * widgets read it back via {@link useCesiumViewer}. Shared by both the editor and
 * view routes so overlay widgets (ViewCube) read one source of truth.
 */
export const CesiumViewerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [viewer, setViewer] = useState<Viewer | null>(null);
    const [ready, setReady] = useState(false);

    const value = useMemo<CesiumViewerContextValue>(() => {
        return { viewer, registerViewer: setViewer, ready, setReady };
    }, [viewer, ready]);

    return <CesiumViewerContext value={value}>{children}</CesiumViewerContext>;
};

/** Accessor mirroring `useMap()`: the map Viewer, or `null` until mounted. */
export const useCesiumViewer = (): Viewer | null => {
    return useContext(CesiumViewerContext)?.viewer ?? null;
};

/** True once the scene has framed the patio and painted — see {@link CesiumViewerContextValue.ready}. */
export const useCesiumMapReady = (): boolean => {
    return useContext(CesiumViewerContext)?.ready ?? false;
};

/** Internal: lets the canvas flag the scene ready / reset it on teardown. */
export const useSetCesiumMapReady = () => {
    const ctx = useContext(CesiumViewerContext);

    if (!ctx) {
        throw new Error('useSetCesiumMapReady must be used within a CesiumViewerProvider');
    }

    return ctx.setReady;
};

/** Internal: lets the canvas register/unregister the Viewer it owns. */
export const useRegisterCesiumViewer = () => {
    const ctx = useContext(CesiumViewerContext);

    if (!ctx) {
        throw new Error('useRegisterCesiumViewer must be used within a CesiumViewerProvider');
    }

    return ctx.registerViewer;
};
