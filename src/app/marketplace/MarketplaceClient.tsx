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

// Gateway IPFS untuk gambar NFT
const IPFS_GATEWAY = "https://ipfs.io/ipfs/bafybeidugde7xt3w65absgiv7o5qjkgtrgm4klrpip4viol6ur7mfsaaj4";

export default function MarketplaceClient() {
  const [mounted, setMounted] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();

  useEffect(() => { 
    setMounted(true); 
  }, []);

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
    } catch (err) { 
      console.error("Fetch error:", err); 
    }
  }, [publicClient]);

  useEffect(() => { 
    if (mounted) fetchListings(); 
  }, [mounted, fetchListings]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 font-sans">
      {/* Navigation */}
      <nav className="flex justify-between items-center mb-10">
        <h1 className="text-xl font-mono font-bold tracking-tighter">
          0xzvan<span className="text-zinc-600">.nft</span>
        </h1>
        <div className="flex gap-3">
          {isConnected ? (
            <>
              <button className="text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 px-4 py-2 rounded-xl hover:bg-emerald-500/10 transition-colors">
                Mint NFT
              </button>
              <button 
                onClick={() => disconnect()} 
                className="text-[10px] font-mono border border-zinc-800 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors"
              >
                {address?.slice(0,6)}...{address?.slice(-4)}
              </button>
            </>
          ) : (
            <button 
              onClick={() => connect({ connector: injected() })} 
              className="text-[10px] font-mono bg-white text-black px-5 py-2 rounded-xl font-bold hover:bg-zinc-200 transition-all"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {/* Grid Listings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {listings.length > 0 ? (
          listings.map((item, i) => (
            <div key={i} className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-[2rem] group hover:border-zinc-700 transition-all duration-500">
              {/* NFT Image from IPFS */}
              <div className="aspect-square bg-zinc-800 rounded-[1.5rem] mb-5 overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                <img 
                  src={`${IPFS_GATEWAY}/${item.tokenId.toString()}.png`} 
                  alt={`Nexus #${item.tokenId.toString()}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback jika .png gagal, coba .jpg atau tampilkan placeholder
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/400?text=Nexus+NFT";
                  }}
                />
              </div>

              <div className="px-1 space-y-1">
                <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                  Nexus #{item.tokenId.toString()}
                </p>
                <p className="font-mono text-base font-bold text-white">
                  {formatEther(item.price)} <span className="text-zinc-500 text-xs">NEX</span>
                </p>
              </div>

              <button className="w-full mt-6 py-3.5 bg-white text-black hover:bg-zinc-200 transition-all rounded-2xl text-[10px] font-black uppercase tracking-[0.15em]">
                Buy Now
              </button>
            </div>
          ))
        ) : (
          /* Empty State */
          <div className="col-span-full py-32 text-center border border-dashed border-zinc-900 rounded-[3rem]">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 mb-4">
              <span className="animate-pulse">🌐</span>
            </div>
            <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-[0.3em]">
              Waiting for listings on Nexus Testnet
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
