import type { XRConnectDialogProps } from './types';
import { useState } from 'react';
import CloudOff80Icon from '@/icons/cloud-off_80.svg?react';
import VrHeadset64Icon from '@/icons/vr-headset_64.svg?react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { useMeasure } from '@/hooks/useMeasure';
import { getXRLoginCodeQueryOptions } from '@/services/xr/queries';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Typography } from '@/components/ui/Typography';
import { formatCode } from './utils/formatCode';
import s from './styles.module.css';

export const XRConnectDialog: React.FC<XRConnectDialogProps> = ({ children }) => {
    const [measures, ref] = useMeasure<HTMLDivElement>();

    const [open, setOpen] = useState(false);

    const { data, isFetching, isError, refetch } = useQuery({
        ...getXRLoginCodeQueryOptions(),
        enabled: open,
    });

    const resolveState = () => {
        if (isError) {
            return 'error';
        } else if (isFetching || !data) {
            return 'loading';
        } else {
            return 'success';
        }
    };
    const state = resolveState();

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger render={children} />
            <Dialog.Portal>
                <Dialog.Backdrop />
                <Dialog.Popup>
                    <AnimatePresence>
                        <motion.div animate={{ height: measures?.height }}>
                            <div ref={ref}>
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={state}
                                        initial={{ x: '110%', opacity: 0 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ x: '-110%', opacity: 0 }}
                                        transition={{ duration: 0.5, type: 'spring', bounce: 0 }}
                                    >
                                        {state === 'loading' ? (
                                            <div key="loading" className={clsx(s['loading-state'], s.state)}>
                                                <Dialog.Title className="sr-only">Generating XR code</Dialog.Title>
                                                <LoadingSpinner className={s.spinner} />
                                            </div>
                                        ) : null}
                                        {state === 'error' ? (
                                            <div key="error" className={clsx(s.state, s['error-state'])}>
                                                <CloudOff80Icon className={s.icon} />
                                                <header className={s.header}>
                                                    <Typography
                                                        variant="display-sm"
                                                        className={s.title}
                                                        render={<Dialog.Title />}
                                                    >
                                                        Couldn&apos;t generate code
                                                    </Typography>
                                                    <Typography
                                                        variant="text-xl"
                                                        className={s.subtitle}
                                                        render={<Dialog.Description />}
                                                    >
                                                        Check your connection and try again
                                                    </Typography>
                                                </header>
                                                <div className={s.actions}>
                                                    <Button
                                                        className={s.cta}
                                                        variant="surface"
                                                        size="xl"
                                                        autoFocus
                                                        onClick={() => {
                                                            void refetch();
                                                        }}
                                                    >
                                                        Try again
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : null}
                                        {state === 'success' && data ? (
                                            <div key="success" className={clsx(s.state, s['success-state'])}>
                                                <header className={s.header}>
                                                    <VrHeadset64Icon className={s.icon} />
                                                    <Typography
                                                        variant="display-sm"
                                                        className={s.title}
                                                        render={<Dialog.Title />}
                                                    >
                                                        XR Login
                                                    </Typography>
                                                </header>
                                                <div className={s['code-slot']}>
                                                    <Typography variant="display-xl" className={s.code}>
                                                        {formatCode(data.code)}
                                                    </Typography>
                                                </div>
                                                <Dialog.Description className="sr-only">
                                                    Use this 6-digit code to pair your XR headset
                                                </Dialog.Description>
                                                <div className={s.actions}>
                                                    <Dialog.Close
                                                        className={s.cta}
                                                        render={
                                                            <Button variant="surface" size="xl">
                                                                Close
                                                            </Button>
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        ) : null}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
