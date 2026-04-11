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

// KONFIGURASI JARINGAN NEXUS SESUAI REQUEST
const CHAIN_ID = 3945;
const CHAIN_ID_HEX = `0x${CHAIN_ID.toString(16)}`;
const RPC_URL = 'https://testnet.rpc.nexus.xyz';
const EXPLORER_URL = 'https://testnet.explorer.nexus.xyz';
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

  // 1. FUNGSI AMBIL DATA LISTING
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

  // 2. FUNGSI VALIDASI JARINGAN (MEMASTIKAN 3945)
  const validateNetwork = async () => {
    if (chainId !== CHAIN_ID) {
      alert(`Jaringan salah! Menukar ke Nexus Testnet (${CHAIN_ID_HEX})`);
      try {
        await switchChain({ chainId: CHAIN_ID });
        return false;
      } catch (e) {
        return false;
      }
    }
    return true;
  };

  // 3. FUNGSI MINT
  const handleMint = async () => {
    if (!address) return;
    const isReady = await validateNetwork();
    if (!isReady) return;

    writeContract({
      address: NFT_ADDRESS,
      abi: ERC721_ABI,
      functionName: "mint",
      args: [address],
    });
  };

  // 4. FUNGSI SELL (APPROVE + LIST)
  const handleList = async () => {
    if (!address) return;
    const isReady = await validateNetwork();
    if (!isReady) return;

    const id = prompt("Token ID NFT:");
    const prc = prompt("Harga (NEX):");
    if (!id || !prc) return;

    // Langkah 1: Approve
    writeContract({
      address: NFT_ADDRESS,
      abi: ERC721_ABI,
      functionName: "approve",
      args: [MARKETPLACE_ADDRESS, BigInt(id)],
    });

    // Langkah 2: List (Tunggu konfirmasi approve)
    alert("Konfirmasi APPROVE di wallet. Tunggu 8 detik, lalu konfirmasi LISTING.");
    setTimeout(() => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "listNFT",
        args: [NFT_ADDRESS, BigInt(id), parseEther(prc)],
      });
    }, 8000);
  };

  // 5. FUNGSI BUY
  const handleBuy = async (tokenId: bigint, price: bigint) => {
    if (!address) return;
    const isReady = await validateNetwork();
    if (!isReady) return;

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
    <main className="min-h-screen bg-[#050505] text-white p-6">
      {/* HEADER */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center py-8 border-b border-zinc-900 mb-12">
        <div className="group cursor-pointer">
          <h1 className="text-2xl font-black tracking-tighter italic group-hover:text-emerald-500 transition-colors">
            0XZVAN<span className="text-zinc-700">.NFT</span>
          </h1>
          <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.4em]">Nexus Testnet {CHAIN_ID_HEX}</p>
        </div>

        <div className="flex items-center gap-4">
          {isConnected ? (
            <>
              <button onClick={handleMint} className="px-5 py-2.5 bg-emerald-600/10 border border-emerald-600/30 text-emerald-400 text-[10px] font-bold rounded-2xl hover:bg-emerald-600/20 transition-all active:scale-95">MINT</button>
              <button onClick={handleList} className="px-5 py-2.5 bg-sky-600/10 border border-sky-600/30 text-sky-400 text-[10px] font-bold rounded-2xl hover:bg-sky-600/20 transition-all active:scale-95">SELL</button>
              <button onClick={() => disconnect()} className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-mono rounded-2xl">
                {address?.slice(0,6)}...
              </button>
            </>
          ) : (
            <button onClick={() => connect({ connector: injected() })} className="px-7 py-3 bg-white text-black text-[11px] font-black rounded-2xl uppercase tracking-widest hover:bg-zinc-200 transition-all">Connect Wallet</button>
          )}
        </div>
      </nav>

      {/* GRID */}
      <div className="max-w-7xl mx-auto">
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {listings.map((item, i) => (
              <div key={i} className="bg-zinc-900/20 border border-zinc-900 p-5 rounded-[2.5rem] group hover:border-zinc-700 transition-all">
                <div className="aspect-square bg-zinc-900 rounded-[1.8rem] mb-6 overflow-hidden relative shadow-2xl">
                  <img 
                    src={`${IPFS_GATEWAY}/${item.tokenId.toString()}.jpg`} 
                    alt="NFT"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400?text=Nexus+NFT"; }}
                  />
                </div>
                <div className="flex justify-between items-end mb-6 px-2">
                  <div>
                    <p className="text-zinc-600 text-[9px] uppercase font-bold tracking-widest mb-1">Price Tag</p>
                    <p className="text-xl font-black">{formatEther(item.price)} <span className="text-[10px] text-zinc-700 font-mono italic">NEX</span></p>
                  </div>
                  <p className="text-zinc-700 font-mono text-[10px]">ID #{item.tokenId.toString()}</p>
                </div>
                <button 
                  onClick={() => handleBuy(item.tokenId, item.price)}
                  className="w-full py-4 bg-white text-black text-[11px] font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-white/5 hover:shadow-white/10"
                >
                  Buy NFT
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-zinc-900 rounded-[4rem]">
            <div className="w-20 h-20 bg-zinc-900/50 rounded-full flex items-center justify-center mb-6 animate-pulse border border-zinc-800">
               <span className="text-3xl">📦</span>
            </div>
            <h3 className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.5em] mb-2">Nexus Shelf Empty</h3>
            <p className="text-zinc-800 text-[10px] max-w-[200px] text-center leading-relaxed font-mono">No listings found on chain {CHAIN_ID}. Be the first to mint!</p>
          </div>
        )}
      </div>

      <footer className="max-w-7xl mx-auto mt-40 pt-10 border-t border-zinc-900 flex justify-between items-center px-4">
        <p className="text-zinc-800 font-mono text-[8px] uppercase tracking-[0.6em]">Nexus Protocol</p>
        <a href={EXPLORER_URL} target="_blank" className="text-zinc-800 font-mono text-[8px] uppercase tracking-[0.6em] hover:text-zinc-500">View Explorer</a>
      </footer>
    </main>
  );
}
