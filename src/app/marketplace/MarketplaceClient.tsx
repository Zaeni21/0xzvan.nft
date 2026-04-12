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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const ARTS = ["🌌","⚡","🔷","🌀","✨","🔮","🌊","🔥","💎","🛸"];
const COLORS = [
  "bg-violet-50","bg-sky-50","bg-orange-50","bg-emerald-50",
  "bg-pink-50","bg-yellow-50","bg-cyan-50","bg-red-50","bg-indigo-50","bg-teal-50",
];
const art = (id: bigint) => ARTS[Number(id) % ARTS.length];
const color = (id: bigint) => COLORS[Number(id) % COLORS.length];

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
  const [liked, setLiked] = useState(false);
  const price = parseFloat(formatEther(listing.price)).toFixed(3);

  return (
    <div
      className="border border-gray-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md hover:border-gray-200 transition-all duration-200 group bg-white"
      onClick={() => onClick(listing)}
    >
      {/* Art */}
      <div className={`relative aspect-square ${color(listing.tokenId)} flex items-center justify-center text-5xl`}>
        {art(listing.tokenId)}
        <button
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 border border-gray-100 flex items-center justify-center text-sm hover:scale-110 transition-transform"
          onClick={e => { e.stopPropagation(); setLiked(!liked); }}
        >
          {liked ? "♥" : "♡"}
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center gap-1 text-[10px] font-mono text-[#2081e2] mb-1">
          <span>0xzvan.nft</span>
          <span className="text-blue-400">✓</span>
        </div>
        <p className="text-sm font-medium text-gray-900 mb-2 truncate">
          Nexus #{listing.tokenId.toString()}
        </p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-mono text-gray-400 mb-0.5">Price</p>
            <p className="text-sm font-semibold font-mono text-gray-900">{price} NEX</p>
          </div>
        </div>

        {/* Buy / Cancel button — shows on hover */}
        {isOwner ? (
          <button
            onClick={e => { e.stopPropagation(); onCancel(listing); }}
            className="mt-2 w-full h-8 border border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-500 text-gray-400 rounded-xl text-xs font-mono transition-colors opacity-0 group-hover:opacity-100"
          >
            Cancel Listing
          </button>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onBuy(listing); }}
            disabled={isBuying}
            className="mt-2 w-full h-8 bg-[#2081e2] hover:bg-[#1a6fc4] text-white rounded-xl text-xs font-mono font-medium transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
          >
            {isBuying ? "Buying…" : "Buy Now"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── NFT List Row ─────────────────────────────────────────────────────────────

function NFTRow({
  listing,
  onBuy,
  onCancel,
  onClick,
  isOwner,
}: {
  listing: Listing;
  onBuy: (l: Listing) => void;
  onCancel: (l: Listing) => void;
  onClick: (l: Listing) => void;
  isOwner: boolean;
}) {
  const price = parseFloat(formatEther(listing.price)).toFixed(3);
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-200 transition-all"
      onClick={() => onClick(listing)}
    >
      <div className={`w-12 h-12 rounded-xl ${color(listing.tokenId)} flex items-center justify-center text-2xl flex-shrink-0`}>
        {art(listing.tokenId)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">Nexus #{listing.tokenId.toString()}</p>
        <p className="text-[11px] font-mono text-[#2081e2]">0xzvan.nft ✓</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold font-mono text-gray-900">{price} NEX</p>
        <p className="text-[10px] font-mono text-gray-400">Nexus Testnet</p>
      </div>
      {isOwner ? (
        <button
          onClick={e => { e.stopPropagation(); onCancel(listing); }}
          className="h-8 px-4 border border-gray-200 hover:border-red-300 hover:text-red-500 text-gray-400 rounded-lg text-xs font-mono transition-colors flex-shrink-0"
        >
          Cancel
        </button>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); onBuy(listing); }}
          className="h-8 px-4 bg-[#2081e2] text-white rounded-lg text-xs font-mono hover:bg-[#1a6fc4] transition-colors flex-shrink-0"
        >
          Buy
        </button>
      )}
    </div>
  );
}

// ─── NFT Detail Modal ─────────────────────────────────────────────────────────

