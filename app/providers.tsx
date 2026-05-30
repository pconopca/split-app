'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { createPublicClient, http, type PublicClient } from 'viem';
import { mainnet, base } from 'viem/chains';
import { ACTIVE_CHAIN } from '@/lib/contract';
import { wagmiConfig } from '@/lib/wagmi';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  // OnchainKit resolves Basenames via Ethereum mainnet ENS + CCIP-Read.
  // The viem default mainnet RPC (eth.merkle.io) is unreliable from the
  // browser, so wire in our own clients with stable public endpoints.
  //
  // The cast to Record<number, PublicClient> is needed because OnchainKit
  // ships its own viem types that diverge from ours; the runtime client
  // is identical.
  const defaultPublicClients = useMemo<Record<number, PublicClient>>(
    () =>
      ({
        [mainnet.id]: createPublicClient({
          chain: mainnet,
          transport: http('https://eth.llamarpc.com'),
        }),
        [base.id]: createPublicClient({
          chain: base,
          transport: http('https://mainnet.base.org'),
        }),
      }) as Record<number, PublicClient>,
    [],
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          chain={ACTIVE_CHAIN}
          miniKit={{ enabled: true, autoConnect: false }}
          defaultPublicClients={defaultPublicClients}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
