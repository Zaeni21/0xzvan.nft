"use client";

/**
 * @file app/marketplace/page.tsx — Redesigned
 * Premium dark Web3 marketplace UI
 * Stack: Next.js 14 · wagmi v2 · viem · Tailwind CSS
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useConnect,
  useDisconnect,
} from "wagmi";
import { injected } from "wagmi/connectors";
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
  blockNumber: bigint;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const NFT_ARTS = ["🌌", "⚡", "🔷", "🌀", "✨", "🔮", "🌊", "🔥", "💎", "🛸"];
const nftArt = (id: bigint) => NFT_ARTS[Number(id) % NFT_ARTS.length];

// Gradient per tokenId for card bg
const CARD_GRADIENTS = [
  "from-violet-950 via-zinc-950 to-zinc-950",
  "from-sky-950 via-zinc-950 to-zinc-950",
  "from-emerald-950 via-zinc-950 to-zinc-950",
  "from-rose-950 via-zinc-950 to-zinc-950",
  "from-amber-950 via-zinc-950 to-zinc-950",
  "from-indigo-950 via-zinc-950 to-zinc-950",
  "from-cyan-950 via-zinc-950 to-zinc-950",
  "from-fuchsia-950 via-zinc-950 to-zinc-950",
  "from-teal-950 via-zinc-950 to-zinc-950",
  "from-orange-950 via-zinc-950 to-zinc-950",
];
const cardGradient = (id: bigint) =>
  CARD_GRADIENTS[Number(id) % CARD_GRADIENTS.length];

// ─── Wallet Button ────────────────────────────────────────────────────────────

function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:border-zinc-600 transition-all font-mono text-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {shortAddr(address)}
          <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 top-12 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Connected</p>
              <p className="font-mono text-xs text-white mt-0.5">{shortAddr(address)}</p>
            </div>
            <button
              onClick={() => { disconnect(); setOpen(false); }}
              className="w-full px-4 py-3 text-left font-mono text-xs text-red-400 hover:bg-zinc-800 transition-colors"
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
      onClick={() => connect({ connector: injected() })}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-mono text-sm font-medium hover:bg-zinc-100 transition-all"
    >
      Connect Wallet
    </button>
  );
}

// ─── Tx Status Bar ────────────────────────────────────────────────────────────

function TxBar({ hash, isPending, isConfirming, isSuccess }: {
  hash?: string; isPending: boolean; isConfirming: boolean; isSuccess: boolean;
}) {
  if (!isPending && !isConfirming && !isSuccess) return null;

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border font-mono text-xs shadow-2xl backdrop-blur-sm transition-all
      ${isSuccess
        ? "bg-emerald-950/90 border-emerald-700/50 text-emerald-300"
        : "bg-zinc-900/90 border-zinc-700/50 text-zinc-300"
      }`}>
      <span className={`w-2 h-2 rounded-full ${isSuccess ? "bg-emerald-400" : "bg-sky-400 animate-pulse"}`} />
      {isPending ? "Waiting for wallet…" : isConfirming ? "Confirming on-chain…" : "Transaction confirmed!"}
      {hash && (
        <a
          href={`https://testnet.explorer.nexus.xyz/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-sky-400 hover:text-sky-300 underline underline-offset-2"
        >
          Explorer ↗
        </a>
      )}
    </div>
  );
}

// ─── NFT Card ─────────────────────────────────────────────────────────────────

function NFTCard({ listing, onBuy, onCancel, isBuying }: {
  listing: Listing;
  onBuy: (l: Listing) => void;
  onCancel: (l: Listing) => void;
  isBuying: boolean;
}) {
  const { address } = useAccount();
  const isSeller = address && getAddress(listing.seller) === getAddress(address);
  const priceDisplay = parseFloat(formatEther(listing.price)).toFixed(3);

  return (
    <div className="group relative bg-zinc-950 border border-zinc-800/80 hover:border-zinc-600 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/50 hover:-translate-y-0.5">
      {/* Card art area */}
      <div className={`relative aspect-square bg-gradient-to-br ${cardGradient(listing.tokenId)} flex items-center justify-center overflow-hidden`}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />
        <span className="text-6xl relative z-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
          {nftArt(listing.tokenId)}
        </span>
        {/* Token ID badge */}
        <span className="absolute top-3 left-3 font-mono text-[10px] text-zinc-400 bg-black/50 backdrop-blur-sm border border-zinc-700/50 px-2 py-1 rounded-lg">
          #{listing.tokenId.toString()}
        </span>
        {/* Seller badge */}
        {isSeller && (
          <span className="absolute top-3 right-3 font-mono text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-lg">
            Yours
          </span>
        )}
      </div>

      {/* Card info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <p className="font-semibold text-sm text-white tracking-tight">
            Nexus #{listing.tokenId.toString()}
          </p>
        </div>
        <p className="font-mono text-[10px] text-zinc-600 mb-4 truncate">
          by {shortAddr(listing.seller)}
        </p>

        {/* Price + action */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-zinc-900 rounded-xl px-3 py-2">
            <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">Price</p>
            <p className="font-mono text-sm font-medium text-white">{priceDisplay} <span className="text-zinc-400">NEX</span></p>
          </div>
          {isSeller ? (
            <button
              onClick={() => onCancel(listing)}
              className="px-3 py-2 rounded-xl border border-zinc-700 hover:border-red-500/50 hover:bg-red-500/5 text-zinc-500 hover:text-red-400 font-mono text-xs transition-all"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => onBuy(listing)}
              disabled={isBuying || !address}
              className="flex-1 py-2 rounded-xl bg-white hover:bg-zinc-100 text-black font-mono text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              {isBuying ? "…" : "Buy"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── List NFT Form ────────────────────────────────────────────────────────────

function ListNFTForm({ onSuccess }: { onSuccess: () => void }) {
  const { address } = useAccount();
  const [step, setStep] = useState<0 | 1>(0); // 0 = approve, 1 = list
  const [nftAddr, setNftAddr] = useState(NFT_ADDRESS);
  const [tokenId, setTokenId] = useState("");
  const [priceEth, setPriceEth] = useState("");

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && step === 0) { setStep(1); reset(); }
    if (isSuccess && step === 1) { onSuccess(); reset(); setStep(0); setTokenId(""); setPriceEth(""); }
  }, [isSuccess, step, reset, onSuccess]);

  const weiLabel = priceEth
    ? `≈ ${(parseFloat(priceEth) * 1e18).toLocaleString()} wei`
    : "";

  return (
    <div className="max-w-lg">
      {/* Contract addresses */}
      <div className="mb-6 grid grid-cols-2 gap-2">
        {[
          { label: "Marketplace", addr: MARKETPLACE_ADDRESS },
          { label: "NFT Contract", addr: NFT_ADDRESS },
        ].map(({ label, addr }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
            <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="font-mono text-xs text-sky-400">{shortAddr(addr)}</p>
          </div>
        ))}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-7">
        {(["Approve", "List NFT"] as const).map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            {i > 0 && <div className="w-8 h-px bg-zinc-800" />}
            <div className={`flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-xl border transition-all
              ${step === i
                ? "border-white/20 text-white bg-white/5"
                : step > i
                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                : "border-zinc-800 text-zinc-600"
              }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium
                ${step === i ? "bg-white text-black" : step > i ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-500"}`}>
                {step > i ? "✓" : i + 1}
              </span>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block mb-2">NFT Contract Address</label>
          <input
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl px-4 py-3 font-mono text-xs text-white outline-none transition-colors placeholder:text-zinc-700"
            value={nftAddr}
            onChange={e => setNftAddr(e.target.value)}
            disabled={step === 1}
          />
        </div>
        <div>
          <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block mb-2">Token ID</label>
          <input
            type="number"
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl px-4 py-3 font-mono text-xs text-white outline-none transition-colors placeholder:text-zinc-700"
            placeholder="0"
            value={tokenId}
            onChange={e => setTokenId(e.target.value)}
            disabled={step === 1}
          />
        </div>
        {step === 1 && (
          <div>
            <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block mb-2">Price (NEX)</label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl px-4 py-3 font-mono text-xs text-white outline-none transition-colors placeholder:text-zinc-700 pr-20"
                placeholder="0.1"
                value={priceEth}
                onChange={e => setPriceEth(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-500">NEX</span>
            </div>
            {weiLabel && <p className="font-mono text-[10px] text-zinc-600 mt-1.5">{weiLabel}</p>}
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => {
          if (step === 0) {
            writeContract({ address: nftAddr as `0x${string}`, abi: ERC721_ABI, functionName: "approve", args: [MARKETPLACE_ADDRESS, BigInt(tokenId || 0)] });
          } else {
            writeContract({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "listNFT", args: [nftAddr as `0x${string}`, BigInt(tokenId), parseEther(priceEth)] });
          }
        }}
        disabled={!address || !tokenId || (step === 1 && !priceEth) || isPending || isConfirming}
        className="mt-6 w-full py-3 rounded-xl font-mono text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[.98]
          bg-white text-black hover:bg-zinc-100"
      >
        {isPending || isConfirming
          ? (step === 0 ? "Approving…" : "Listing…")
          : step === 0
          ? "Step 1: Approve Marketplace →"
          : "Step 2: List NFT →"}
      </button>

      {/* Fee note */}
      <p className="font-mono text-[10px] text-zinc-600 mt-4 text-center">
        2.5% platform fee applied at sale · seller receives 97.5%
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "browse" | "list" | "mine";

export default function MarketplacePage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [tab, setTab] = useState<Tab>("browse");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBuy, setActiveBuy] = useState<string | null>(null);
  const [listSuccess, setListSuccess] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const { writeContract: writeBuy, data: buyHash, isPending: isBuyPending, reset: resetBuy } = useWriteContract();
  const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({ hash: buyHash });
  const { writeContract: writeCancel, data: cancelHash } = useWriteContract();
  const { isSuccess: isCancelSuccess } = useWaitForTransactionReceipt({ hash: cancelHash });

  const fetchListings = useCallback(async () => {
    if (!publicClient) return;
    setLoading(true);
    try {
      const [listedLogs, soldLogs, canceledLogs] = await Promise.all([
        publicClient.getLogs({
          address: MARKETPLACE_ADDRESS,
          event: { type: "event", name: "NFTListed", inputs: [
            { name: "seller", type: "address", indexed: true },
            { name: "nftAddress", type: "address", indexed: true },
            { name: "tokenId", type: "uint256", indexed: true },
            { name: "price", type: "uint256" },
          ]},
          fromBlock: 0n,
        }),
        publicClient.getLogs({
          address: MARKETPLACE_ADDRESS,
          event: { type: "event", name: "NFTSold", inputs: [
            { name: "buyer", type: "address", indexed: true },
            { name: "nftAddress", type: "address", indexed: true },
            { name: "tokenId", type: "uint256", indexed: true },
            { name: "price", type: "uint256" },
          ]},
          fromBlock: 0n,
        }),
        publicClient.getLogs({
          address: MARKETPLACE_ADDRESS,
          event: { type: "event", name: "ListingCanceled", inputs: [
            { name: "seller", type: "address", indexed: true },
            { name: "nftAddress", type: "address", indexed: true },
            { name: "tokenId", type: "uint256", indexed: true },
          ]},
          fromBlock: 0n,
        }),
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
        if (!inactive.has(key) && !seen.has(key)) {
          seen.add(key);
          active.push({ seller, nftAddress, tokenId, price, blockNumber: log.blockNumber ?? 0n });
        }
      }
      setListings(active);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  useEffect(() => {
    if (isBuySuccess || isCancelSuccess) {
      fetchListings(); resetBuy(); setActiveBuy(null);
    }
  }, [isBuySuccess, isCancelSuccess, fetchListings, resetBuy]);

  const handleBuy = (listing: Listing) => {
    const key = `${listing.nftAddress}-${listing.tokenId}`;
    setActiveBuy(key);
    writeBuy({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "buyNFT", args: [listing.nftAddress as `0x${string}`, listing.tokenId], value: listing.price });
  };

  const handleCancel = (listing: Listing) => {
    writeCancel({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "cancelListing", args: [listing.nftAddress as `0x${string}`, listing.tokenId] });
  };

  const myListings = address ? listings.filter(l => getAddress(l.seller) === getAddress(address)) : [];
  const displayListings = tab === "mine" ? myListings : listings;

  const tabDefs: { id: Tab; label: string; count?: number }[] = [
    { id: "browse", label: "Browse", count: listings.length },
    { id: "list", label: "List NFT" },
    { id: "mine", label: "My Listings", count: myListings.length },
  ];

  const totalVolume = listings.reduce((a, l) => a + parseFloat(formatEther(l.price)), 0);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* ── Subtle dot background ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── Top glow ─────────────────────────────────────────────── */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-5 py-8">

        {/* ── Navbar ────────────────────────────────────────────── */}
        <nav className="flex items-center justify-between mb-12">
          <div>
            <a href="/" className="font-mono text-lg font-medium tracking-tight text-white hover:text-zinc-300 transition-colors">
              0xzvan<span className="text-zinc-500">.nft</span>
            </a>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px] text-zinc-500">Nexus Testnet · 3945</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://testnet.explorer.nexus.xyz/address/${MARKETPLACE_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg"
            >
              {shortAddr(MARKETPLACE_ADDRESS)} ↗
            </a>
            <WalletButton />
          </div>
        </nav>

        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-1">
            Marketplace
          </h1>
          <p className="text-zinc-500 text-sm">
            Buy and sell NFTs on Nexus Testnet
          </p>
        </div>

        {/* ── Stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Listed", value: listings.length.toString(), sub: "active" },
            { label: "Floor", value: listings.length ? `${Math.min(...listings.map(l => parseFloat(formatEther(l.price)))).toFixed(3)} NEX` : "—" },
            { label: "Volume", value: `${totalVolume.toFixed(2)} NEX`, sub: "listed value" },
            { label: "Fee", value: "2.5%", sub: "platform" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl px-4 py-4 backdrop-blur-sm">
              <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
              <p className="font-mono text-base font-medium text-white">{value}</p>
              {sub && <p className="font-mono text-[9px] text-zinc-600 mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-zinc-900/80 border border-zinc-800/80 p-1 rounded-xl backdrop-blur-sm">
            {tabDefs.map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`font-mono text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1.5
                  ${tab === id ? "bg-white text-black font-medium" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {label}
                {count !== undefined && (
                  <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-full
                    ${tab === id ? "bg-black/10 text-black" : "bg-zinc-800 text-zinc-500"}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab !== "list" && (
            <button
              onClick={fetchListings}
              disabled={loading}
              className="font-mono text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <span className={loading ? "animate-spin" : ""}>↻</span>
              Refresh
            </button>
          )}
        </div>

        {/* ── Content ───────────────────────────────────────────── */}
        {tab === "list" ? (
          <ListNFTForm onSuccess={() => { fetchListings(); setListSuccess(true); clearTimeout(timeoutRef.current); timeoutRef.current = setTimeout(() => setListSuccess(false), 4000); }} />
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-zinc-800" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-zinc-800 rounded w-3/4" />
                  <div className="h-2 bg-zinc-800 rounded w-1/2" />
                  <div className="h-8 bg-zinc-800 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : displayListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-zinc-800/50 rounded-2xl bg-zinc-900/30">
            <span className="text-4xl mb-4">
              {tab === "mine" ? (address ? "📭" : "🔒") : "🏪"}
            </span>
            <p className="font-mono text-sm text-zinc-500 mb-1">
              {tab === "mine"
                ? address ? "No active listings" : "Connect wallet to view your listings"
                : "No NFTs listed yet"}
            </p>
            {tab === "browse" && (
              <button
                onClick={() => setTab("list")}
                className="mt-5 font-mono text-xs text-white border border-zinc-700 hover:border-zinc-500 px-5 py-2.5 rounded-xl transition-colors"
              >
                List your first NFT →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {displayListings.map(listing => {
              const key = `${listing.nftAddress}-${listing.tokenId}`;
              return (
                <NFTCard
                  key={key}
                  listing={listing}
                  onBuy={handleBuy}
                  onCancel={handleCancel}
                  isBuying={activeBuy === key && (isBuyPending || isBuyConfirming)}
                />
              );
            })}
          </div>
        )}

        {/* ── List success toast ─────────────────────────────────── */}
        {listSuccess && (
          <div className="fixed bottom-6 right-6 bg-emerald-950 border border-emerald-700/50 text-emerald-300 font-mono text-xs px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2">
            <span className="text-base">✅</span> NFT listed successfully!
          </div>
        )}
      </div>

      {/* ── Tx status bar ─────────────────────────────────────────── */}
      <TxBar hash={buyHash} isPending={isBuyPending} isConfirming={isBuyConfirming} isSuccess={isBuySuccess} />
    </main>
  );
}
