"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useConnect,
  useDisconnect,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { parseEther, formatEther, getAddress } from "viem";
import {
  MARKETPLACE_ADDRESS,
  NFT_ADDRESS,
  MARKETPLACE_ABI,
  ERC721_ABI,
} from "@/lib/marketplace";

const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export default function MarketplaceClient() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();

  // Mencegah Hydration Error di Vercel
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchListings = useCallback(async () => {
    if (!publicClient) return;
    try {
      const logs = await publicClient.getLogs({ 
        address: MARKETPLACE_ADDRESS, 
        event: { type: "event", name: "NFTListed", inputs: [{ name: "seller", type: "address", indexed: true }, { name: "nftAddress", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }, { name: "price", type: "uint256" }]}, 
        fromBlock: 0n 
      });
      // Logic fetch di sini
    } catch (err) { console.error(err); }
  }, [publicClient]);

  useEffect(() => { if (mounted) fetchListings(); }, [mounted, fetchListings]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 font-sans">
      <nav className="flex justify-between items-center mb-12">
        <h1 className="text-xl font-mono">0xzvan<span className="text-zinc-500">.nft</span></h1>
        {isConnected ? (
          <button onClick={() => disconnect()} className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
            {shortAddr(address!)}
          </button>
        ) : (
          <button onClick={() => connect({ connector: injected() })} className="px-4 py-2 rounded-xl bg-white text-black text-xs font-mono">
            Connect
          </button>
        )}
      </nav>
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Marketplace is Live</h2>
        <p className="text-zinc-500 font-mono text-sm">Connected to Nexus Testnet</p>
      </div>
    </main>
  );
}
