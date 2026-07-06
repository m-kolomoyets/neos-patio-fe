import clsx from 'clsx';
import { useSquircleClipPath } from '@/hooks/useSquircleClipPath';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { HOME_SCROLL_ROOT_CLASS } from './constants';
import { ActionBar } from './components/ActionsBar';
import { AlphabetIndex } from './components/AlphabetIndex';
import { FeaturedPatios } from './components/FeaturedPatios';
import HomeBackground from './components/HomeBackground';
import { PatioLibrary } from './components/PatioLibrary';
import s from './styles.module.css';

const Home: React.FC = () => {
    // Squircle corners matching Figma's 60% iOS smoothing (border-radius: 2.5rem = 40px).
    const [mainRef, mainSquircleStyle] = useSquircleClipPath<HTMLElement>({ cornerRadius: 40 });
    const [viewportRef, viewportSquircleStyle] = useSquircleClipPath<HTMLDivElement>({ cornerRadius: 40 });

    return (
        <div className={s.wrap}>
            <HomeBackground />
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
