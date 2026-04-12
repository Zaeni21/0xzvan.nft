"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  useAccount, 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  usePublicClient, 
  useConnect, 
  useDisconnect 
} from "wagmi";
import { formatEther, getAddress, parseEther } from "viem";
import {
  MARKETPLACE_ADDRESS,
  NFT_ADDRESS,
  MARKETPLACE_ABI,
  ERC721_ABI,
} from "@/lib/marketplace";
import { injected } from "wagmi/connectors";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Listing {
  seller: string;
  nftAddress: string;
  tokenId: bigint;
  price: bigint;
  image?: string;
  name?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const fetchMetadata = async (uri: string) => {
  try {
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";
    const url = uri.replace("ipfs://", `https://${gateway}/ipfs/`);
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Metadata fetch error:", err);
    return null;
  }
};

// ─── Marketplace Client ───────────────────────────────────────────────────────
export default function MarketplaceClient() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [activeBuyKey, setActiveBuyKey] = useState<string | null>(null);

  const { writeContract: writeBuy, data: buyHash } = useWriteContract();
  const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({ hash: buyHash });
  const { writeContract: writeCancel, data: cancelHash } = useWriteContract();
  const { isSuccess: isCancelSuccess } = useWaitForTransactionReceipt({ hash: cancelHash });

  // ─── Fetch Logic via Events ────────────────────────────────────────────────
  const fetchListings = useCallback(async () => {
    if (!publicClient) return;
    setLoading(true);
    try {
      // 1. Ambil log event dari blockchain
      const [listedLogs, soldLogs, canceledLogs] = await Promise.all([
        publicClient.getLogs({
          address: MARKETPLACE_ADDRESS,
          event: { type: 'event', name: 'NFTListed', inputs: [{ indexed: true, name: 'seller', type: 'address' }, { indexed: true, name: 'nftAddress', type: 'address' }, { indexed: true, name: 'tokenId', type: 'uint256' }, { name: 'price', type: 'uint256' }] },
          fromBlock: 0n
        }),
        publicClient.getLogs({
          address: MARKETPLACE_ADDRESS,
          event: { type: 'event', name: 'NFTSold', inputs: [{ indexed: true, name: 'buyer', type: 'address' }, { indexed: true, name: 'nftAddress', type: 'address' }, { indexed: true, name: 'tokenId', type: 'uint256' }, { name: 'price', type: 'uint256' }] },
          fromBlock: 0n
        }),
        publicClient.getLogs({
          address: MARKETPLACE_ADDRESS,
          event: { type: 'event', name: 'ListingCanceled', inputs: [{ indexed: true, name: 'seller', type: 'address' }, { indexed: true, name: 'nftAddress', type: 'address' }, { indexed: true, name: 'tokenId', type: 'uint256' }] },
          fromBlock: 0n
        }),
      ]);

      // 2. Filter NFT yang sudah tidak aktif (Terjual atau Dibatalkan)
      const inactive = new Set<string>();
      for (const log of [...soldLogs, ...canceledLogs]) {
        const { nftAddress, tokenId } = log.args as any;
        inactive.add(`${nftAddress.toLowerCase()}-${tokenId}`);
      }

      const active: Listing[] = [];
      const seen = new Set<string>();
      const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";

      // 3. Proses log Listed (Mulai dari yang terbaru/paling bawah)
      for (const log of [...listedLogs].reverse()) {
        const { seller, nftAddress, tokenId, price } = log.args as any;
        const key = `${nftAddress.toLowerCase()}-${tokenId}`;

        if (!inactive.has(key) && !seen.has(key)) {
          seen.add(key);
          try {
            // Ambil Token URI dari NFT Contract
            const tokenUri = await publicClient.readContract({
              address: nftAddress,
              abi: ERC721_ABI,
              functionName: "tokenURI",
              args: [tokenId],
            }) as string;

            // Ambil Metadata dari Pinata/IPFS
            const meta = await fetchMetadata(tokenUri);
            active.push({
              seller, nftAddress, tokenId, price,
              name: meta?.name || `Nexus #${tokenId}`,
              image: meta?.image?.replace("ipfs://", `https://${gateway}/ipfs/`)
            });
          } catch (e) {
            // Jika gagal ambil meta, tetap tampilkan data basic
            active.push({ seller, nftAddress, tokenId, price });
          }
        }
      }
      setListings(active);
    } catch (err) {
      console.error("Fetch listings error:", err);
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  useEffect(() => { 
    fetchListings(); 
  }, [fetchListings, isBuySuccess, isCancelSuccess]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleBuy = (l: Listing) => {
    setActiveBuyKey(`${l.nftAddress}-${l.tokenId}`);
    writeBuy({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: "buyNFT",
      args: [l.nftAddress as `0x${string}`, l.tokenId],
      value: l.price,
    });
  };

  const handleCancel = (l: Listing) => {
    writeCancel({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: "cancelListing",
      args: [l.nftAddress as `0x${string}`, l.tokenId],
    });
  };

  const displayed = tab === "mine" && address
    ? listings.filter(l => getAddress(l.seller) === getAddress(address))
    : listings;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-6">
        <Link href="/" className="font-mono text-sm font-bold tracking-tighter uppercase">
          0xzvan<span className="text-[#2081e2]">.nft</span>
        </Link>
        <div className="flex items-center gap-4">
          {!isConnected ? (
            <button onClick={() => connect({ connector: injected() })} className="h-9 px-5 rounded-full bg-[#2081e2] text-white text-[10px] font-mono font-bold uppercase">Connect</button>
          ) : (
            <button onClick={() => disconnect()} className="h-9 px-5 rounded-full bg-gray-100 text-[10px] font-mono font-bold uppercase">{short(address!)}</button>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">Explore</h1>
            <div className="flex gap-6">
              <button onClick={() => setTab("all")} className={`text-[10px] font-mono font-bold uppercase tracking-widest pb-2 border-b-2 transition-all ${tab === 'all' ? 'border-[#2081e2] text-[#2081e2]' : 'border-transparent text-gray-400'}`}>Market</button>
              <button onClick={() => setTab("mine")} className={`text-[10px] font-mono font-bold uppercase tracking-widest pb-2 border-b-2 transition-all ${tab === 'mine' ? 'border-[#2081e2] text-[#2081e2]' : 'border-transparent text-gray-400'}`}>My Listings</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1,2,3,4].map(i => <div key={i} className="aspect-[4/5] bg-gray-50 rounded-[2rem] animate-pulse" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">No Items Found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayed.map((listing) => {
              const key = `${listing.nftAddress}-${listing.tokenId}`;
              const isOwner = address && getAddress(listing.seller) === getAddress(address);
              const isBuying = activeBuyKey === key && isBuyConfirming;

              return (
                <div 
                  key={key} 
                  onClick={() => setSelectedListing(listing)}
                  className="group bg-gray-50 rounded-[2.5rem] p-4 border border-transparent hover:bg-white hover:border-gray-200 hover:shadow-2xl transition-all duration-500 cursor-pointer"
                >
                  <div className="aspect-square rounded-[2rem] overflow-hidden mb-5 bg-gray-200 relative">
                    <img src={listing.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="px-2">
                    <p className="text-[9px] font-mono font-bold text-[#2081e2] uppercase mb-1">Nexus Network</p>
                    <h3 className="text-lg font-bold mb-5 truncate uppercase tracking-tight">{listing.name}</h3>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-[9px] font-mono text-gray-400 uppercase">Price</p>
                        <p className="font-mono font-bold text-sm">{formatEther(listing.price)} NEX</p>
                      </div>
                      {isOwner ? (
                        <button onClick={(e) => { e.stopPropagation(); handleCancel(listing); }} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-[9px] font-mono font-bold uppercase hover:bg-red-500 hover:text-white transition-all">Cancel</button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); handleBuy(listing); }} disabled={isBuying} className="bg-black text-white px-5 py-2 rounded-xl text-[9px] font-mono font-bold uppercase hover:bg-[#2081e2] disabled:bg-gray-200 transition-all">
                          {isBuying ? "Wait..." : "Buy"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Detail */}
      {selectedListing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedListing(null)}>
          <div className="bg-white rounded-[3rem] overflow-hidden w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={selectedListing.image} className="w-full aspect-square object-cover" alt="" />
            <div className="p-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">{selectedListing.name}</h2>
              <div className="flex justify-between items-center mb-8">
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Seller: {short(selectedListing.seller)}</p>
                <p className="text-xs font-mono font-bold text-[#2081e2]"># {selectedListing.tokenId.toString()}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-gray-400 uppercase">Price</p>
                  <p className="text-2xl font-black font-mono">{formatEther(selectedListing.price)} NEX</p>
                </div>
                <button 
                  onClick={() => handleBuy(selectedListing)}
                  className="bg-[#2081e2] text-white px-8 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-200"
                >
                  Confirm Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
