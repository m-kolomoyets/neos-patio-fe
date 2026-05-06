import type { Patio } from '@/services/patios/types';
import React from 'react';
import Search24Icon from '@/icons/search_24.svg?react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { getPatiosListAllQueryOptions } from '@/services/patios/queries';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { Button } from '@/components/ui/Button';
import { SEARCH_TRIGGER_ID } from './constants';
import { useHomeNavigate } from '../../hooks/useHomeRouteApi';
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
    const navigate = useHomeNavigate();
    const { isSearchOpened, openSearch, query, setQuery, wrapRef } = useActionBarSearch();

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
        setQuery('');
        navigate({
            to: '/patios/$id',
            params: {
                id: option.id,
            },
        });
    };

    return (
        <div ref={wrapRef} className={s.shell}>
            <AnimatePresence mode="popLayout" initial={false}>
                {isSearchOpened ? (
                    <motion.div
                        key="search"
                        className={s.searchState}
                        variants={stateVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={stateTransition}
                    >
                        <PatioAutocomplete
                            className={s.autocompleteInput}
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
                        className={clsx(s.defaultState, 'surface-regular')}
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
                            </Button>
                            <ConnectWalletButton />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
