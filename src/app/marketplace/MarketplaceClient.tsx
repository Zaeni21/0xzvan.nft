"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  useAccount, 
  useWriteContract, 
  usePublicClient, 
  useConnect, 
  useDisconnect,
  useSwitchChain 
} from "wagmi";
import { injected } from "wagmi/connectors";
import { formatEther, parseEther } from "viem";
import { 
  MARKETPLACE_ADDRESS, 
  MARKETPLACE_ABI,
  NFT_ADDRESS,
  ERC721_ABI 
} from "@/lib/marketplace";

// KONFIGURASI NEXUS TESTNET
const NEXUS_CHAIN_ID = 3945; 
const IPFS_GATEWAY = "https://ipfs.io/ipfs/bafybeidugde7xt3w65absgiv7o5qjkgtrgm4klrpip4viol6ur7mfsaaj4";

export default function MarketplaceClient() {
  const [mounted, setMounted] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const { address, isConnected, chainId } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContract } = useWriteContract();

  useEffect(() => { setMounted(true); }, []);

  // 1. FUNGSI AMBIL DATA LISTING (FETCH)
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
      // Filter data agar tidak duplikat dan pastikan unik per Token ID
      const uniqueListings = logs.map(log => log.args);
      setListings(uniqueListings);
    } catch (err) { console.error("Fetch error:", err); }
  }, [publicClient]);

  useEffect(() => { if (mounted) fetchListings(); }, [mounted, fetchListings]);

  // 2. FUNGSI MINT NFT
  const handleMint = async () => {
    if (!address) return;
    if (chainId !== NEXUS_CHAIN_ID) await switchChain({ chainId: NEXUS_CHAIN_ID });

    writeContract({
      address: NFT_ADDRESS,
      abi: ERC721_ABI,
      functionName: "mint",
      args: [address],
    });
  };

  // 3. FUNGSI SELL/LIST NFT (Approve + List)
  const handleList = async () => {
    if (!address) return;
    const id = prompt("Masukkan Token ID NFT (Contoh: 1):");
    const prc = prompt("Masukkan Harga Jual dalam NEX (Contoh: 0.1):");
    
    if (!id || !prc) return;
    if (chainId !== NEXUS_CHAIN_ID) await switchChain({ chainId: NEXUS_CHAIN_ID });

    // Step 1: Approve Marketplace
    writeContract({
      address: NFT_ADDRESS,
      abi: ERC721_ABI,
      functionName: "approve",
      args: [MARKETPLACE_ADDRESS, BigInt(id)],
    });

    // Step 2: List ke Contract (Otomatis panggil setelah approve biasanya manual di wallet)
    alert("Konfirmasi APPROVE dulu di wallet. Setelah sukses, tunggu 5-10 detik lalu konfirmasi LISTING.");
    
    setTimeout(() => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "listNFT",
        args: [NFT_ADDRESS, BigInt(id), parseEther(prc)],
      });
    }, 8000); 
  };

  // 4. FUNGSI BUY NFT
  const handleBuy = async (tokenId: bigint, price: bigint) => {
    if (!address) return;
    if (chainId !== NEXUS_CHAIN_ID) await switchChain({ chainId: NEXUS_CHAIN_ID });

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
    <main className="min-h-screen bg-[#0a0a0b] text-white p-6 font-sans selection:bg-emerald-500/30">
      {/* NAVBAR */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-16 px-4">
        <h1 className="text-2xl font-black tracking-tighter italic">
          0xzvan<span className="text-zinc-800">.nft</span>
        </h1>
        
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <button onClick={handleMint} className="text-[10px] font-mono font-bold border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 px-5 py-2.5 rounded-2xl hover:bg-emerald-500/10 transition-all active:scale-95">
                MINT
              </button>
              <button onClick={handleList} className="text-[10px] font-mono font-bold border border-sky-500/20 bg-sky-500/5 text-sky-400 px-5 py-2.5 rounded-2xl hover:bg-sky-500/10 transition-all active:scale-95">
                SELL
              </button>
              <div className="h-8 w-[1px] bg-zinc-900 mx-2" />
              <button onClick={() => disconnect()} className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-2xl hover:bg-zinc-800 transition-all">
                {address?.slice(0,6)}...{address?.slice(-4)}
              </button>
            </>
          ) : (
            <button onClick={() => connect({ connector: injected() })} className="text-[10px] font-mono bg-white text-black px-6 py-2.5 rounded-2xl font-black uppercase tracking-tight hover:bg-zinc-200 transition-all">
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {/* MARKETPLACE GRID */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {listings.length > 0 ? (
            listings.map((item, i) => (
              <div key={i} className="group relative bg-zinc-900/20 border border-zinc-900/50 p-5 rounded-[2.5rem] hover:border-zinc-700 transition-all duration-500">
                {/* Image Container */}
                <div className="aspect-square bg-zinc-900 rounded-[2rem] mb-6 overflow-hidden relative">
                  <img 
                    src={`${IPFS_GATEWAY}/${item.tokenId.toString()}.jpg`} 
                    alt="Nexus NFT"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400?text=Nexus+NFT"; }}
                  />
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    <p className="text-[9px] font-mono font-bold">#{item.tokenId.toString()}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="px-2 space-y-1 mb-6">
                  <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.2em]">Nexus Testnet Collection</p>
                  <div className="flex justify-between items-end">
                    <p className="font-mono text-xl font-black text-white">{formatEther(item.price)} <span className="text-zinc-500 text-xs">NEX</span></p>
                  </div>
                </div>

                {/* Buy Button */}
                <button 
                  onClick={() => handleBuy(item.tokenId, item.price)}
                  className="w-full py-4 bg-white text-black hover:bg-zinc-200 transition-all rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 shadow-xl shadow-white/5"
                >
                  Buy Now
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-zinc-900/50 rounded-[4rem]">
               <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl animate-pulse">📦</span>
               </div>
               <h2 className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em]">No Active Listings on Nexus</h2>
               <p className="text-zinc-800 text-xs mt-2">Mint an NFT and be the first to sell!</p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER BORDER */}
      <footer className="max-w-7xl mx-auto mt-32 border-t border-zinc-900 pt-8 pb-16 px-4">
        <p className="text-zinc-800 font-mono text-[9px] uppercase tracking-widest text-center">
          Powered by Nexus Network • Chain ID {NEXUS_CHAIN_ID}
        </p>
      </footer>
    </main>
  );
}
