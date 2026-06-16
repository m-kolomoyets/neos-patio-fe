import { useState } from 'react';
import ImportIcon from '@/icons/import_24.svg?react';
import XMarkIcon from '@/icons/x-mark_24.svg?react';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Typography } from '@/components/ui/Typography';
import { validateModelFile } from './utils/validateModelFile';
import { useUploadModel } from '../../context/UploadModelContext';
import { ModelPreviewScene } from './components/ModelPreviewScene';
import { SelectStep } from './components/SelectStep';
import s from './styles.module.css';

export const UploadModelFlow: React.FC = () => {
    const { state, open, selectFile, setError, clearFile, startUpload, retry, setName, save, discard } =
        useUploadModel();
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleSelectFile = (next: File) => {
        const result = validateModelFile(next);
        if (!result.ok) {
            setError(result.error);
            return;
        }
        selectFile(next);
    };

    const selectingFile = state.status === 'selecting' ? state.file : null;
    const selectingError = state.status === 'selecting' ? state.error : null;

    // Dirty once a file is picked or anything is in flight; a pristine picker closes freely.
    const isDirty =
        state.status === 'uploading' ||
        state.status === 'error' ||
        state.status === 'preview' ||
        (state.status === 'selecting' && state.file !== null);

    const confirmDiscard = () => {
        setConfirmOpen(false);
        discard();
    };

    return (
        <Dialog.Root
            open={state.status !== 'idle'}
            onOpenChange={(next) => {
                if (next) {
                    open();
                    return;
                }
                // Guard the close: dirty flows raise a confirm; pristine ones tear down directly.
                if (isDirty) {
                    setConfirmOpen(true);
                    return;
                }
                discard();
            }}
        >
            <Dialog.Trigger
                render={
                    <Button className={s.trigger} variant="link" size="md">
                        <ImportIcon />
                        Upload Assets
                    </Button>
                }
            />
            <Dialog.Portal>
                <Dialog.Backdrop />
                <Dialog.Popup className={s.popup}>
                    <header className={s.header}>
                        <Typography variant="display-sm" className={s.title} render={<Dialog.Title />}>
                            Upload model
                        </Typography>
                        <Dialog.Close
                            render={
                                <Button variant="link" size="sm" isIcon title="Close">
                                    <XMarkIcon />
                                    <span className="sr-only">Close</span>
                                </Button>
                            }
                        />
                    </header>

                    {state.status === 'selecting' ? (
                        <>
                            <Dialog.Description className={s.description}>
                                Upload a .glb or .gltf 3D model to add it to your assets.
                            </Dialog.Description>
                            <SelectStep
                                file={selectingFile}
                                error={selectingError}
                                onSelectFile={handleSelectFile}
                                onClear={clearFile}
                            />
                            <footer className={s.footer}>
                                <Button variant="surface" size="md" render={<Dialog.Close />}>
                                    Cancel
                                </Button>
                                <Button size="md" disabled={!selectingFile} onClick={startUpload}>
                                    Upload
                                </Button>
                            </footer>
                        </>
                    ) : null}

                    {state.status === 'uploading' ? (
                        <div className={s.progress}>
                            <Typography variant="text-sm" className={s['progress-name']} render={<span />}>
                                Uploading {state.file.name}…
                            </Typography>
                            <ProgressBar value={state.progress} aria-label="Upload progress" />
                            <Typography variant="text-xs" className={s['progress-value']} render={<span />}>
                                {state.progress}%
                            </Typography>
                        </div>
                    ) : null}

                    {state.status === 'error' ? (
                        <>
                            <Dialog.Description className={s.description}>{state.error}</Dialog.Description>
                            <footer className={s.footer}>
                                <Button variant="surface" size="md" render={<Dialog.Close />}>
                                    Discard
                                </Button>
                                <Button size="md" onClick={retry}>
                                    Retry
                                </Button>
                            </footer>
                        </>
                    ) : null}

                    {state.status === 'preview' ? (
                        <>
                            <ModelPreviewScene gltf={state.gltf} />
                            <label className={s.field}>
                                <Typography variant="text-sm" className={s['field-label']} render={<span />}>
                                    Asset name
                                </Typography>
                                <Input
                                    value={state.name}
                                    placeholder="Name your asset"
                                    onChange={(event) => {
                                        setName(event.target.value);
                                    }}
                                />
                            </label>
                            <footer className={s.footer}>
                                <Button variant="surface" size="md" render={<Dialog.Close />}>
                                    Discard
                                </Button>
                                <Button size="md" disabled={!state.name.trim()} onClick={save}>
                                    Save
                                </Button>
                            </footer>
                        </>
                    ) : null}
                </Dialog.Popup>
            </Dialog.Portal>

            <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialog.Portal>
                    <AlertDialog.Backdrop />
                    <AlertDialog.Popup>
                        <Typography variant="display-sm" className={s.title} render={<AlertDialog.Title />}>
                            Discard upload?
                        </Typography>
                        <AlertDialog.Description className={s.description}>
                            This cancels the upload and removes anything already created. This can&apos;t be undone.
                        </AlertDialog.Description>
                        <footer className={s.footer}>
                            <Button variant="surface" size="md" render={<AlertDialog.Close />}>
                                Keep editing
                            </Button>
                            <Button size="md" onClick={confirmDiscard}>
                                Discard
                            </Button>
                        </footer>
                    </AlertDialog.Popup>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        </Dialog.Root>
    );
};
