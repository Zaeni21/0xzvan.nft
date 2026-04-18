"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { ToastProvider } from "@/app/components/Toast";

const nexusTestnet = {
  id: 3945,
  name: "Nexus Testnet",
  nativeCurrency: { name: "Nexus", symbol: "NEX", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet.rpc.nexus.xyz"] } },
  blockExplorers: { default: { name: "NexusScan", url: "https://testnet.explorer.nexus.xyz" } },
} as const;

const config = createConfig({
  chains: [nexusTestnet],
  connectors: [
    farcasterMiniApp(),  // Farcaster MiniApp connector (auto-connect inside Warpcast)
    injected(),          // MetaMask fallback for browser
  ],
  transports: { [nexusTestnet.id]: http() },
});

// Init Farcaster SDK on client
function FarcasterInit() {
  useEffect(() => {
    import("@farcaster/miniapp-sdk").then(({ sdk }) => {
      sdk.actions.ready().catch(() => {}); // signal app is ready to Farcaster client
    }).catch(() => {}); // graceful fail if not in Farcaster
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <FarcasterInit />
          {children}
        </ToastProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
