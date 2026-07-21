import { useRef } from 'react';
import PlusIcon from '@/icons/plus_24.svg?react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useAccountEffect } from 'wagmi';
import { Button } from '@/components/ui/Button';
import { useCreatePatioMode } from '../../../../context/CreatePatioContext';
import s from './styles.module.css';

/**
 * The only entry point into create mode. Rendered by the header left of the
 * geocoder search, unconditionally enabled and never zoom-gated — the too-far-out
 * case is handled by the new-patio popup footer, not here.
 *
 * Wallet-gated: pressing it while disconnected opens the RainbowKit connect modal
 * instead of switching mode, and enters create mode once the connection lands.
 * Dismissing the modal does nothing.
 */
export const CreatePatioButton: React.FC = () => {
    const { enterCreateMode } = useCreatePatioMode();
    const { isConnected } = useAccount();
    const { openConnectModal } = useConnectModal();
    // A ref, not state: it is a latch on an external event (the wallet connecting),
    // read only inside the callback, and must never trigger a render of its own.
    const awaitingConnectRef = useRef(false);

    useAccountEffect({
        onConnect() {
            if (!awaitingConnectRef.current) return;

            awaitingConnectRef.current = false;
            enterCreateMode();
        },
    });

    const handleClick = () => {
        if (isConnected) {
            enterCreateMode();
            return;
        }

        awaitingConnectRef.current = true;
        openConnectModal?.();
    };

    return (
        <Button className={s.wrap} variant="brand" size="md" onClick={handleClick}>
            <PlusIcon />
            Create Patio
        </Button>
    );
};
