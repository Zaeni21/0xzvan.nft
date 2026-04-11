"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  useAccount, 
  useWriteContract, 
  usePublicClient, 
  useConnect, 
  useDisconnect 
} from "wagmi";
import { injected } from "wagmi/connectors";
import { formatEther } from "viem";
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from "@/lib/marketplace";

const NFT_ARTS = ["🌌", "⚡", "🔷", "🌀", "✨", "🔮"];
const nftArt = (id: bigint) => NFT_ARTS[Number(id) % NFT_ARTS.length];

export default function MarketplaceClient() {
  const [mounted, setMounted] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();

  useEffect(() => { setMounted(true); }, []);

  const fetchListings = useCallback(async () => {
    if (!publicClient) return;
    try {
      const logs = await publicClient.getLogs({ 
        address: MARKETPLACE_ADDRESS, 
        event: { 
          type: "event", 
          name: "NFTListed", 
          inputs: [
            { name: "seller", type: "address", indexed: true },
            { name: "nftAddress", type: "address", indexed: true },
            { name: "tokenId", type: "uint256", indexed: true },
            { name: "price", type: "uint256" }
          ]
        }, 
        fromBlock: 0n 
      });
      setListings(logs.map(log => log.args));
    } catch (err) { console.error("Fetch error:", err); }
  }, [publicClient]);

  useEffect(() => { if (mounted) fetchListings(); }, [mounted, fetchListings]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 font-sans">
      <nav className="flex justify-between items-center mb-10">
        <h1 className="text-xl font-mono">0xzvan<span className="text-zinc-600">.nft</span></h1>
        {isConnected ? (
          <button onClick={() => disconnect()} className="text-[10px] font-mono border border-zinc-800 px-3 py-1.5 rounded-lg bg-zinc-900">
            {address?.slice(0,6)}...{address?.slice(-4)}
          </button>
        ) : (
          <button onClick={() => connect({ connector: injected() })} className="text-[10px] font-mono bg-white text-black px-4 py-1.5 rounded-lg font-bold">
            Connect Wallet
          </button>
        )}
      </nav>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {listings.length > 0 ? (
          listings.map((item, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-900 p-4 rounded-2xl group">
              <div className="aspect-square bg-zinc-800 rounded-xl mb-4 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                {nftArt(item.tokenId)}
              </div>
              <p className="font-mono text-[9px] text-zinc-600 mb-1">Nexus #{item.tokenId.toString()}</p>
              <p className="font-mono text-xs font-bold">{formatEther(item.price)} NEX</p>
              <button className="w-full mt-4 py-2 bg-zinc-800 hover:bg-white hover:text-black transition-colors rounded-lg text-[10px] font-bold uppercase tracking-wider">
                Buy NFT
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border border-dashed border-zinc-900 rounded-3xl">
            <p className="text-zinc-700 font-mono text-xs uppercase tracking-widest">No active listings on Nexus</p>
          </div>
        )}
      </div>
    </main>
  );
}
