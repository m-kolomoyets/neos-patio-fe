import type { Patio } from '@/services/patios/types';
import { memo, useCallback, useState } from 'react';
import MapPin24Icon from '@/icons/map-pin_24.svg?react';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useIsMobileLandscape } from '@/hooks/useIsMobileLandscape';
import { usePatioTransitionNavigate } from '@/hooks/usePatioTransitionNavigate';
import { useSpotlight } from '@/hooks/useSpotlight';
import { useSquircleClipPath } from '@/hooks/useSquircleClipPath';
import { Tag } from '@/components/ui/Tag';
import { Typography } from '@/components/ui/Typography';
import { CONTINENT_LABELS } from '../../constants';
import { useHoverVideoScrub } from './hooks/useHoverVideoScrub';
import s from './styles.module.css';

type Props = {
    patio: Patio;
    shouldMountVideo?: boolean;
};

const FeaturedPatioCardImpl: React.FC<Props> = ({ patio, shouldMountVideo = false }) => {
    const isMobilePortrait = useIsMobile();
    const isMobileLandscape = useIsMobileLandscape();
    const isMobile = isMobilePortrait || isMobileLandscape;

    const [highLoaded, setHighLoaded] = useState(false);
    const {
        rootRef,
        stackRef,
        videoRef,
        shouldMountVideo: videoMounted,
        videoSrc,
        phase,
        metadataReady,
        onVideoLoadedMetadata,
        onVideoError,
    } = useHoverVideoScrub({
        videoUrl: patio.videoUrl,
        shouldMountVideo,
    });

    const { seed } = usePatioTransitionNavigate();
    const spotlightRef = useSpotlight<HTMLElement>();

    const [wrapSquircleRef, wrapSquircleStyle] = useSquircleClipPath<HTMLElement>({
        cornerRadius: isMobile ? 24 : 28,
        cornerSmoothing: 0.5,
        preserveSmoothing: false,
    });
    const [mediaSquircleRef, mediaSquircleStyle] = useSquircleClipPath<HTMLDivElement>({
        cornerRadius: isMobile ? 12 : 16,
        cornerSmoothing: 0.5,
        preserveSmoothing: false,
        as: 'mask',
    });

    const setRootRef = useCallback(
        (el: HTMLElement | null) => {
            rootRef(el);
            spotlightRef(el);
            wrapSquircleRef.current = el;
        },
        [rootRef, spotlightRef, wrapSquircleRef]
    );

    const showVideoLayer = metadataReady && phase !== 'broken';

    return (
        <Link
            to="/patios/$id"
            params={{ id: patio.id }}
            ref={setRootRef}
            style={wrapSquircleStyle}
            onClick={() => {
                return seed(patio);
            }}
            className={clsx(s.wrap, 'focus-primary')}
            aria-label={`Open ${patio.name}`}
            title={`Open ${patio.name}`}
            data-card-id={patio.id}
            data-phase={phase}
        >
            <div ref={mediaSquircleRef} className={s.media} style={mediaSquircleStyle}>
                <div className={clsx(s.decor, s.top)} aria-hidden />
                <div className={clsx(s.decor, s.bottom)} aria-hidden />
                <div ref={stackRef} className={s.stack} data-stack>
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
                    {videoMounted && patio.videoUrl && videoSrc ? (
                        <video
                            ref={videoRef}
                            className={clsx(s.layer, s.video)}
                            src={videoSrc}
                            muted
                            loop={false}
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
            </div>
            <footer className={s.content}>
                <div className={s.titles}>
                    <Typography className={s.title} variant="text-xl" render={<h3 />}>
                        {patio.name}
                    </Typography>
                    <Typography className={s.id} variant="text-sm" render={<span />}>
                        ID {patio.id}
                    </Typography>
                    <ul className={s.meta}>
                        <Tag className={s.tag} render={<li />}>
                            <MapPin24Icon className={s.icon} aria-hidden />
                            <Typography className={s.label} variant="text-sm" render={<span />}>
                                <span className="sr-only">Continent: </span>
                                {CONTINENT_LABELS?.[patio.continent] ?? 'N/A'}
                            </Typography>
                        </Tag>
                    </ul>
                </div>
            </footer>
        </Link>
    );
};

export const FeaturedPatioCard = memo(FeaturedPatioCardImpl);
