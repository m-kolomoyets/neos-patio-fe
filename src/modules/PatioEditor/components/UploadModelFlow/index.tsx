import { useRef, useState } from 'react';
import ArrowLeftIcon from '@/icons/arrow-left_24.svg?react';
import ArrowRightIcon from '@/icons/arrow-right_24.svg?react';
import ImportIcon from '@/icons/import_24.svg?react';
import PhotoCameraIcon from '@/icons/photocamera_24.svg?react';
import XMarkIcon from '@/icons/x-mark_24.svg?react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Typography } from '@/components/ui/Typography';
import { validateModelFile } from './utils/validateModelFile';
import { useUploadModel } from '../../context/UploadModelContext';
import { ErrorPanel } from './components/ErrorPanel';
import { ModelPreviewScene } from './components/ModelPreviewScene';
import { NamingStep } from './components/NamingStep';
import { ScenePlaceholder } from './components/ScenePlaceholder';
import { SelectStep } from './components/SelectStep';
import { UploadingPanel } from './components/UploadingPanel';
import s from './styles.module.css';

// Horizontal slide-fade shared by the top-level view swap (selecting ↔ upload stage).
const VIEW_MOTION = {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
    transition: { duration: 0.4, type: 'spring' as const, bounce: 0 },
};

// Spring driving the shared model box morph (full scene ⇄ small thumbnail).
const MODEL_LAYOUT_TRANSITION = { type: 'spring' as const, bounce: 0, duration: 0.5 };

type PreviewStep = 'capture' | 'naming';

export const UploadModelFlow: React.FC = () => {
    const { state, open, selectFile, setError, clearFile, startUpload, retry, setName, save, discard } =
        useUploadModel();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [previewStep, setPreviewStep] = useState<PreviewStep>('capture');
    // Capture handler lifted out of the scene so the bottom-bar button can trigger a snapshot.
    const captureRef = useRef<(() => void) | null>(null);

    // Reset to the capture sub-step whenever a new preview begins (or we leave preview).
    // Render-phase reset keyed by model id — avoids a cascading effect.
    const previewModelId = state.status === 'preview' ? state.modelId : null;
    const [stepModelId, setStepModelId] = useState<string | null>(null);
    if (previewModelId !== stepModelId) {
        setStepModelId(previewModelId);
        setPreviewStep('capture');
    }

    const handleSelectFile = (next: File) => {
        const result = validateModelFile(next);
        if (!result.ok) {
            setError(result.error);
            return;
        }
        selectFile(next);
        startUpload();
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
                <Dialog.Popup className={s.popup} variant="surface">
                    <Dialog.Close
                        render={
                            <Button className={s.close} variant="surface" size="sm" isIcon title="Close">
                                <XMarkIcon />
                                <span className="sr-only">Close</span>
                            </Button>
                        }
                    />
                    {/* Static-height stage; views horizontally slide-fade as the flow advances. */}
                    <div className={s.viewport}>
                        <AnimatePresence mode="wait" initial={false}>
                            {state.status === 'selecting' && (
                                <motion.div key="selecting" className={s.view} {...VIEW_MOTION}>
                                    <Dialog.Title className={s.title} render={<Typography variant="text-lg" />}>
                                        Upload Assets
                                    </Dialog.Title>
                                    <SelectStep
                                        file={selectingFile}
                                        error={selectingError}
                                        onSelectFile={handleSelectFile}
                                        onClear={clearFile}
                                    />
                                </motion.div>
                            )}
                            {state.status === 'preview' && (
                                <motion.div key="preview" className={s.view} {...VIEW_MOTION}>
                                    <Dialog.Title className="sr-only" render={<span />}>
                                        Upload Assets
                                    </Dialog.Title>
                                    {previewStep === 'naming' && (
                                        <Button
                                            className={s.back}
                                            variant="surface"
                                            size="sm"
                                            isIcon
                                            title="Back"
                                            onClick={() => {
                                                setPreviewStep('capture');
                                            }}
                                        >
                                            <ArrowLeftIcon />
                                            <span className="sr-only">Back</span>
                                        </Button>
                                    )}
                                    {/* Capture ⇄ naming: only the model box morphs (shared layout) between
                                        the full live scene and the centered thumbnail; the surrounding
                                        chrome (capture bar ↔ naming form) hard-swaps around it. */}
                                    <div className={s.preview} data-step={previewStep}>
                                        <motion.div
                                            layout
                                            className={s['preview-model']}
                                            transition={MODEL_LAYOUT_TRANSITION}
                                        >
                                            {previewStep === 'capture' && (
                                                <ModelPreviewScene
                                                    gltf={state.gltf}
                                                    onRegisterCapture={(capture) => {
                                                        captureRef.current = capture;
                                                    }}
                                                />
                                            )}
                                            {previewStep === 'naming' && state.thumbnailUrl && (
                                                <img
                                                    className={s.thumbnail}
                                                    src={state.thumbnailUrl}
                                                    alt={state.name || 'Model thumbnail'}
                                                />
                                            )}
                                            {previewStep === 'naming' && !state.thumbnailUrl && <ScenePlaceholder />}
                                        </motion.div>
                                        {previewStep === 'capture' && (
                                            <div className={s['capture-controls']}>
                                                <div className={s.separator} />
                                                <div className={s['capture-bar']}>
                                                    <div className={s['capture-thumb']}>
                                                        {state.thumbnailUrl ? (
                                                            <img
                                                                className={s.thumbnail}
                                                                src={state.thumbnailUrl}
                                                                alt={state.name || 'Model thumbnail'}
                                                            />
                                                        ) : null}
                                                    </div>
                                                    <div className={s['capture-main']}>
                                                        <Typography
                                                            variant="text-xs"
                                                            className={s.caption}
                                                            render={<ol start={1} />}
                                                        >
                                                            <li>Set the asset thumbnail</li>
                                                        </Typography>
                                                        <Button
                                                            type="button"
                                                            variant="brand"
                                                            size="sm"
                                                            onClick={() => {
                                                                captureRef.current?.();
                                                            }}
                                                        >
                                                            <PhotoCameraIcon />
                                                            Capture Thumbnail
                                                        </Button>
                                                    </div>
                                                    <Button
                                                        className={s.next}
                                                        type="button"
                                                        variant="surface"
                                                        size="sm"
                                                        isIcon
                                                        title="Next"
                                                        onClick={() => {
                                                            setPreviewStep('naming');
                                                        }}
                                                    >
                                                        <ArrowRightIcon />
                                                        <span className="sr-only">Next</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {previewStep === 'naming' && (
                                            <div className={s['preview-form']}>
                                                <NamingStep name={state.name} onChangeName={setName} onSave={save} />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                            {(state.status === 'uploading' || state.status === 'error') && (
                                <motion.div key="stage" className={s.view} {...VIEW_MOTION}>
                                    <Dialog.Title className="sr-only" render={<span />}>
                                        Upload Assets
                                    </Dialog.Title>
                                    {/* Scene box: placeholder while in flight / failed. */}
                                    <div className={s.scene}>
                                        <ScenePlaceholder />
                                    </div>
                                    {/* Fixed slot whose panels slide-swap (CSS) as uploading → error. */}
                                    <div className={s.bottom}>
                                        {state.status === 'uploading' && (
                                            <UploadingPanel fileName={state.file.name} progress={state.progress} />
                                        )}
                                        {state.status === 'error' && <ErrorPanel error={state.error} onRetry={retry} />}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
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
