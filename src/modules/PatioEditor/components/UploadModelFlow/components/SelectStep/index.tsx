import type { SelectStepProps } from './types';
import { useRef, useState } from 'react';
import AlertCircleIcon from '@/icons/alert-circle_24.svg?react';
import CubesFloating100Icon from '@/icons/cubes-floating_100.svg?react';
// import XMarkIcon from '@/icons/x-mark_24.svg?react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { ACCEPTED_EXTENSIONS, FILE_INPUT_ACCEPT, MAX_FILE_SIZE_MB } from '../../constants';
// import { formatFileSize } from '../../utils/formatFileSize';
import s from './styles.module.css';

export const SelectStep: React.FC<SelectStepProps> = ({ file: _, error, onSelectFile, onClear: __ }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const pickFirst = (files: FileList | null) => {
        const first = files?.item(0);
        if (first) {
            onSelectFile(first);
        }
    };

    return (
        <div className={s.step}>
            <div
                className={clsx(s.dropzone, isDragging && s['dropzone--dragging'], error && s['dropzone--error'])}
                onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => {
                    setIsDragging(false);
                }}
                onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    pickFirst(event.dataTransfer.files);
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={FILE_INPUT_ACCEPT}
                    className={s.input}
                    onChange={(event) => {
                        pickFirst(event.target.files);
                        // Reset so re-selecting the same file fires onChange again.
                        event.target.value = '';
                    }}
                />
                <CubesFloating100Icon className={s.icon} />
                <Typography variant="text-md" className={s.prompt}>
                    Drag and drop a file to upload
                </Typography>
                <ul className={s.hint}>
                    <Typography className={s['hint-item']} variant="text-sm" render={<li />}>
                        <span>Supported:</span>&nbsp;{ACCEPTED_EXTENSIONS.join(', ')}
                    </Typography>
                    <Typography className={s['hint-item']} variant="text-sm" render={<li />}>
                        <span>Max size:</span>&nbsp;{MAX_FILE_SIZE_MB}&nbsp;MB
                    </Typography>
                </ul>
                <Button
                    className={s.cta}
                    size="sm"
                    variant="brand"
                    onClick={() => {
                        inputRef.current?.click();
                    }}
                >
                    Upload File
                </Button>
            </div>
            {error ? (
                <div className={s.error} role="alert">
                    <AlertCircleIcon className={s['error-icon']} />
                    <Typography variant="text-xs" render={<span />}>
                        {error}
                    </Typography>
                </div>
            ) : null}
        </div>
    );
};
