import type { WithClassName } from '@/lib/types';
import CloseIcon from '@/icons/close_24.svg?react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

type MapPopupProps = WithClassName & React.PropsWithChildren;

/**
 * Bottom-right card shared by the two map popups — patio details (view mode) and
 * the new patio (create mode). Purely a frame: it owns the card metrics, the
 * glass surface, and its position inside `.map-clip`, and knows nothing about
 * patios. Only one is ever mounted at a time.
 */
export const MapPopup: React.FC<MapPopupProps> = ({ className, children }) => {
    return <section className={clsx(s.wrap, className)}>{children}</section>;
};

type MapPopupHeaderProps = WithClassName & {
    title: string;
    /** Renders the X when provided; omitted popups (patio details) have no close affordance. */
    onClose?: () => void;
    /** Blocks the X while an action that cannot be cancelled is in flight. */
    isCloseDisabled?: boolean;
};

/** Title row with an optional close button. */
export const MapPopupHeader: React.FC<MapPopupHeaderProps> = ({ className, title, onClose, isCloseDisabled }) => {
    return (
        <div className={clsx(s.header, className)}>
            <Typography variant="text-md" className={s.title}>
                {title}
            </Typography>
            {onClose ? (
                <Button
                    className={s.close}
                    variant="surface"
                    size="sm"
                    isIcon
                    aria-label="Close"
                    disabled={isCloseDisabled}
                    onClick={onClose}
                >
                    <CloseIcon />
                </Button>
            ) : null}
        </div>
    );
};

/** Hairline between the popup's card sections, matching the design separator. */
export const MapPopupSeparator: React.FC = () => {
    return <Separator className={s.separator} />;
};

/** Vertical stack of label/value rows. */
export const MapPopupRows: React.FC<WithClassName & React.PropsWithChildren> = ({ className, children }) => {
    return <dl className={clsx(s.rows, className)}>{children}</dl>;
};

type MapPopupRowProps = WithClassName &
    React.PropsWithChildren & {
        label: string;
    };

/** One label/value row. The value side takes arbitrary content (chips, dots). */
export const MapPopupRow: React.FC<MapPopupRowProps> = ({ className, label, children }) => {
    return (
        <div className={clsx(s.row, className)}>
            <dt className={s.label}>{label}</dt>
            <dd className={s.value}>{children}</dd>
        </div>
    );
};

/** Action slot at the bottom of the card (buttons, mint footer). */
export const MapPopupFooter: React.FC<WithClassName & React.PropsWithChildren> = ({ className, children }) => {
    return <div className={clsx(s.footer, className)}>{children}</div>;
};
