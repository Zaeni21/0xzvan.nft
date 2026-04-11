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

  // Tombol Mint
  const handleMint = () => {
    if (!address) return; // Penyelamat dari error TypeScript
    writeContract({
      address: NFT_ADDRESS,
      abi: ERC721_ABI,
      functionName: "mint",
      args: [address], 
    });
  };

  // Tombol Sell/List
  const handleList = async (tokenId: bigint, price: bigint) => {
    if (!address) return;
    writeContract({
      address: NFT_ADDRESS,
      abi: ERC721_ABI,
      functionName: "approve",
      args: [MARKETPLACE_ADDRESS, tokenId],
    });

    setTimeout(() => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "listNFT",
        args: [NFT_ADDRESS, tokenId, price],
      });
    }, 5000);
  };

  // Tombol Buy
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
      <nav className="flex justify-between items-center mb-10">
        <h1 className="text-xl font-mono font-bold">
          0xzvan<span className="text-zinc-600">.nft</span>
        </h1>
        
        <div className="flex gap-2">
          {isConnected ? (
            <>
              <button 
                onClick={handleMint} 
                className="text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
              >
                Mint
              </button>
              <button 
                onClick={() => {
                  const id = prompt("Enter Token ID:");
                  const prc = prompt("Enter Price (NEX):");
                  if (id && prc) handleList(BigInt(id), parseEther(prc));
                }}
                className="text-[10px] font-mono border border-sky-500/30 bg-sky-500/5 text-sky-400 px-3 py-1.5 rounded-lg hover:bg-sky-500/10 transition-colors"
              >
                Sell
              </button>
              <button 
                onClick={() => disconnect()} 
                className="text-[10px] font-mono border border-zinc-800 px-3 py-1.5 rounded-lg bg-zinc-900"
              >
                {address?.slice(0,6)}...
              </button>
            </>
          ) : (
            <button 
              onClick={() => connect({ connector: injected() })} 
              className="text-[10px] font-mono bg-white text-black px-4 py-1.5 rounded-lg font-bold"
            >
              Connect
            </button>
          )}
        </div>
      </nav>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {listings.length > 0 ? (
          listings.map((item, i) => (
            <div key={i} className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-2xl group">
              <div className="aspect-square bg-zinc-800 rounded-xl mb-4 overflow-hidden">
                <img 
                  src={`${IPFS_GATEWAY}/${item.tokenId.toString()}.jpg`} 
                  alt="NFT"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400?text=Nexus+NFT"; }}
                />
              </div>
              <div className="space-y-1 mb-4">
                <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">ID #{item.tokenId.toString()}</p>
                <p className="font-mono text-sm font-bold">{formatEther(item.price)} NEX</p>
              </div>
              
              <button 
                onClick={() => handleBuy(item.tokenId, item.price)}
                className="w-full py-2 bg-white text-black rounded-lg text-[10px] font-bold uppercase hover:bg-zinc-200 transition-colors"
              >
                Buy Now
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border border-dashed border-zinc-900 rounded-3xl">
            <p className="text-zinc-700 font-mono text-[10px] uppercase tracking-widest">No active listings on Nexus</p>
          </div>
        )}
      </div>
    </main>
  );
}
