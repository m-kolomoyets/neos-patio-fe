import clsx from 'clsx';
import { selectAppBackground } from '@/lib/appBackground';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useIsMobileLandscape } from '@/hooks/useIsMobileLandscape';
import { useSquircleClipPath } from '@/hooks/useSquircleClipPath';
import { ActionBar } from '@/components/ActionBar';
import { AppBackground } from '@/components/AppBackground';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { HOME_SCROLL_ROOT_CLASS } from './constants';
import { AlphabetIndex } from './components/AlphabetIndex';
import { FeaturedPatios } from './components/FeaturedPatios';
import { PatioLibrary } from './components/PatioLibrary';
import s from './styles.module.css';

// Picked once per page load; a full reload re-rolls. Persisted so other screens
// (Create Patio) inherit the same image.
const homeBackgroundSrc = selectAppBackground();

const Home: React.FC = () => {
    const isMobilePortrait = useIsMobile();
    const isMobileLandscape = useIsMobileLandscape();
    const isMobile = isMobilePortrait || isMobileLandscape;

    // Squircle corners matching Figma's 60% iOS smoothing (border-radius: 2.5rem = 40px).
    const cornerRadius = isMobile ? 24 : 40;
    const [mainRef, mainSquircleStyle] = useSquircleClipPath<HTMLElement>({ cornerRadius });

    // Published to the frame instead of applied to <main>: clip-path is a backdrop root, so any
    // clipped ancestor would confine the header backdrop's blur to that subtree. Every panel
    // layer shares the frame's single grid cell, so one path fits them all.
    const squircleVars = {
        '--squircle-clip': mainSquircleStyle.clipPath ?? 'none',
    } as React.CSSProperties;

    return (
        <div className={s.wrap}>
            <AppBackground src={homeBackgroundSrc} />
            <div>
                {/* Every child below shares one grid cell, so they are all the same box and the
                    single --squircle-clip path fits each. <main> deliberately carries neither the
                    clip nor the border: staying clip-free keeps it out of stacking-context and
                    backdrop-root duty, which is what lets the sticky header (inside it) paint
                    above .header-backdrop (outside it). */}
                <div className={s['main-frame']} style={squircleVars}>
                    {/* Blurs the app background behind the panel. */}
                    <div className={s['main-glass']} aria-hidden="true" />
                    {/* Panel surface tint — was main::after before the layers were split out. */}
                    <div className={s['main-surface']} aria-hidden="true" />
                    <main ref={mainRef} className={s.main}>
                        <ScrollArea
                            className={s.scroll}
                            viewportClassName={clsx(s['scroll-viewport'], HOME_SCROLL_ROOT_CLASS)}
                        >
                            <FeaturedPatios />
                            <PatioLibrary />
                        </ScrollArea>
                    </main>
                    {/* Backdrop for PatioLibrary's stuck header — outside <main> so its blur
                        samples the page background rather than only the panel's own content. */}
                    <div className={s['header-backdrop']} aria-hidden="true" />
                    {/* Separate layer: its ::before casts the band's shadow, clipped to the panel
                        silhouette. Cannot live on .header-backdrop — clip-path crops box-shadow. */}
                    <div className={s['header-shadow']} aria-hidden="true" />
                    {/* Panel outline, above the backdrop so the squircle edge stays crisp. */}
                    <div className={s['main-border']} aria-hidden="true" />
                </div>
                <AlphabetIndex />
            </div>
            <ActionBar />
        </div>
    );
};

export default Home;
