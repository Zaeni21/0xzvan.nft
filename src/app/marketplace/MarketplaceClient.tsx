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
import { parseEther, formatEther, getAddress } from "viem";
import {
  MARKETPLACE_ADDRESS,
  NFT_ADDRESS,
  MARKETPLACE_ABI,
  ERC721_ABI,
} from "@/lib/marketplace";

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

const PINATA_GATEWAY = "https://scarlet-absent-fox-734.mypinata.cloud/ipfs";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const getIPFSUrl = (uri: string) => {
  if (!uri) return "";
  // Handle ipfs:// protocol or raw CID
  return uri.replace("ipfs://", `${PINATA_GATEWAY}/`);
};

const color = (id: bigint) => {
  const COLORS = ["bg-violet-50", "bg-sky-50", "bg-orange-50", "bg-emerald-50", "bg-pink-50"];
  return COLORS[Number(id) % COLORS.length];
};

// ─── Components (Wallet, Card, Row, Modals) ───────────────────────────────────

function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  if (isConnected && address) {
    return (
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 h-9 px-4 rounded-xl border border-gray-200 bg-white text-sm font-mono hover:border-gray-300">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {short(address)}
        </button>
        {open && (
          <div className="absolute right-0 top-11 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-50">
            <button onClick={() => { disconnect(); setOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs font-mono text-red-500 hover:bg-red-50 transition-colors">
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }
  return <button onClick={() => connect({ connector: connectors[0] })} className="h-9 px-4 rounded-xl bg-[#2081e2] text-white text-sm font-mono">Connect Wallet</button>;
}

function NFTCard({ listing, onBuy, onCancel, onClick, isBuying, isOwner }: any) {
  const price = parseFloat(formatEther(listing.price)).toFixed(3);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-all group bg-white" onClick={() => onClick(listing)}>
      <div className={`aspect-square ${color(listing.tokenId)} flex items-center justify-center`}>
        {listing.image ? (
          <img src={listing.image} alt="NFT" className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl opacity-20">🖼️</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-[10px] font-mono text-[#2081e2]">0xzvan.nft ✓</p>
        <p className="text-sm font-medium truncate">Nexus #{listing.tokenId.toString()}</p>
        <p className="text-sm font-bold font-mono mt-1">{price} NEX</p>
        {isOwner ? (
          <button onClick={e => { e.stopPropagation(); onCancel(listing); }} className="mt-2 w-full h-8 border rounded-xl text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">Cancel</button>
        ) : (
          <button onClick={e => { e.stopPropagation(); onBuy(listing); }} disabled={isBuying} className="mt-2 w-full h-8 bg-[#2081e2] text-white rounded-xl text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
            {isBuying ? "Buying..." : "Buy Now"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Marketplace Page ────────────────────────────────────────────────────

export default function MarketplacePage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [activeBuyKey, setActiveBuyKey] = useState<string | null>(null);

  const { writeContract: writeBuy, data: buyHash, isPending: isBuyPending } = useWriteContract();
  const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({ hash: buyHash });
  const { writeContract: writeCancel, data: cancelHash } = useWriteContract();
  const { isSuccess: isCancelSuccess } = useWaitForTransactionReceipt({ hash: cancelHash });

  const fetchListings = useCallback(async () => {
    if (!publicClient) return;
    setLoading(true);
    try {
      const [listedLogs, soldLogs, canceledLogs] = await Promise.all([
        publicClient.getLogs({ address: MARKETPLACE_ADDRESS, event: { type: "event", name: "NFTListed", inputs: [{ name: "seller", type: "address", indexed: true }, { name: "nftAddress", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }, { name: "price", type: "uint256" }] }, fromBlock: 0n }),
        publicClient.getLogs({ address: MARKETPLACE_ADDRESS, event: { type: "event", name: "NFTSold", inputs: [{ name: "buyer", type: "address", indexed: true }, { name: "nftAddress", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }, { name: "price", type: "uint256" }] }, fromBlock: 0n }),
        publicClient.getLogs({ address: MARKETPLACE_ADDRESS, event: { type: "event", name: "ListingCanceled", inputs: [{ name: "seller", type: "address", indexed: true }, { name: "nftAddress", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }] }, fromBlock: 0n }),
      ]);

      const inactive = new Set<string>();
      [...soldLogs, ...canceledLogs].forEach((log: any) => {
        inactive.add(`${log.args.nftAddress.toLowerCase()}-${log.args.tokenId}`);
      });

      const active: Listing[] = [];
      const seen = new Set<string>();

      for (const log of [...listedLogs].reverse() as any[]) {
        const { seller, nftAddress, tokenId, price } = log.args;
        const key = `${nftAddress.toLowerCase()}-${tokenId}`;

        if (!inactive.has(key) && !seen.has(key)) {
          seen.add(key);

          // Fetch tokenURI directly from NFT contract to get Pinata link
          let image = "";
          try {
            const tokenURI = await publicClient.readContract({
              address: nftAddress as `0x${string}`,
              abi: ERC721_ABI,
              functionName: "tokenURI",
              args: [tokenId],
            }) as string;

            const metaRes = await fetch(getIPFSUrl(tokenURI));
            const metadata = await metaRes.json();
            image = getIPFSUrl(metadata.image);
          } catch (e) {
            console.warn("Failed to fetch metadata for", tokenId);
          }

          active.push({ seller, nftAddress, tokenId, price, image, name: `Nexus #${tokenId}` });
        }
      }
      setListings(active);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [publicClient]);

  useEffect(() => { fetchListings(); }, [fetchListings]);
  useEffect(() => { if (isBuySuccess || isCancelSuccess) { fetchListings(); setActiveBuyKey(null); setSelectedListing(null); } }, [isBuySuccess, isCancelSuccess, fetchListings]);

  const handleBuy = (l: Listing) => {
    setActiveBuyKey(`${l.nftAddress}-${l.tokenId}`);
    writeBuy({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "buyNFT", args: [l.nftAddress as `0x${string}`, l.tokenId], value: l.price });
  };

  const handleCancel = (l: Listing) => {
    writeCancel({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "cancelListing", args: [l.nftAddress as `0x${string}`, l.tokenId] });
  };

  const displayed = tab === "mine" && address 
    ? listings.filter(l => getAddress(l.seller) === getAddress(address)) 
    : listings;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-6 h-16">
        <span className="font-mono font-bold">0xzvan<span className="text-[#2081e2]">.nft</span></span>
        <div className="ml-auto flex items-center gap-3"><WalletButton /></div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Nexus Marketplace</h1>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setTab("all")} className={`px-4 py-1.5 rounded-lg text-xs font-mono ${tab === "all" ? "bg-white shadow-sm" : "text-gray-500"}`}>All Items</button>
            <button onClick={() => setTab("mine")} className={`px-4 py-1.5 rounded-lg text-xs font-mono ${tab === "mine" ? "bg-white shadow-sm" : "text-gray-500"}`}>My Listings</button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-gray-50 animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayed.map(l => (
              <NFTCard 
                key={`${l.nftAddress}-${l.tokenId}`} 
                listing={l} 
                onBuy={handleBuy} 
                onCancel={handleCancel} 
                onClick={setSelectedListing}
                isOwner={address && getAddress(l.seller) === getAddress(address)}
                isBuying={activeBuyKey === `${l.nftAddress}-${l.tokenId}` && (isBuyPending || isBuyConfirming)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
