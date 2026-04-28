import { FeaturedPatios } from './components/FeaturedPatios';
import { PatioLibrary } from './components/PatioLibrary';
import s from './styles.module.css';

const Home: React.FC = () => {
    return (
        <div className={s.wrap}>
            <div className={s.background} aria-hidden />
            <main className={s.main}>
                <FeaturedPatios />
                <PatioLibrary />
            </main>
        </div>
    );
};

export default Home;
