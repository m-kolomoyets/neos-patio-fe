import { useEffect, useRef, useState } from 'react';
import CheckmarkIcon from '@/icons/checkmark_24.svg?react';
import CopyIcon from '@/icons/copy_18.svg?react';
import clsx from 'clsx';
import { truncateMiddle } from '../../../../utils/truncateMiddle';
import { MapPopupRow } from '../../../MapPopup';
import s from './styles.module.css';

/** How long the chip shows the checkmark after a successful copy. */
const COPIED_FEEDBACK_MS = 1500;

type CopyLinkRowProps = {
    label: string;
    /** Full value copied to the clipboard; the chip shows it middle-truncated. */
    value: string;
};

/**
 * A link row whose value is a copy-to-clipboard chip with middle truncation —
 * the treatment the design uses for both the blockchain and the navigation link.
 * The row is only ever rendered when its value exists; an absent link means no
 * row at all, never an empty one.
 */
export const CopyLinkRow: React.FC<CopyLinkRowProps> = ({ label, value }) => {
    const [isCopied, setIsCopied] = useState(false);
    // Cleared on unmount so a copy right before the popup closes can't set state
    // on a gone component.
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(function clearFeedbackTimeout() {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            // Clipboard access can be denied (insecure context, permissions); the
            // chip simply doesn't confirm rather than breaking the popup.
            return;
        }

        setIsCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            return setIsCopied(false);
        }, COPIED_FEEDBACK_MS);
    };

    return (
        <MapPopupRow label={label}>
            <button
                type="button"
                className={clsx(s.chip, 'focus-primary')}
                title={value}
                aria-label={isCopied ? `${label} copied` : `Copy ${label}`}
                onClick={() => {
                    void handleCopy();
                }}
            >
                {isCopied ? <CheckmarkIcon className={s.icon} /> : <CopyIcon className={s.icon} />}
                <span className={s.text}>{truncateMiddle(value)}</span>
            </button>
        </MapPopupRow>
    );
};
