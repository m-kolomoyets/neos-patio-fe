import { createContext, useMemo, useState } from 'react';
import { useSafeContext } from '@/hooks/useSafeContext';

/**
 * Screen mode. `view` — pan/rotate and inspect existing patios. `create` — the
 * center square is the footprint of the patio being placed.
 */
export type CreatePatioMode = 'view' | 'create';

type CreatePatioContextValue = {
    mode: CreatePatioMode;
    setMode: React.Dispatch<React.SetStateAction<CreatePatioMode>>;
    /** Id of the currently selected existing patio, or null. Selection only — no detail yet. */
    selectedPatioId: string | null;
    setSelectedPatioId: React.Dispatch<React.SetStateAction<string | null>>;
};

export const CreatePatioContext = createContext<CreatePatioContextValue | null>(null);
CreatePatioContext.displayName = 'CreatePatioContext';

/**
 * Module-level provider for the create-patio screen mode, mirroring the
 * `PatioEditor` context convention. Consumed by the header button, the squares
 * overlay, and the map click handler (later slices).
 */
export const CreatePatioProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [mode, setMode] = useState<CreatePatioMode>('view');
    const [selectedPatioId, setSelectedPatioId] = useState<string | null>(null);

    const value = useMemo(() => {
        return { mode, setMode, selectedPatioId, setSelectedPatioId };
    }, [mode, selectedPatioId]);

    return <CreatePatioContext value={value}>{children}</CreatePatioContext>;
};

export const useCreatePatioMode = (): CreatePatioContextValue => {
    return useSafeContext(CreatePatioContext)!;
};
