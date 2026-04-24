import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, phantomWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, fallback, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';

const connectors = connectorsForWallets(
    [
        {
            groupName: 'Recommended',
            wallets: [metaMaskWallet, phantomWallet],
        },
    ],
    {
        appName: 'Neos Patio',
        projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
    }
);

export const wagmiConfig = createConfig({
    connectors,
    chains: [mainnet],
    ssr: false,
    transports: {
        [mainnet.id]: fallback([
            http('https://cloudflare-eth.com'),
            http(`https://rpc.ankr.com/eth/${import.meta.env.VITE_ANKR_API_KEY}`),
        ]),
    },
});
