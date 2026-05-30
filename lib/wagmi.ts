import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: 'Split',
      preference: 'all',
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
});
