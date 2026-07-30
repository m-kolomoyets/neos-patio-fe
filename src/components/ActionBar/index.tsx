import type { Patio } from '@/services/patios/types';
import React from 'react';
import Search24Icon from '@/icons/search_24.svg?react';
import VrHeadset20Icon from '@/icons/vr-headset_20.svg?react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { useAccount } from 'wagmi';
import { getPatiosListAllQueryOptions } from '@/services/patios/queries';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { Button } from '@/components/ui/Button';
import { XRConnectDialog } from '@/components/XRConnectDialog';
import { SEARCH_TRIGGER_ID } from './constants';
import { useActionBarSearch } from './hooks/useActionBarSearch';
import { PatioAutocomplete } from './components/PatioAutocomplete';
import s from './styles.module.css';

const stateVariants = {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
};

const stateTransition = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

export const ActionBar: React.FC = () => {
    const navigate = useNavigate();
    const { isSearchOpened, openSearch, closeSearch, query, setQuery, wrapRef } = useActionBarSearch();

    const { isConnected } = useAccount();

    const {
        data: patios,
        isFetching,
        isError,
    } = useQuery(
        getPatiosListAllQueryOptions({
            q: query,
        })
    );

    const handleOptionSelect = (option: Patio) => {
        // Reset the bar back to its default (collapsed) state and clear the
        // search value / `q` param before navigating to the picked patio.
        closeSearch();
        setQuery('');
        navigate({
            to: '/patios/$slug',
            params: {
                slug: option.slug,
            },
        });
    };

    return (
        <div ref={wrapRef} className={clsx(s.shell, 'surface-regular')}>
            <AnimatePresence mode="popLayout" initial={false}>
                {isSearchOpened ? (
                    <motion.div
                        key="search"
                        className={s['search-state']}
                        variants={stateVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={stateTransition}
                    >
                        <PatioAutocomplete
                            className={s['autocomplete-input']}
                            searchValue={query}
                            onSearchValueChange={setQuery}
                            options={patios ?? []}
                            isLoading={isFetching}
                            isError={isError}
                            placeholder="Search"
                            onOptionSelect={handleOptionSelect}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="default"
                        className={clsx(s['default-state'])}
                        variants={stateVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={stateTransition}
                    >
                        <img className={s.logo} src="/images/logo-sm.webp" alt="logo" />
                        <div className={s.actions}>
                            <Button id={SEARCH_TRIGGER_ID} variant="surface" size="xl" isIcon onClick={openSearch}>
                                <Search24Icon />
                                <span className="sr-only">Open search bar</span>
                            </Button>
                            {isConnected ? (
                                <XRConnectDialog>
                                    <Button variant="surface" size="xl" isIcon>
                                        <VrHeadset20Icon />
                                        <span className="sr-only">Open XR connect modal</span>
                                    </Button>
                                </XRConnectDialog>
                            ) : null}
                            <ConnectWalletButton />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
