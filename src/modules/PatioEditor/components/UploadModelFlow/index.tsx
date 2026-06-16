import { useRef, useState } from 'react';
import ArrowLeftIcon from '@/icons/arrow-left_24.svg?react';
import ArrowRightIcon from '@/icons/arrow-right_24.svg?react';
import ImportIcon from '@/icons/import_24.svg?react';
import PhotoCameraIcon from '@/icons/photocamera_24.svg?react';
import TrashIcon from '@/icons/trash_24.svg?react';
import XMarkIcon from '@/icons/x-mark_24.svg?react';
import clsx from 'clsx';
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

// Crossfade for the bottom chrome that swaps under the shared scene box
// (uploading panel ↔ capture bar ↔ naming form).
const BOTTOM_MOTION = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.25 },
};

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

    // Dirty once a file is picked or anything is in flight; a pristine picker — or an
    // error screen with no retryable file (validation/parse failure) — closes freely.
    const isDirty =
        state.status === 'uploading' ||
        state.status === 'preview' ||
        (state.status === 'error' && state.file !== null) ||
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
                                        onSelectFile={handleSelectFile}
                                        onClear={clearFile}
                                    />
                                </motion.div>
                            )}
                            {(state.status === 'uploading' ||
                                state.status === 'error' ||
                                state.status === 'preview') && (
                                <motion.div key="stage" className={s.view} {...VIEW_MOTION}>
                                    <Dialog.Title className="sr-only" render={<span />}>
                                        Upload Assets
                                    </Dialog.Title>
                                    {state.status === 'preview' && previewStep === 'naming' && (
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
                                    {/* Shared top scene box: persists across uploading → preview (its dotted
                                        surface morphs in place) and across capture ⇄ naming. The same live
                                        3D canvas stays mounted through both preview steps so it scales with
                                        the box morph instead of swapping to a static image. */}
                                    <div
                                        className={s.preview}
                                        data-step={state.status === 'preview' ? previewStep : 'capture'}
                                    >
                                        <motion.div
                                            layout
                                            className={s['preview-model']}
                                            transition={MODEL_LAYOUT_TRANSITION}
                                        >
                                            {state.status === 'preview' && (
                                                <ModelPreviewScene
                                                    gltf={state.gltf}
                                                    showControls={previewStep === 'capture'}
                                                    interactive={previewStep === 'capture'}
                                                    onRegisterCapture={(capture) => {
                                                        captureRef.current = capture;
                                                    }}
                                                />
                                            )}
                                            {(state.status === 'uploading' || state.status === 'error') && (
                                                <ScenePlaceholder
                                                    variant={state.status === 'error' ? 'error' : 'loading'}
                                                />
                                            )}
                                        </motion.div>
                                        <AnimatePresence mode="popLayout" initial={false}>
                                            {(state.status === 'uploading' || state.status === 'error') && (
                                                // Fixed slot whose panels swap (CSS) as uploading → error.
                                                <motion.div key="bottom" className={s.bottom} {...BOTTOM_MOTION}>
                                                    {state.status === 'uploading' && (
                                                        <UploadingPanel
                                                            fileName={state.file.name.split('.').slice(0, -1).join('.')}
                                                            progress={state.progress}
                                                            fileSize={state.file.size}
                                                        />
                                                    )}
                                                    {state.status === 'error' && (
                                                        <ErrorPanel error={state.error} onRetry={retry} />
                                                    )}
                                                </motion.div>
                                            )}
                                            {state.status === 'preview' && previewStep === 'capture' && (
                                                <motion.div
                                                    key="capture"
                                                    className={s['capture-controls']}
                                                    {...BOTTOM_MOTION}
                                                >
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
                                                                <li>1. Set the asset thumbnail</li>
                                                            </Typography>
                                                            <Button
                                                                className={s.cta}
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
                                                </motion.div>
                                            )}
                                            {state.status === 'preview' && previewStep === 'naming' && (
                                                <motion.div key="form" className={s['preview-form']} {...BOTTOM_MOTION}>
                                                    <NamingStep
                                                        name={state.name}
                                                        onChangeName={setName}
                                                        onSave={save}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
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
                    <AlertDialog.Popup className={clsx(s.popup, s.confirm)} variant="surface">
                        <TrashIcon className={s.icon} />
                        <Typography variant="text-md" className={s.title} render={<AlertDialog.Title />}>
                            Discard unsaved asset?
                        </Typography>
                        <Typography variant="text-sm" className={s.description} render={<AlertDialog.Description />}>
                            This asset hasn&apos;t been saved yet. If you close this window now, the uploaded file will
                            be lost.
                        </Typography>
                        <footer className={s.footer}>
                            <Button className={s.cta} variant="surface" size="md" onClick={confirmDiscard}>
                                Discard asset
                            </Button>
                            <Button className={s.cta} size="md" render={<AlertDialog.Close />}>
                                Keep editing
                            </Button>
                        </footer>
                    </AlertDialog.Popup>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        </Dialog.Root>
    );
};
