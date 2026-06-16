import type { ErrorPanelProps } from './types';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import s from './styles.module.css';

/** Bottom-slot content when the upload track failed; offers discard or retry. */
export const ErrorPanel: React.FC<ErrorPanelProps> = ({ error, onRetry }) => {
    return (
        <div className={s.panel}>
            <Dialog.Description className={s.description}>{error}</Dialog.Description>
            <footer className={s.footer}>
                <Button variant="surface" size="md" render={<Dialog.Close />}>
                    Discard
                </Button>
                <Button size="md" onClick={onRetry}>
                    Retry
                </Button>
            </footer>
        </div>
    );
};
