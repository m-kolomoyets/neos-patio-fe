import { useEffect } from 'react';
import { useCreatePatioMode } from '../context/CreatePatioContext';

/**
 * `Escape` leaves create mode — the keyboard twin of the new-patio popup's X, so
 * a user who entered create mode by accident is never trapped. Guarded on the
 * mode, so `Escape` in view mode is left alone for anything else on the screen
 * (dialogs, the geocoder) to handle.
 */
export const useExitCreateModeOnEscape = (): void => {
    const { mode, exitCreateMode } = useCreatePatioMode();

    useEffect(
        function subscribeToEscape() {
            if (mode !== 'create') return;

            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key !== 'Escape') return;
                exitCreateMode();
            };

            window.addEventListener('keydown', handleKeyDown);

            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        },
        [mode, exitCreateMode]
    );
};
