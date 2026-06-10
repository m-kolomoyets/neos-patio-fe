import type { Viewer } from 'cesium';
import { createContext, useContext, useState } from 'react';

type CesiumViewerContextValue = {
    /** The single editor `Viewer`, or `null` until the canvas has mounted it. */
    viewer: Viewer | null;
    /** Called by the canvas to register/unregister the imperatively-created Viewer. */
    registerViewer: (_viewer: Viewer | null) => void;
};

const CesiumViewerContext = createContext<CesiumViewerContextValue | null>(null);

/**
 * Holds the single editor {@link Viewer} in context. Mirrors react-map-gl's
 * `MapProvider`/`useMap()` single-instance registry shape: the provider is a
 * plain context holder (it renders no DOM), the canvas creates the Viewer
 * imperatively against its own container ref and registers it here, and overlay
 * widgets read it back via {@link useCesiumViewer}.
 */
export const CesiumViewerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [viewer, setViewer] = useState<Viewer | null>(null);

    return <CesiumViewerContext value={{ viewer, registerViewer: setViewer }}>{children}</CesiumViewerContext>;
};

/** Accessor mirroring `useMap()`: the editor Viewer, or `null` until mounted. */
export const useCesiumViewer = (): Viewer | null => {
    return useContext(CesiumViewerContext)?.viewer ?? null;
};

/** Internal: lets the canvas register/unregister the Viewer it owns. */
export const useRegisterCesiumViewer = () => {
    const ctx = useContext(CesiumViewerContext);

    if (!ctx) {
        throw new Error('useRegisterCesiumViewer must be used within a CesiumViewerProvider');
    }

    return ctx.registerViewer;
};
