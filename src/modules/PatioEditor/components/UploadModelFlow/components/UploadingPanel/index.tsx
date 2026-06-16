import type { UploadingPanelProps } from './types';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

/** Bottom-slot content while the upload is in flight. */
export const UploadingPanel: React.FC<UploadingPanelProps> = ({ fileName, progress }) => {
    return (
        <div className={s.panel}>
            <Typography variant="text-sm" className={s.name} render={<span />}>
                Uploading {fileName}…
            </Typography>
            <ProgressBar value={progress} aria-label="Upload progress" />
            <Typography variant="text-xs" className={s.value} render={<span />}>
                {progress}%
            </Typography>
        </div>
    );
};
