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
    const [viewportRef, viewportSquircleStyle] = useSquircleClipPath<HTMLDivElement>({ cornerRadius });

    return (
        <div className={s.wrap}>
            <AppBackground src={homeBackgroundSrc} />
            <div>
                <main ref={mainRef} className={s.main} style={mainSquircleStyle}>
                    <ScrollArea
                        className={s.scroll}
                        viewportClassName={clsx(s['scroll-viewport'], HOME_SCROLL_ROOT_CLASS)}
                        viewportRef={viewportRef}
                        viewportStyle={viewportSquircleStyle}
                    >
                        <FeaturedPatios />
                        <PatioLibrary />
                    </ScrollArea>
                    <AlphabetIndex />
                </main>
                <ActionBar />
            </div>
        </div>
    );
};

export default Home;
