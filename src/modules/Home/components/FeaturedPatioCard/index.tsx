import type { Patio } from '@/services/patios/types';
import { memo, useCallback, useState } from 'react';
import ArrowTopRight24Icon from '@/icons/arrow-top-right_24.svg?react';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { useSpotlight } from '@/hooks/useSpotlight';
import { AspectRatio } from '@/components/ui/AspectRatio';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { useHoverVideoAutoplay } from './hooks/useHoverVideoAutoplay';
import { useHoverVideoScrub } from './hooks/useHoverVideoScrub';
import s from './styles.module.css';

const SCRUB_ENABLED = import.meta.env.VITE_FEATURED_CURSOR_SCRUB === 'true';
const useHoverVideo = SCRUB_ENABLED ? useHoverVideoScrub : useHoverVideoAutoplay;

type Props = {
    patio: Patio;
    shouldPrefetch?: boolean;
};

const FeaturedPatioCardImpl: React.FC<Props> = ({ patio, shouldPrefetch = false }) => {
    const [highLoaded, setHighLoaded] = useState(false);
    const {
        rootRef,
        stackRef,
        videoRef,
        shouldMountVideo,
        videoSrc,
        phase,
        onPointerEnter,
        onPointerMove,
        onPointerLeave,
        onVideoLoadedMetadata,
        onVideoError,
    } = useHoverVideo({ videoUrl: patio.videoUrl, shouldPrefetch });

    const spotlightRef = useSpotlight<HTMLElement>();
    const setRootRef = useCallback(
        (el: HTMLElement | null) => {
            rootRef(el);
            spotlightRef(el);
        },
        [rootRef, spotlightRef]
    );

    const showVideoLayer = phase === 'active' || phase === 'rewinding';

    return (
        <article
            ref={setRootRef}
            className={s.wrap}
            data-card-id={patio.id}
            data-phase={phase}
            onPointerEnter={onPointerEnter}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
        >
            <AspectRatio ratio={381 / 408} className={s.media}>
                <div ref={stackRef} className={s.stack}>
                    {patio.previewLowUrl ? (
                        <img
                            className={clsx(s.layer, s['img-low'])}
                            src={patio.previewLowUrl}
                            alt=""
                            aria-hidden
                            data-faded={highLoaded || undefined}
                        />
                    ) : null}
                    <img
                        className={clsx(s.layer, s['img-high'])}
                        src={patio.previewHighUrl}
                        alt={patio.name}
                        loading="lazy"
                        onLoad={() => {
                            return setHighLoaded(true);
                        }}
                    />
                    {shouldMountVideo && patio.videoUrl && videoSrc ? (
                        <video
                            ref={videoRef}
                            className={clsx(s.layer, s.video)}
                            src={videoSrc}
                            muted
                            loop={!SCRUB_ENABLED}
                            playsInline
                            preload="auto"
                            disablePictureInPicture
                            disableRemotePlayback
                            data-active={showVideoLayer || undefined}
                            onLoadedMetadata={onVideoLoadedMetadata}
                            onError={onVideoError}
                            aria-hidden
                        />
                    ) : null}
                </div>
            </AspectRatio>
            <footer className={s.content}>
                <div className={s.titles}>
                    <Typography variant="text-md" render={<h3 />}>
                        {patio.name}
                    </Typography>
                    <Typography className={s.subtitle} variant="text-sm" render={<p />}>
                        by {patio.author}
                    </Typography>
                </div>
                <Button
                    variant="surface"
                    size="md"
                    title={`Open ${patio.name}`}
                    className={s['open-button']}
                    nativeButton={false}
                    render={<Link to="/patios/$id" params={{ id: patio.id }} />}
                >
                    Open
                    <span className="sr-only">{patio.name}</span>
                    <ArrowTopRight24Icon aria-hidden />
                </Button>
            </footer>
        </article>
    );
};

export const FeaturedPatioCard = memo(FeaturedPatioCardImpl);
