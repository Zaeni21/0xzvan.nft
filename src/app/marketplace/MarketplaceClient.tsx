"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const fetchMetadata = async (uri: string) => {
  try {
    const res = await fetch(uri);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

// ─── Wallet Button ────────────────────────────────────────────────────────────
function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border border-gray-200 bg-white text-sm font-mono hover:border-gray-300 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {short(address)}
        </button>
        {open && (
          <div className="absolute right-0 top-11 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
            <a
              href={`https://testnet.explorer.nexus.xyz/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2.5 text-xs font-mono text-gray-500 hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              View on Explorer ↗
            </a>
            <button
              onClick={() => { disconnect(); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-xs font-mono text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      className="h-9 px-4 rounded-xl bg-[#2081e2] text-white text-sm font-mono font-medium hover:bg-[#1a6fc4] transition-colors"
    >
      Connect Wallet
    </button>
  );
}

// ─── NFT Card ─────────────────────────────────────────────────────────────────
function NFTCard({
  listing,
  onBuy,
  onCancel,
  onClick,
  isBuying,
  isOwner,
}: {
  listing: Listing;
  onBuy: (l: Listing) => void;
  onCancel: (l: Listing) => void;
  onClick: (l: Listing) => void;
  isBuying: boolean;
  isOwner: boolean;
}) {
  const price = parseFloat(formatEther(listing.price)).toFixed(3);

  return (
    <div
      className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={() => onClick(listing)}
    >
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <img
          src={listing.image}
          alt={listing.name || `Nexus #${listing.tokenId}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://via.placeholder.com/600x600/1f2937/ffffff?text=Nexus+${listing.tokenId}`;
          }}
        />
        <button
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-white/70 flex items-center justify-center text-lg hover:scale-110 transition-transform"
          onClick={(e) => e.stopPropagation()}
        >
          ♡
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-1 text-[10px] font-mono text-[#2081e2] mb-1">
          <span>0xzvan.nft</span>
          <span className="text-blue-400">✓</span>
        </div>
        <p className="text-sm font-medium text-gray-900 mb-2 truncate">
          {listing.name || `Nexus #${listing.tokenId}`}
        </p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-mono text-gray-400">Price</p>
            <p className="text-lg font-bold font-mono text-gray-900">{price} <span className="text-sm text-gray-500">NEX</span></p>
          </div>

          {isOwner ? (
            <button
              onClick={(e) => { e.stopPropagation(); onCancel(listing); }}
              className="px-5 py-1.5 text-xs border border-red-200 text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onBuy(listing); }}
              disabled={isBuying}
              className="px-6 py-1.5 bg-[#2081e2] hover:bg-[#1a6fc4] disabled:bg-gray-300 text-white text-xs font-medium rounded-2xl transition-colors"
            >
              {isBuying ? "Buying…" : "Buy Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NFT Detail Modal ─────────────────────────────────────────────────────────
function NFTModal({
  listing,
  onClose,
  onBuy,
  isOwner,
  isBuying,
}: {
  listing: Listing;
  onClose: () => void;
  onBuy: (l: Listing) => void;
  isOwner: boolean;
  isBuying: boolean;
}) {
  const price = parseFloat(formatEther(listing.price)).toFixed(3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative aspect-square bg-gray-100">
          <img src={listing.image} alt={listing.name || ""} className="w-full h-full object-cover" />
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 text-[#2081e2] text-sm font-mono mb-1">
            0xzvan.nft <span className="text-blue-400">✓</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {listing.name || `Nexus #${listing.tokenId}`}
          </h2>

          <div className="space-y-4 text-sm">
            {[
              { label: "Owner", value: short(listing.seller) },
              { label: "Token ID", value: `#${listing.tokenId}` },
              { label: "Chain", value: "Nexus Testnet" },
              { label: "Platform Fee", value: "2.5%" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between border-b border-gray-100 pb-3 last:border-none">
                <span className="text-gray-500 font-mono text-xs">{item.label}</span>
                <span className="font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <p className="text-xs font-mono text-gray-400 mb-1">Current Price</p>
            <p className="text-3xl font-bold font-mono text-gray-900 mb-6">{price} NEX</p>

            {isOwner ? (
              <button onClick={onClose} className="w-full h-12 border border-red-200 text-red-600 hover:bg-red-50 rounded-2xl font-medium transition-colors">
                Cancel Listing
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => onBuy(listing)}
                  disabled={isBuying}
                  className="flex-1 h-12 bg-[#2081e2] hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-2xl font-medium transition-colors"
                >
                  {isBuying ? "Buying…" : "Buy Now"}
                </button>
                <button onClick={onClose} className="flex-1 h-12 border border-gray-200 hover:bg-gray-50 rounded-2xl font-medium transition-colors">
                  Make Offer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── List NFT Modal ───────────────────────────────────────────────────────────
function ListModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { address } = useAccount();
  const [step, setStep] = useState<0 | 1>(0);
  const [nftAddr, setNftAddr] = useState<`0x${string}`>(NFT_ADDRESS as `0x${string}`);
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("");

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && step === 0) { setStep(1); reset(); }
    if (isSuccess && step === 1) { onSuccess(); onClose(); }
  }, [isSuccess, step, reset, onSuccess, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold">List NFT for Sale</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="flex items-center gap-3 mb-8">
          {["Approve", "List"].map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all
                ${step === i ? "bg-[#2081e2] border-[#2081e2] text-white" : step > i ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-gray-400"}`}>
                {step > i ? "✓" : i + 1}
              </div>
              <div className="ml-3 text-xs font-medium text-gray-600">{label}</div>
              {i === 0 && <div className="flex-1 h-px bg-gray-200 mx-4" />}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs font-mono text-gray-500 block mb-2">NFT Contract</label>
            <input
              value={nftAddr}
              onChange={(e) => setNftAddr(e.target.value as `0x${string}`)}
              disabled={step === 1}
              className="w-full h-11 border border-gray-200 rounded-2xl px-4 text-sm font-mono focus:border-[#2081e2] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-gray-500 block mb-2">Token ID</label>
            <input
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              disabled={step === 1}
              placeholder="123"
              className="w-full h-11 border border-gray-200 rounded-2xl px-4 text-sm font-mono focus:border-[#2081e2] outline-none"
            />
          </div>

          {step === 1 && (
            <div>
              <label className="text-xs font-mono text-gray-500 block mb-2">Price (NEX)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.5"
                  className="w-full h-11 border border-gray-200 rounded-2xl px-4 pr-16 text-sm font-mono focus:border-[#2081e2] outline-none"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-mono text-gray-400">NEX</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            if (step === 0) {
              writeContract({ address: nftAddr as `0x${string}`, abi: ERC721_ABI, functionName: "setApprovalForAll", args: [MARKETPLACE_ADDRESS, true] });
            } else {
              writeContract({
                address: MARKETPLACE_ADDRESS,
                abi: MARKETPLACE_ABI,
                functionName: "listNFT",
                args: [nftAddr as `0x${string}`, BigInt(tokenId), parseEther(price)],
              });
            }
          }}
          disabled={!address || !tokenId || (step === 1 && !price) || isPending || isConfirming}
          className="mt-8 w-full h-12 bg-[#2081e2] hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-2xl transition-colors"
        >
          {isPending || isConfirming
            ? (step === 0 ? "Approving..." : "Listing...")
            : step === 0 ? "Step 1: Approve Contract" : "Step 2: List NFT"}
        </button>

        <p className="text-center text-[10px] text-gray-400 mt-4">2.5% platform fee will be applied</p>
      </div>
    </div>
  );
}

// ─── Main Marketplace Client ──────────────────────────────────────────────────
export default function MarketplaceClient() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<"price_asc" | "price_desc" | "newest">("price_asc");
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [activeBuyKey, setActiveBuyKey] = useState<string | null>(null);

  const { writeContract: writeBuy, data: buyHash, isPending: isBuyPending, reset: resetBuy } = useWriteContract();
  const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({ hash: buyHash });
  const { writeContract: writeCancel } = useWriteContract();
  const { isSuccess: isCancelSuccess } = useWaitForTransactionReceipt({ hash: writeCancel.data });

  // Fetch Listings dari Pinata
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
      [...soldLogs, ...canceledLogs].forEach((log) => {
        const { nftAddress, tokenId } = log.args as any;
        inactive.add(`${nftAddress.toLowerCase()}-${tokenId}`);
      });

      const seen = new Set<string>();
      const active: Listing[] = [];
      const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";

      for (const log of [...listedLogs].reverse()) {
        const { seller, nftAddress, tokenId, price } = log.args as any;
        const key = `${nftAddress.toLowerCase()}-${tokenId}`;

        if (!inactive.has(key) && !seen.has(key)) {
          seen.add(key);

          const metadataUrl = `https://${gateway}/ipfs/${tokenId}.json`;
          const meta = await fetchMetadata(metadataUrl);

          let imageUrl = `https://${gateway}/ipfs/${tokenId}.png`;
          if (meta?.image) {
            imageUrl = meta.image.replace("ipfs://", `https://${gateway}/ipfs/`);
          }

          active.push({
            seller,
            nftAddress,
            tokenId,
            price,
            image: imageUrl,
            name: meta?.name || `Nexus #${tokenId}`,
          });
        }
      }

      setListings(active);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  useEffect(() => {
    if (isBuySuccess || isCancelSuccess) {
      fetchListings();
      resetBuy();
      setActiveBuyKey(null);
      setSelectedListing(null);
    }
  }, [isBuySuccess, isCancelSuccess, fetchListings, resetBuy]);

  const handleBuy = (listing: Listing) => {
    const key = `${listing.nftAddress}-${listing.tokenId}`;
    setActiveBuyKey(key);
    writeBuy({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: "buyNFT",
      args: [listing.nftAddress as `0x${string}`, listing.tokenId],
      value: listing.price,
    });
  };

  const handleCancel = (listing: Listing) => {
    writeCancel({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: "cancelListing",
      args: [listing.nftAddress as `0x${string}`, listing.tokenId],
    });
  };

  const sorted = [...listings].sort((a, b) => {
    if (sort === "price_asc") return Number(a.price - b.price);
    if (sort === "price_desc") return Number(b.price - a.price);
    return 0;
  });

  const displayed = tab === "mine" && address
    ? sorted.filter((l) => getAddress(l.seller) === getAddress(address))
    : sorted;

  const floorPrice = listings.length
    ? Math.min(...listings.map((l) => parseFloat(formatEther(l.price)))).toFixed(3)
    : "—";

  const myListingsCount = address
    ? listings.filter((l) => getAddress(l.seller) === getAddress(address)).length
    : 0;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center px-6 h-16 gap-4">
        <Link href="/" className="font-mono text-sm font-medium shrink-0">
          0xzvan<span className="text-[#2081e2]">.nft</span>
        </Link>

        <div className="flex-1 max-w-sm relative mx-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⌕</span>
          <input
            className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 text-sm outline-none focus:border-[#2081e2] focus:bg-white transition-colors placeholder:text-gray-400"
            placeholder="Search items, collections…"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          {address && (
            <button
              onClick={() => setShowListModal(true)}
              className="h-9 px-4 bg-[#2081e2] text-white rounded-xl text-xs font-mono font-medium hover:bg-[#1a6fc4] transition-colors"
            >
              + List NFT
            </button>
          )}
          <WalletButton />
        </div>
      </nav>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 px-6 border-b border-gray-100 overflow-x-auto">
        {["All", "Art", "Collectibles", "Domain Names", "Music", "Photography", "Sports"].map((cat) => (
          <button key={cat} className="h-11 px-4 text-xs font-mono whitespace-nowrap border-b-2 border-transparent text-gray-500 hover:text-gray-800">
            {cat}
          </button>
        ))}
      </div>

      <main className="p-6">
        {/* Collection Banner */}
        <div className="bg-gradient-to-r from-violet-50 to-sky-50 border border-violet-100 rounded-2xl px-8 py-6 mb-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Nexus NFT Collection</h1>
            <p className="text-xs font-mono text-gray-500 mt-1">0xzvan.nft • Nexus Testnet</p>
          </div>
          <div className="flex gap-10 text-center">
            {[
              { label: "Items", value: listings.length },
              { label: "Floor", value: `${floorPrice} NEX` },
              { label: "Fee", value: "2.5%" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-2xl font-bold font-mono">{item.value}</p>
                <p className="text-[10px] font-mono text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-400">{displayed.length} results</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="h-9 border border-gray-200 rounded-xl px-3 text-xs font-mono bg-white"
            >
              <option value="price_asc">Price Low → High</option>
              <option value="price_desc">Price High → Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          <div className="flex border border-gray-200 rounded-xl overflow-hidden">
            {["grid", "list"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as "grid" | "list")}
                className={`w-9 h-9 flex items-center justify-center text-lg ${view === v ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:bg-gray-50"}`}
              >
                {v === "grid" ? "▦" : "≡"}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl h-[380px] animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🏪</p>
            <p className="text-gray-500">No active listings yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayed.map((listing) => {
              const key = `${listing.nftAddress}-${listing.tokenId}`;
              const isOwner = !!(address && getAddress(listing.seller) === getAddress(address));

              return (
                <NFTCard
                  key={key}
                  listing={listing}
                  onBuy={handleBuy}
                  onCancel={handleCancel}
                  onClick={setSelectedListing}
                  isBuying={activeBuyKey === key && (isBuyPending || isBuyConfirming)}
                  isOwner={isOwner}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedListing && (
        <NFTModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onBuy={(l) => { handleBuy(l); setSelectedListing(null); }}
          isOwner={!!(address && getAddress(selectedListing.seller) === getAddress(address))}
          isBuying={activeBuyKey === `${selectedListing.nftAddress}-${selectedListing.tokenId}` && (isBuyPending || isBuyConfirming)}
        />
      )}

      {showListModal && <ListModal onClose={() => setShowListModal(false)} onSuccess={fetchListings} />}
    </div>
  );
}
