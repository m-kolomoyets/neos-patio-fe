import type { SelectStepProps } from './types';
import { useRef, useState } from 'react';
import CubesFloating100Icon from '@/icons/cubes-floating_100.svg?react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { ACCEPTED_EXTENSIONS, FILE_INPUT_ACCEPT, MAX_FILE_SIZE_MB } from '../../constants';
import { readDropInput } from '../../utils/readDropInput';
import s from './styles.module.css';

export const SelectStep: React.FC<SelectStepProps> = ({ onSelect, onError }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = async (dataTransfer: DataTransfer) => {
        const result = await readDropInput(dataTransfer);
        if (!result) {
            return;
        }
        if (result.kind === 'error') {
            onError(result.error);
            return;
        }
        onSelect(result);
    };

    return (
        <div className={s.step}>
            <div
                className={clsx(s.dropzone, isDragging && s['dropzone--dragging'])}
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
                    // Read synchronously — `dataTransfer` empties once this handler returns.
                    handleDrop(event.dataTransfer);
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={FILE_INPUT_ACCEPT}
                    className={s.input}
                    onChange={(event) => {
                        const file = event.target.files?.item(0);
                        if (file) {
                            onSelect({ kind: 'file', file });
                        }
                        // Reset so re-selecting the same file fires onChange again.
                        event.target.value = '';
                    }}
                />
                <CubesFloating100Icon className={s.icon} />
                <Typography variant="text-md" className={s.prompt}>
                    Drag and drop a file or folder to upload
                </Typography>
                <ul className={s.hint}>
                    <Typography className={s['hint-item']} variant="text-sm" render={<li />}>
                        <span>Supported:</span>&nbsp;{ACCEPTED_EXTENSIONS.join(', ')}, .zip, or a .gltf folder
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
        </div>
    );
};
