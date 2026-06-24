import type { AssetPreviewPopupProps } from './types';
import { useEffect, useRef, useState } from 'react';
import CheckmarkIcon from '@/icons/checkmark_24.svg?react';
import Close24Icon from '@/icons/close_24.svg?react';
import DotsHorizontalIcon from '@/icons/dots-horizontal_24.svg?react';
import LinkIcon from '@/icons/link_24.svg?react';
import PhotoCameraIcon from '@/icons/photocamera_24.svg?react';
import TrashIcon from '@/icons/trash_24.svg?react';
import { Popover } from '@base-ui/react/popover';
import { Button } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { OptionItem } from '@/components/ui/OptionItem';
import { PopupWrapper } from '@/components/ui/PopupWrapper';
import { toast } from '@/components/ui/Toast';
import { Typography } from '@/components/ui/Typography';
import { COPIED_RESET_MS, PREVIEW_SIDE_OFFSET_PX, PREVIEW_TOP_OFFSET_PX } from './constants';
import { formatFileSize } from '../../utils/formatFileSize';
import { useThumbnailCapture } from './hooks/useThumbnailCapture';
import { AssetPreviewCanvas } from './components/AssetPreviewCanvas';
import s from './styles.module.css';

/**
 * Asset inspector anchored to the sidebar's right edge at a fixed offset, so it
 * stays put no matter which catalog item opened it. Non-modal: the scene and
 * sidebar underneath stay interactive; Esc / outside-press / the close button all
 * dismiss it. The top area is a dotted-background placeholder for the 3D preview
 * (wired in a later slice); the bottom shows metadata and the spawn action.
 */
export const AssetPreviewPopup: React.FC<AssetPreviewPopupProps> = ({
    model,
    open,
    anchorRef,
    onOpenChange,
    onSpawn,
}) => {
    const captureThumbnail = useThumbnailCapture();
    // Capture trigger lifted out of the scene so the action-bar button can snapshot it.
    const captureRef = useRef<(() => void) | null>(null);
    const [isFlashing, setIsFlashing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const modelId = model?.id ?? null;
    const gltfUrl = model?.gltfUrl ?? null;

    useEffect(() => {
        return () => {
            if (copiedTimeoutRef.current) {
                clearTimeout(copiedTimeoutRef.current);
            }
        };
    }, []);

    const handleUpdateThumbnail = () => {
        // Fire the shutter flash on press; the captured blob arrives async via onCapture.
        setIsFlashing(true);
        captureRef.current?.();
    };

    const handleCopyLink = async () => {
        if (!gltfUrl) {
            return;
        }

        try {
            await navigator.clipboard.writeText(gltfUrl);
        } catch {
            toast.error('Could not copy the asset link.');
            return;
        }

        // Confirm with a checkmark that reverts after a beat — no toast.
        setIsCopied(true);
        if (copiedTimeoutRef.current) {
            clearTimeout(copiedTimeoutRef.current);
        }
        copiedTimeoutRef.current = setTimeout(() => {
            setIsCopied(false);
        }, COPIED_RESET_MS);
    };

    return (
        <Popover.Root open={open} onOpenChange={onOpenChange}>
            <Popover.Portal>
                <Popover.Positioner
                    anchor={anchorRef}
                    side="right"
                    align="start"
                    alignOffset={PREVIEW_TOP_OFFSET_PX}
                    sideOffset={PREVIEW_SIDE_OFFSET_PX}
                >
                    <Popover.Popup render={<PopupWrapper className={s.popup} />}>
                        {model ? (
                            <>
                                <div className={s.preview}>
                                    <Popover.Close
                                        render={
                                            <Button
                                                className={s.close}
                                                type="button"
                                                variant="surface"
                                                size="sm"
                                                isIcon
                                                title="Close"
                                            >
                                                <Close24Icon />
                                                <span className="sr-only">Close preview</span>
                                            </Button>
                                        }
                                    />
                                    <AssetPreviewCanvas
                                        src={model.gltfUrl}
                                        onCapture={(blob) => {
                                            if (modelId) {
                                                captureThumbnail(modelId, blob);
                                            }
                                        }}
                                        onCaptureError={() => {
                                            toast.error('Could not capture a thumbnail from the preview.');
                                        }}
                                        onRegisterCapture={(capture) => {
                                            captureRef.current = capture;
                                        }}
                                    />
                                    {isFlashing ? (
                                        <span
                                            className={s.flash}
                                            aria-hidden
                                            onAnimationEnd={() => {
                                                setIsFlashing(false);
                                            }}
                                        />
                                    ) : null}
                                    <div className={s.actions}>
                                        <div className={s.group}>
                                            <Button
                                                className={s.cta}
                                                type="button"
                                                variant="surface"
                                                size="sm"
                                                isIcon
                                                title="Update thumbnail"
                                                onClick={handleUpdateThumbnail}
                                            >
                                                <PhotoCameraIcon />
                                                <span className="sr-only">Update thumbnail</span>
                                            </Button>
                                            <Button
                                                className={s.cta}
                                                type="button"
                                                variant="surface"
                                                size="sm"
                                                isIcon
                                                title={isCopied ? 'Link copied' : 'Copy link'}
                                                onClick={handleCopyLink}
                                            >
                                                <span className={s.icons} aria-hidden="true">
                                                    <CheckmarkIcon className={s.icon} data-visible={isCopied} />
                                                    <LinkIcon className={s.icon} data-visible={!isCopied} />
                                                </span>
                                                <span className="sr-only">
                                                    {isCopied ? 'Link copied' : 'Copy link'}
                                                </span>
                                            </Button>
                                        </div>
                                        <Menu.Root>
                                            <Menu.Trigger
                                                render={
                                                    <Button
                                                        className={s.cta}
                                                        type="button"
                                                        variant="surface"
                                                        size="sm"
                                                        isIcon
                                                        title="More actions"
                                                    />
                                                }
                                            >
                                                <DotsHorizontalIcon />
                                                <span className="sr-only">More actions</span>
                                            </Menu.Trigger>
                                            <Menu.Positioner side="bottom" align="end">
                                                <Menu.Popup>
                                                    <Menu.Item
                                                        render={
                                                            <OptionItem leftAddon={<TrashIcon />} variant="surface" />
                                                        }
                                                    >
                                                        Delete
                                                    </Menu.Item>
                                                </Menu.Popup>
                                            </Menu.Positioner>
                                        </Menu.Root>
                                    </div>
                                </div>
                                <div className={s.details}>
                                    <Typography variant="text-md" className={s.name} render={<h3 />}>
                                        {model.name}
                                    </Typography>
                                    <Typography variant="text-xs" className={s.meta} render={<span />}>
                                        {model.format} - {formatFileSize(model.sizeBytes)}
                                    </Typography>
                                    <Button
                                        className={s.spawn}
                                        type="button"
                                        variant="brand"
                                        size="sm"
                                        onClick={() => {
                                            onSpawn(model);
                                        }}
                                    >
                                        Spawn Asset
                                    </Button>
                                </div>
                            </>
                        ) : null}
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
};
