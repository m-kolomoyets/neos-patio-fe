import Logout24Icon from '@/icons/logout_24.svg?react';
import User24Icon from '@/icons/user_24.svg?react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import clsx from 'clsx';
import { useDisconnect } from 'wagmi';
import { Avatar } from 'web3-avatar-react';
import { WithClassName } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import s from './styles.module.css';

export const ConnectWalletButton: React.FC<WithClassName> = ({ className }) => {
    const { disconnect } = useDisconnect();

    return (
        <ConnectButton.Custom>
            {({ account, chain, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                    ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

                return (
                    <div
                        {...(!ready && {
                            'aria-hidden': true,
                            style: {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                            },
                        })}
                        className={clsx(s.wrap, className)}
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <Button
                                        className={s.connect}
                                        type="button"
                                        variant="surface"
                                        size="xl"
                                        title="Connect Wallet"
                                        isIcon
                                        onClick={openConnectModal}
                                    >
                                        <User24Icon />
                                        <span className="sr-only">Connect Wallet</span>
                                    </Button>
                                );
                            }

                            if (chain.unsupported) {
                                return (
                                    <Button
                                        type="button"
                                        variant="surface"
                                        size="xl"
                                        title="Wrong network"
                                        isIcon
                                        onClick={openChainModal}
                                    >
                                        <User24Icon />
                                        <span className="sr-only">Wrong network</span>
                                    </Button>
                                );
                            }

                            return (
                                <Button
                                    className={s.connected}
                                    isIcon
                                    variant="surface"
                                    type="button"
                                    title="Logout"
                                    onClick={() => {
                                        void disconnect();
                                    }}
                                >
                                    <Avatar address={account.address} className={clsx(s.avatar, 'web3-avatar')} />
                                    <span className="sr-only">Logout</span>
                                    <span className={s['logout-overlay']} aria-hidden>
                                        <Logout24Icon className={s.icon} />
                                    </span>
                                </Button>
                            );
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
};
