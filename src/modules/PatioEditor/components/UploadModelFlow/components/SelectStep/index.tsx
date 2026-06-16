import type { SelectStepProps } from './types';
import { useRef, useState } from 'react';
import AlertCircleIcon from '@/icons/alert-circle_24.svg?react';
import CloudArrowTopIcon from '@/icons/cloud-arrow-top_24.svg?react';
import CubeIcon from '@/icons/cube_24.svg?react';
import XMarkIcon from '@/icons/x-mark_24.svg?react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { ACCEPTED_EXTENSIONS, FILE_INPUT_ACCEPT, MAX_FILE_SIZE_MB } from '../../constants';
import { formatFileSize } from '../../utils/formatFileSize';
import s from './styles.module.css';

export const SelectStep: React.FC<SelectStepProps> = ({ file, error, onSelectFile, onClear }) => {
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

                {file ? (
                    <div className={s.selected}>
                        <CubeIcon className={s['file-icon']} />
                        <div className={s['file-meta']}>
                            <Typography
                                variant="text-sm"
                                className={clsx(s['file-name'], 'truncate')}
                                render={<span />}
                            >
                                {file.name}
                            </Typography>
                            <Typography variant="text-xs" className={s['file-size']} render={<span />}>
                                {formatFileSize(file.size)}
                            </Typography>
                        </div>
                        <Button variant="link" size="sm" isIcon title="Remove file" onClick={onClear}>
                            <XMarkIcon />
                            <span className="sr-only">Remove file</span>
                        </Button>
                    </div>
                ) : (
                    <>
                        <CloudArrowTopIcon className={s.icon} />
                        <Typography variant="text-sm" className={s.prompt}>
                            Drag &amp; drop your model here
                        </Typography>
                        <Typography variant="text-xs" className={s.hint}>
                            {ACCEPTED_EXTENSIONS.join(', ')} · up to {MAX_FILE_SIZE_MB}MB
                        </Typography>
                        <Button
                            variant="surface"
                            size="sm"
                            onClick={() => {
                                inputRef.current?.click();
                            }}
                        >
                            Browse files
                        </Button>
                    </>
                )}
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
