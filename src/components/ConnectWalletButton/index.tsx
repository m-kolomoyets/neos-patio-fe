import User24Icon from '@/icons/user_24.svg?react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Avatar } from 'web3-avatar-react';
import { Button } from '@/components/ui/Button';
import s from './styles.module.css';

export const ConnectWalletButton: React.FC = () => {
    return (
        <ConnectButton.Custom>
            {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
            }) => {
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
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <Button
                                        onClick={openConnectModal}
                                        type="button"
                                        variant="surface"
                                        size="xl"
                                        title="Connect Wallet"
                                        isIcon
                                    >
                                        <User24Icon />
                                        <span className="sr-only">Connect Wallet</span>
                                    </Button>
                                );
                            }

                            if (chain.unsupported) {
                                return (
                                    <Button
                                        onClick={openChainModal}
                                        type="button"
                                        variant="surface"
                                        size="xl"
                                        title="Wrong network"
                                        isIcon
                                    >
                                        <User24Icon />
                                        <span className="sr-only">Wrong network</span>
                                    </Button>
                                );
                            }

                            return (
                                <Button
                                    isIcon
                                    variant="surface"
                                    onClick={openAccountModal}
                                    type="button"
                                    aria-label={account.displayName}
                                    className={s['avatar-button']}
                                >
                                    <Avatar address={account.address} className={s.avatar} />
                                </Button>
                            );
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
};
