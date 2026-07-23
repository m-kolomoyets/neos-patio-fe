import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePageTransition } from '@/contexts/PageTransitionContext';
import { useUpdateEffect } from '@react-hookz/web';
import { AnimatePresence, motion } from 'motion/react';
import { LoadingSpinnerWithLogo } from '@/components/ui/LoadingSpinnerWithLogo';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

const FADE_OUT = { duration: 0.5, ease: 'easeInOut' } as const;
const BG_FADE_IN = { duration: 0.4, ease: 'easeOut' } as const;

/**
 * Full-screen loading overlay shown while navigating to a patio. Renders the
 * patio's preview background, a dark scrim, the branded spinner, and a
 * `Loading {name}` label. Visibility is driven by {@link usePageTransition}.
 *
 * The overlay appears instantly opaque (`initial={false}`) so the destination
 * map can never peek through a fading-in layer; only the fade-out is animated.
 */
export const PageTransitionOverlay: React.FC = () => {
    const { active, backgroundUrl, backgroundLowUrl, name } = usePageTransition();

    // The full-res background fades in on top of the low-res placeholder once it
    // finishes decoding. Reset whenever the target background changes.
    const [fullLoaded, setFullLoaded] = useState(false);

    useUpdateEffect(() => {
        setFullLoaded(false);
    }, [backgroundUrl]);

    // Portaled to <body> so its z-index competes at the top-level stacking
    // context — otherwise the app root traps it below other <body> portals
    // (e.g. the sticky library header) despite the huge z-index.
    return createPortal(
        <AnimatePresence>
            {active ? (
                <motion.div
                    className={s.wrap}
                    initial={false}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: FADE_OUT }}
                    role="status"
                    aria-live="polite"
                >
                    {backgroundLowUrl ? (
                        <img key={backgroundLowUrl} className={s.bg} src={backgroundLowUrl} alt="" aria-hidden />
                    ) : null}
                    {backgroundUrl ? (
                        <motion.img
                            key={backgroundUrl}
                            className={s.bg}
                            src={backgroundUrl}
                            alt=""
                            aria-hidden
                            initial={{ opacity: 0 }}
                            animate={{ opacity: fullLoaded ? 1 : 0, transition: BG_FADE_IN }}
                            onLoad={() => {
                                return setFullLoaded(true);
                            }}
                        />
                    ) : null}
                    <div className={s.scrim} aria-hidden />
                    <div className={s.content}>
                        <LoadingSpinnerWithLogo className={s.spinner} />
                        <Typography variant="text-sm" className={s.label} render={<p />}>
                            {name ? `Loading ${name}` : 'Loading…'}
                        </Typography>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>,
        document.body
    );
};
