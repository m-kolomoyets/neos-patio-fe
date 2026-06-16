import type { ErrorPanelProps } from './types';
import RefreshIcon from '@/icons/refresh-ccw-two-arrows_24.svg?react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

/** Bottom-slot content when the upload track failed; restates the error and offers a retry. */
export const ErrorPanel: React.FC<ErrorPanelProps> = ({ error, onRetry }) => {
    return (
        <div className={s.panel}>
            <div className={s.separator} />
            <div className={s.body}>
                <Typography variant="text-md" className={s.message} render={<Dialog.Description />}>
                    {error}
                </Typography>
                <Button className={s.cta} variant="brand" size="sm" onClick={onRetry}>
                    <RefreshIcon />
                    Retry
                </Button>
            </div>
        </div>
    );
};
