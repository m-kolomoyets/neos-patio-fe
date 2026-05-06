import clsx from 'clsx';
import { Container } from '@/components/ui/Container';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { HOME_SCROLL_ROOT_CLASS } from './constants';
import { ActionBar } from './components/ActionsBar';
import { AlphabetIndex } from './components/AlphabetIndex';
import { FeaturedPatios } from './components/FeaturedPatios';
import HomeBackground from './components/HomeBackground';
import { PatioLibrary } from './components/PatioLibrary';
import s from './styles.module.css';

const Home: React.FC = () => {
    return (
        <div className={s.wrap}>
            <HomeBackground />
            <Container>
                <main className={s.main}>
                    <ScrollArea
                        className={s.scroll}
                        viewportClassName={clsx(s['scroll-viewport'], HOME_SCROLL_ROOT_CLASS)}
                    >
                        <FeaturedPatios />
                        <PatioLibrary />
                    </ScrollArea>
                    <AlphabetIndex />
                    <ActionBar />
                </main>
            </Container>
        </div>
    );
};

export default Home;
