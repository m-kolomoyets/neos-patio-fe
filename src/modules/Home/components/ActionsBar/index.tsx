import React from 'react';
import Search24Icon from '@/icons/search_24.svg?react';
import { useToggle } from '@react-hookz/web';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import s from './styles.module.css';

export const ActionBar: React.FC = () => {
    const [isSearchOpened, toggleIsSearchOpened] = useToggle();

    return (
        <AnimatePresence>
            <motion.div className={clsx(s.wrap, 'surface-regular')} layoutId="wrapper">
                {isSearchOpened ? (
                    <Input placeholder="Search" size="xl" leftAddon={<Search24Icon />} isRounded />
                ) : (
                    <>
                        <img className={s.logo} src="/images/logo-sm.webp" alt="logo" />
                        <div className={s.actions}>
                            <Button
                                id="search-bar-trigger"
                                variant="surface"
                                size="xl"
                                isIcon
                                onClick={toggleIsSearchOpened}
                            >
                                <Search24Icon />
                            </Button>
                            <ConnectWalletButton />
                        </div>
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
