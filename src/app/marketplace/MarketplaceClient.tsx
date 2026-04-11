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
import { formatEther, parseEther } from "viem";
import { 
  MARKETPLACE_ADDRESS, 
  MARKETPLACE_ABI,
  NFT_ADDRESS,
  ERC721_ABI 
} from "@/lib/marketplace";

const IPFS_GATEWAY = "https://ipfs.io/ipfs/bafybeidugde7xt3w65absgiv7o5qjkgtrgm4klrpip4viol6ur7mfsaaj4";

export default function MarketplaceClient() {
  const [mounted, setMounted] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();
  const { writeContract } = useWriteContract();

  useEffect(() => { setMounted(true); }, []);

  // Fungsi untuk mengambil daftar NFT yang sedang dijual
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

  // Fungsi MINT
  const handleMint = () => {
    writeContract({
      address: NFT_ADDRESS,
      abi: ERC721_ABI,
      functionName: "mint",
      args: [address],
    });
  };

  // Fungsi LIST/SELL (Approve lalu List)
  const handleList = async (tokenId: bigint, price: bigint) => {
    // Step 1: Approve Marketplace
    writeContract({
      address: NFT_ADDRESS,
      abi: ERC721_ABI,
      functionName: "approve",
      args: [MARKETPLACE_ADDRESS, tokenId],
    });

    // Step 2: List (Beri jeda sedikit agar approve masuk ke blok)
    setTimeout(() => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "listNFT",
        args: [NFT_ADDRESS, tokenId, price],
      });
    }, 5000);
  };

  // Fungsi BUY
  const handleBuy = (tokenId: bigint, price: bigint) => {
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: "buyNFT",
      args: [NFT_ADDRESS, tokenId],
      value: price,
    });
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 font-sans">
      {/* Header & Nav */}
      <nav className="flex justify-between items-center mb-10">
        <h1 className="text-xl font-mono font-bold tracking-tighter">
          0xzvan<span className="text-zinc-600">.nft</span>
        </h1>
        <div className="flex gap-3">
          {isConnected ? (
            <>
              <button 
                onClick={handleMint}
                className="text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 px-4 py-2 rounded-xl hover:bg-emerald-500/10 transition-colors"
              >
                Mint NFT
              </button>
              <button 
                onClick={() => {
                  const id = prompt("Masukkan Token ID yang mau dijual:");
                  const prc = prompt("Masukkan Harga (NEX):");
                  if (id && prc) handleList(BigInt(id), parseEther(prc));
                }}
                className="text-[10px] font-mono border border-sky-500/30 bg-sky-500/5 text-sky-400 px-4 py-2 rounded-xl hover:bg-sky-500/10 transition-colors"
              >
                Sell NFT
              </button>
              <button onClick={() => disconnect()} className="text-[10px] font-mono border border-zinc-800 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800">
                {address?.slice(0,6)}...{address?.slice(-4)}
              </button>
            </>
          ) : (
            <button onClick={() => connect({ connector: injected() })} className="text-[10px] font-mono bg-white text-black px-5 py-2 rounded-xl font-bold">
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {/* NFT Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {listings.length > 0 ? (
          listings.map((item, i) => (
            <div key={i} className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-[2rem] group hover:border-zinc-700 transition-all duration-500">
              <div className="aspect-square bg-zinc-800 rounded-[1.5rem] mb-5 overflow-hidden">
                <img 
                  src={`${IPFS_GATEWAY}/${item.tokenId.toString()}.jpg`} 
                  alt={`Nexus #${item.tokenId.toString()}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400?text=Nexus+NFT"; }}
                />
              </div>
              <div className="px-1 space-y-1">
                <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Nexus #{item.tokenId.toString()}</p>
                <p className="font-mono text-base font-bold text-white">{formatEther(item.price)} NEX</p>
              </div>
              <button 
                onClick={() => handleBuy(item.tokenId, item.price)}
                className="w-full mt-6 py-3.5 bg-white text-black hover:bg-zinc-200 transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest"
              >
                Buy Now
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 text-center border border-dashed border-zinc-900 rounded-[3rem]">
             <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 mb-4">
              <span className="animate-pulse text-xl">🌐</span>
            </div>
            <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-[0.3em]">Waiting for listings on Nexus</p>
          </div>
        )}
      </div>
    </main>
  );
}
