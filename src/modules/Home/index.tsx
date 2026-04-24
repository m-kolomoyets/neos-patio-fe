import clsx from 'clsx';
import { Typography } from '@/components/ui/Typography';
import s from './style.module.css';

const Home: React.FC = () => {
    return (
        <main className={clsx(s.wrap, 'full-height')}>
            <Typography>Hello World</Typography>
        </main>
    );
};

export default Home;