function NFTModal({ listing, onClose, onBuy, isOwner, isBuying }: {
  listing: Listing;
  onClose: () => void;
  onBuy: (l: Listing) => void;
  isOwner: boolean;
  isBuying: boolean;
}) {
  const price = parseFloat(formatEther(listing.price)).toFixed(3);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden w-full max-w-[480px] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className={`aspect-square ${color(listing.tokenId)} flex items-center justify-center text-8xl`}>
          {art(listing.tokenId)}
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-[11px] font-mono text-[#2081e2] mb-1">0xzvan.nft ✓</p>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Nexus #{listing.tokenId.toString()}
          </h2>

          {[
            { k: "Owner", v: short(listing.seller), color: "text-[#2081e2]" },
            { k: "Contract", v: short(MARKETPLACE_ADDRESS) },
            { k: "Token ID", v: `#${listing.tokenId.toString()}` },
            { k: "Chain", v: "Nexus Testnet · 3945" },
            { k: "Platform Fee", v: "2.5% (250 bps)" },
          ].map(({ k, v, color: c }) => (
            <div key={k} className="flex justify-between py-2.5 border-b border-gray-50 text-sm">
              <span className="font-mono text-gray-400 text-xs">{k}</span>
              <span className={`font-mono text-xs font-medium ${c ?? "text-gray-700"}`}>{v}</span>
            </div>
          ))}

          <div className="mt-4">
            <p className="text-xs font-mono text-gray-400 mb-1">Current Price</p>
            <p className="text-2xl font-bold font-mono text-gray-900 mb-4">{price} NEX</p>
            {isOwner ? (
              <button
                onClick={onClose}
                className="w-full h-12 border border-gray-200 hover:border-red-300 hover:text-red-500 text-gray-500 rounded-xl text-sm font-mono transition-colors"
              >
                Cancel Listing
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => onBuy(listing)}
                  disabled={isBuying}
                  className="flex-1 h-12 bg-[#2081e2] hover:bg-[#1a6fc4] text-white rounded-xl text-sm font-mono font-medium transition-colors disabled:opacity-50"
                >
                  {isBuying ? "Buying…" : "Buy Now"}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 h-12 border border-gray-200 text-gray-600 rounded-xl text-sm font-mono hover:bg-gray-50 transition-colors"
                >
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">List NFT for Sale</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-5">
          {["Approve","List"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <div className="w-6 h-px bg-gray-200" />}
              <div className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border transition-all
                ${step === i ? "border-[#2081e2] text-[#2081e2] bg-blue-50" : step > i ? "border-green-400 text-green-600 bg-green-50" : "border-gray-200 text-gray-400"}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-medium
                  ${step === i ? "bg-[#2081e2] text-white" : step > i ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                  {step > i ? "✓" : i + 1}
                </span>
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1.5">NFT Contract</label>
            <input className="w-full h-10 border border-gray-200 rounded-xl px-3 text-xs font-mono text-gray-700 outline-none focus:border-[#2081e2] transition-colors" value={nftAddr} onChange={e => setNftAddr(e.target.value as `0x${string}`)} disabled={step === 1} />
          </div>
          <div>
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1.5">Token ID</label>
            <input type="number" className="w-full h-10 border border-gray-200 rounded-xl px-3 text-xs font-mono text-gray-700 outline-none focus:border-[#2081e2] transition-colors" placeholder="0" value={tokenId} onChange={e => setTokenId(e.target.value)} disabled={step === 1} />
          </div>
          {step === 1 && (
            <div>
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1.5">Price (NEX)</label>
              <div className="relative">
                <input type="number" step="0.001" className="w-full h-10 border border-gray-200 rounded-xl px-3 pr-14 text-xs font-mono text-gray-700 outline-none focus:border-[#2081e2] transition-colors" placeholder="0.1" value={price} onChange={e => setPrice(e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-400">NEX</span>
              </div>
              {price && <p className="text-[10px] font-mono text-gray-400 mt-1">≈ {(parseFloat(price) * 1e18).toLocaleString()} wei</p>}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            if (step === 0) {
              writeContract({ address: nftAddr as `0x${string}`, abi: ERC721_ABI, functionName: "setApprovalForAll", args: [MARKETPLACE_ADDRESS, true] });
            } else {
              writeContract({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "listNFT", args: [nftAddr as `0x${string}`, BigInt(tokenId), parseEther(price)] });
            }
          }}
          disabled={!address || !tokenId || (step === 1 && !price) || isPending || isConfirming}
          className="mt-5 w-full h-11 bg-[#2081e2] hover:bg-[#1a6fc4] text-white rounded-xl text-sm font-mono font-medium transition-colors disabled:opacity-40"
        >
          {isPending || isConfirming ? (step === 0 ? "Approving…" : "Listing…") : step === 0 ? "Step 1: Approve →" : "Step 2: List NFT →"}
        </button>
        <p className="text-center text-[10px] font-mono text-gray-400 mt-3">2.5% platform fee on sale</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type View = "grid" | "list";
type Sort = "price_asc" | "price_desc" | "newest";
type Tab = "all" | "mine";

const CATS = ["All","Art","Collectibles","Domain Names","Music","Photography","Sports"];

export default function MarketplacePage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("grid");
  const [sort, setSort] = useState<Sort>("price_asc");
  const [tab, setTab] = useState<Tab>("all");
  const [activeCat, setActiveCat] = useState("All");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [activeBuyKey, setActiveBuyKey] = useState<string | null>(null);

  const { writeContract: writeBuy, data: buyHash, isPending: isBuyPending, reset: resetBuy } = useWriteContract();
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
      for (const log of [...soldLogs, ...canceledLogs]) {
        const { nftAddress, tokenId } = log.args as { nftAddress: string; tokenId: bigint };
        inactive.add(`${nftAddress.toLowerCase()}-${tokenId}`);
      }
      const seen = new Set<string>();
      const active: Listing[] = [];
      for (const log of [...listedLogs].reverse()) {
        const { seller, nftAddress, tokenId, price } = log.args as { seller: string; nftAddress: string; tokenId: bigint; price: bigint };
        const key = `${nftAddress.toLowerCase()}-${tokenId}`;
        if (!inactive.has(key) && !seen.has(key)) { seen.add(key); active.push({ seller, nftAddress, tokenId, price }); }
      }
      setListings(active);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [publicClient]);

  useEffect(() => { fetchListings(); }, [fetchListings]);
  useEffect(() => { if (isBuySuccess || isCancelSuccess) { fetchListings(); resetBuy(); setActiveBuyKey(null); setSelectedListing(null); } }, [isBuySuccess, isCancelSuccess, fetchListings, resetBuy]);

  const handleBuy = (listing: Listing) => {
    setActiveBuyKey(`${listing.nftAddress}-${listing.tokenId}`);
    writeBuy({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "buyNFT", args: [listing.nftAddress as `0x${string}`, listing.tokenId], value: listing.price });
  };
  const handleCancel = (listing: Listing) => {
    writeCancel({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "cancelListing", args: [listing.nftAddress as `0x${string}`, listing.tokenId] });
  };

  // Sort
  const sorted = [...listings].sort((a, b) => {
    if (sort === "price_asc") return Number(a.price - b.price);
    if (sort === "price_desc") return Number(b.price - a.price);
    return 0;
  });

  const displayed = tab === "mine" && address
    ? sorted.filter(l => getAddress(l.seller) === getAddress(address))
    : sorted;

  const floorPrice = listings.length
    ? Math.min(...listings.map(l => parseFloat(formatEther(l.price)))).toFixed(3)
    : "—";

  const myListingsCount = address
    ? listings.filter(l => getAddress(l.seller) === getAddress(address)).length
    : 0;

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center px-6 h-16 gap-4">
        <a href="/" className="font-mono text-sm font-medium shrink-0">
          0xzvan<span className="text-[#2081e2]">.nft</span>
        </a>
        <div className="flex-1 max-w-sm relative mx-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⌕</span>
          <input
            className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 text-sm outline-none focus:border-[#2081e2] focus:bg-white transition-colors placeholder:text-gray-400"
            placeholder="Search items, collections…"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
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

      {/* ── Category tabs ──────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-6 border-b border-gray-100 overflow-x-auto">
        {CATS.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`h-11 px-4 text-xs font-mono whitespace-nowrap border-b-2 transition-all
              ${activeCat === cat ? "border-[#2081e2] text-[#2081e2]" : "border-transparent text-gray-500 hover:text-gray-800"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex min-h-[calc(100vh-112px)]">

        {/* ── Sidebar ────────────────────────────────────────────── */}
        <aside className="hidden lg:block w-56 shrink-0 border-r border-gray-100 p-4 overflow-y-auto">

          {/* My listings toggle */}
          {address && (
            <div className="mb-5">
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-1">
                {(["all","mine"] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 h-7 rounded-lg text-[11px] font-mono transition-all
                      ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    {t === "all" ? "All" : `Mine (${myListingsCount})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="mb-5">
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-2">Status</p>
            {[["Buy Now", listings.length], ["On Auction", 0], ["Has Offers", 0]].map(([label, count]) => (
              <label key={String(label)} className="flex items-center gap-2 py-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked={label === "Buy Now"} className="accent-[#2081e2] w-3.5 h-3.5" />
                <span className="text-xs text-gray-600 flex-1">{label}</span>
                <span className="text-[10px] font-mono text-gray-300">{String(count)}</span>
              </label>
            ))}
          </div>

          {/* Price range */}
          <div className="mb-5">
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-2">Price Range</p>
            <div className="flex gap-2 mb-2">
              <input className="flex-1 h-8 border border-gray-200 rounded-lg px-2 text-xs font-mono outline-none focus:border-[#2081e2]" placeholder="Min" />
              <input className="flex-1 h-8 border border-gray-200 rounded-lg px-2 text-xs font-mono outline-none focus:border-[#2081e2]" placeholder="Max" />
            </div>
            <button className="w-full h-8 bg-[#2081e2] text-white rounded-lg text-xs font-mono hover:bg-[#1a6fc4] transition-colors">Apply</button>
          </div>

          {/* Network */}
          <div className="mb-5">
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-2">Network</p>
            <label className="flex items-center gap-2 py-1 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[#2081e2] w-3.5 h-3.5" />
              <span className="text-xs text-gray-600 flex-1">Nexus Testnet</span>
              <span className="text-[10px] font-mono text-gray-300">{listings.length}</span>
            </label>
          </div>
        </aside>

        {/* ── Main content ───────────────────────────────────────── */}
        <main className="flex-1 p-4 md:p-6">

          {/* Collection banner */}
          <div className="bg-gradient-to-r from-violet-50 to-sky-50 border border-violet-100 rounded-2xl px-8 py-6 mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Nexus NFT Collection</h1>
              <p className="text-xs font-mono text-gray-500">0xzvan.nft · Nexus Testnet · Chain 3945</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-green-700 bg-green-100 border border-green-200 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
                <span className="text-[11px] font-mono text-gray-400">{short(MARKETPLACE_ADDRESS)}</span>
              </div>
            </div>
            <div className="flex gap-8 text-center">
              {[
                { label: "Items", value: listings.length.toString() },
                { label: "Floor", value: `${floorPrice} NEX` },
                { label: "Fee", value: "2.5%" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-lg font-semibold font-mono text-gray-900">{value}</p>
                  <p className="text-[10px] font-mono text-gray-400">{label}</p>
                </div>
              ))}
            </div>
            <span className="text-5xl hidden sm:block">🌌</span>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-5 gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-400">{displayed.length} results</span>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as Sort)}
                className="h-8 border border-gray-200 rounded-lg px-2 text-xs font-mono text-gray-700 outline-none cursor-pointer bg-white"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              {(["grid","list"] as View[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`w-8 h-8 flex items-center justify-center text-sm transition-colors
                    ${view === v ? "bg-gray-100 text-gray-800" : "bg-white text-gray-400 hover:bg-gray-50"}`}
                >
                  {v === "grid" ? "▦" : "≡"}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className={view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
              : "flex flex-col gap-3"}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-gray-100 rounded-2xl">
              <span className="text-4xl mb-4">🏪</span>
              <p className="text-sm text-gray-500 mb-1 font-mono">
                {tab === "mine" ? "No active listings" : "No NFTs listed yet"}
              </p>
              {address && tab === "all" && (
                <button
                  onClick={() => setShowListModal(true)}
                  className="mt-4 h-9 px-5 bg-[#2081e2] text-white rounded-xl text-xs font-mono hover:bg-[#1a6fc4] transition-colors"
                >
                  List your first NFT →
                </button>
              )}
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {displayed.map(listing => {
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
          ) : (
            <div className="flex flex-col gap-3">
              {displayed.map(listing => {
                const isOwner = !!(address && getAddress(listing.seller) === getAddress(address));
                return (
                  <NFTRow
                    key={`${listing.nftAddress}-${listing.tokenId}`}
                    listing={listing}
                    onBuy={handleBuy}
                    onCancel={handleCancel}
                    onClick={setSelectedListing}
                    isOwner={isOwner}
                  />
                );
              })}
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={fetchListings}
            disabled={loading}
            className="mt-6 text-xs font-mono text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <span className={loading ? "animate-spin" : ""}>↻</span>
            Refresh
          </button>
        </main>
      </div>

      {/* ── NFT Detail Modal ──────────────────────────────────────── */}
      {selectedListing && (
        <NFTModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onBuy={listing => { handleBuy(listing); setSelectedListing(null); }}
          isOwner={!!(address && getAddress(selectedListing.seller) === getAddress(address))}
          isBuying={activeBuyKey === `${selectedListing.nftAddress}-${selectedListing.tokenId}` && (isBuyPending || isBuyConfirming)}
        />
      )}

      {/* ── List NFT Modal ────────────────────────────────────────── */}
      {showListModal && (
        <ListModal
          onClose={() => setShowListModal(false)}
          onSuccess={fetchListings}
        />
      )}
    </div>
  );
}
