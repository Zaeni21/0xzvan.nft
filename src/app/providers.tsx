"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";

// Definisikan Network Nexus secara manual
const nexusTestnet = {
  id: 3945,
  name: 'Nexus Testnet',
  nativeCurrency: { name: 'Nexus', symbol: 'NEX', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.rpc.nexus.xyz'] },
  },
  blockExplorers: {
    default: { name: 'NexusScan', url: 'https://testnet.explorer.nexus.xyz' },
  },
} as const;

const config = createConfig({
  chains: [nexusTestnet],
  connectors: [injected()],
  transports: {
    [nexusTestnet.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
