import type { UploadingPanelProps } from './types';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Typography } from '@/components/ui/Typography';
import { formatFileSize } from '../../utils/formatFileSize';
import s from './styles.module.css';

/** Bottom-slot content while the upload is in flight. */
export const UploadingPanel: React.FC<UploadingPanelProps> = ({ fileName, progress, fileSize = 0 }) => {
    return (
        <div className={s.panel}>
            <Typography variant="text-md" className={s.name} render={<h2 />}>
                {fileName}
            </Typography>
            <Typography variant="text-sm" className={s.size} render={<span />}>
                glTF 3D Model&nbsp;-&nbsp;{formatFileSize(fileSize)}
            </Typography>
            <ProgressBar value={progress} aria-label="Upload progress" />
        </div>
    );
};
