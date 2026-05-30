'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ACTIVE_CHAIN } from '@/lib/contract';
import { wagmiConfig } from '@/lib/wagmi';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider chain={ACTIVE_CHAIN} miniKit={{ enabled: true, autoConnect: false }}>
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
