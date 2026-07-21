import { createContext, useCallback, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useSafeContext } from '@/hooks/useSafeContext';

/**
 * Screen mode. `view` — the resting state: pan/rotate and inspect existing
 * patios, no placement chrome. `create` — an explicit, wallet-gated opt-in where
 * the center square is the footprint of the patio being placed.
 */
export type CreatePatioMode = 'view' | 'create';

type CreatePatioContextValue = {
    mode: CreatePatioMode;
    /** Id of the currently selected existing patio, or null. */
    selectedPatioId: string | null;
    /** Select an existing patio; always drops the screen back to `view` mode. */
    selectPatio: (_id: string | null) => void;
    /** Switch into create mode, clearing any patio selection (one popup at a time). */
    enterCreateMode: () => void;
    /** Leave create mode back to the resting view state. */
    exitCreateMode: () => void;
};

export const CreatePatioContext = createContext<CreatePatioContextValue | null>(null);
CreatePatioContext.displayName = 'CreatePatioContext';

/**
 * Module-level provider for the create-patio screen mode, mirroring the
 * `PatioEditor` context convention. Consumed by the header button, the squares
 * overlay, the cluster markers, and the map click handler.
 *
 * The wallet gates the whole create path: disconnecting while in create mode
 * forces the screen back to `view`.
 */
export const CreatePatioProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [requestedMode, setMode] = useState<CreatePatioMode>('view');
    const [selectedPatioId, setSelectedPatioId] = useState<string | null>(null);
    const { isConnected } = useAccount();

    const selectPatio = useCallback((id: string | null) => {
        setSelectedPatioId(id);
        // Inspecting a neighbour must never fight with placing.
        setMode('view');
    }, []);

    const enterCreateMode = useCallback(() => {
        // Only one bottom-right popup exists at a time.
        setSelectedPatioId(null);
        setMode('create');
    }, []);

    const exitCreateMode = useCallback(() => {
        setMode('view');
    }, []);

    // The wallet gates the whole create path: derived, not synced, so disconnecting
    // mid-create drops straight back to view mode with no extra render pass.
    const mode: CreatePatioMode = isConnected ? requestedMode : 'view';

    const value = useMemo(() => {
        return { mode, selectedPatioId, selectPatio, enterCreateMode, exitCreateMode };
    }, [mode, selectedPatioId, selectPatio, enterCreateMode, exitCreateMode]);

    return <CreatePatioContext value={value}>{children}</CreatePatioContext>;
};

export const useCreatePatioMode = (): CreatePatioContextValue => {
    return useSafeContext(CreatePatioContext)!;
};
