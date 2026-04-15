"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  useAccount, useWriteContract, useWaitForTransactionReceipt,
  usePublicClient, useConnect, useDisconnect,
} from "wagmi";
import { parseEther, formatEther, getAddress } from "viem";
import { 
  MARKETPLACE_ADDRESS, 
  ALL_NFT_ADDRESSES, 
  NFT_ADDRESS_BAYC, 
  MARKETPLACE_ABI, 
  ABI_BAYC, 
  ABI_OLD,
  ERC721_ABI 
} from "@/lib/marketplace";
import { useToast } from "@/app/components/Toast";

interface Attribute {
  trait_type: string;
  value: string | number;
}

interface Listing {
  seller: string;
  nftAddress: string;
  tokenId: bigint;
  price: bigint;
  image?: string;
  name?: string;
  description?: string;
  attributes?: Attribute[];
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const fmtPrice = (p: bigint) =>
  parseFloat(parseFloat(formatEther(p)).toFixed(3)).toString();

const resolveIpfs = (uri: string) => {
  if (!uri) return "";
  const gw = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";
  if (uri.startsWith("ipfs://")) return uri.replace("ipfs://", `https://${gw}/ipfs/`);
  if (uri.startsWith("data:")) return uri; // data:image/... or data:application/json;...
  return uri;
};

// Decode tokenURI -- handles ipfs://, https://, data:application/json;base64,
const resolveMetaUri = async (tokenUri: string): Promise<any> => {
  if (!tokenUri) return null;
  try {
    if (tokenUri.startsWith("data:application/json;base64,")) {
      return JSON.parse(atob(tokenUri.split(",")[1]));
    }
    if (tokenUri.startsWith("data:application/json,")) {
      return JSON.parse(decodeURIComponent(tokenUri.split(",")[1]));
    }
    const res = await fetch(resolveIpfs(tokenUri), { cache: "force-cache" });
    return res.ok ? await res.json() : null;
  } catch { return null; }
};

// ─── Wallet Button ─────────────────────────────────────────────────────────────
function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  if (isConnected && address) {
    return (
      <div className="relative">
        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border border-gray-200 bg-white text-sm font-mono hover:border-gray-300 transition-colors">
          <span className="w-2 h-2 rounded-full bg-green-500" />{short(address)}
        </button>
        {open && (
          <div className="absolute right-0 top-11 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
            <Link href="/my-nfts" onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-xs font-mono text-gray-600 hover:bg-gray-50 transition-colors">
              My NFTs
            </Link>
            <a href={`https://testnet.explorer.nexus.xyz/address/${address}`} target="_blank" rel="noreferrer"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-xs font-mono text-gray-500 hover:bg-gray-50 transition-colors">
              View on Explorer ↗
            </a>
            <button onClick={() => { disconnect(); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-xs font-mono text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100">
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }
  return (
    <button onClick={() => connect({ connector: connectors[0] })}
      className="h-9 px-4 rounded-xl bg-[#2081e2] text-white text-sm font-mono font-medium hover:bg-[#1a6fc4] transition-colors">
      Connect Wallet
    </button>
  );
}

// ─── NFT Image ─────────────────────────────────────────────────────────────────
// Handle data:image/svg+xml;base64, via dangerouslySetInnerHTML jika <img> gagal
function NFTImage({ src, fallback, alt, className }: { src: string; fallback: string; alt: string; className?: string }) {
  const [errored, setErrored] = useState(false);

  // Kalau data:image/svg+xml — decode dan render inline SVG langsung
  // ini bypass CSP restriction pada beberapa browser
  if (src.startsWith("data:image/svg+xml;base64,")) {
    try {
      const svgContent = atob(src.split(",")[1]);
      return (
        <div className={className}
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        />
      );
    } catch { /* fallthrough */ }
  }

  if (src.startsWith("data:image/svg+xml,")) {
    try {
      const svgContent = decodeURIComponent(src.split(",")[1]);
      return (
        <div className={className}
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        />
      );
    } catch { /* fallthrough */ }
  }

  return (
    <img
      src={errored ? fallback : (src || fallback)}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}

// ─── NFT Card ──────────────────────────────────────────────────────────────────
function NFTCard({ listing, onBuy, onCancel, onEdit, onClick, isBuying, isOwner }: {
  listing: Listing; onBuy: (l: Listing) => void; onCancel: (l: Listing) => void;
  onEdit: (l: Listing) => void; onClick: (l: Listing) => void;
  isBuying: boolean; isOwner: boolean;
}) {
  return (
    <div
      className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={() => onClick(listing)}
    >
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <NFTImage src={listing.image || ""} fallback={`/api/image/${listing.tokenId}`} alt={listing.name || `Nexus #${listing.tokenId}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-white/70 flex items-center justify-center text-base hover:scale-110 transition-transform"
          onClick={(e) => e.stopPropagation()}>♡</button>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 text-[10px] font-mono text-[#2081e2]">
            <span>0xzvan.nft</span><span className="text-blue-400">✓</span>
          </div>
          {listing.attributes && listing.attributes.length > 0 && (
            <span className="text-[9px] font-mono bg-violet-50 text-violet-500 px-2 py-0.5 rounded-full border border-violet-100">
              {listing.attributes.length} traits
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 mb-2 truncate">{listing.name || `Nexus #${listing.tokenId}`}</p>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-gray-400">Price</p>
            <p className="text-base font-bold font-mono text-gray-900 truncate">
              {fmtPrice(listing.price)} <span className="text-sm text-gray-500">NEX</span>
            </p>
          </div>
          {isOwner ? (
            <div className="flex gap-1.5 shrink-0">
              <button onClick={(e) => { e.stopPropagation(); onEdit(listing); }}
                className="px-3 py-1.5 text-xs border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-2xl transition-colors">
                Edit
              </button>
              <button onClick={(e) => { e.stopPropagation(); onCancel(listing); }}
                className="px-3 py-1.5 text-xs border border-red-200 text-red-600 hover:bg-red-50 rounded-2xl transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onBuy(listing); }}
              disabled={isBuying}
              className="shrink-0 px-5 py-1.5 bg-[#2081e2] hover:bg-[#1a6fc4] disabled:bg-gray-300 text-white text-xs font-medium rounded-2xl transition-colors">
              {isBuying ? "Buying…" : "Buy Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Card Skeleton ─────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
      <div className="aspect-square bg-gray-100 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/3" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-5 bg-gray-100 rounded animate-pulse w-1/3" />
          <div className="h-7 bg-gray-100 rounded-2xl animate-pulse w-1/4" />
        </div>
      </div>
    </div>
  );
}

// ─── NFT Detail Modal ──────────────────────────────────────────────────────────
function NFTModal({ listing, onClose, onBuy, isOwner, isBuying }: {
  listing: Listing; onClose: () => void; onBuy: (l: Listing) => void;
  isOwner: boolean; isBuying: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative aspect-square bg-gray-100">
          <NFTImage src={listing.image || ""} fallback={`/api/image/${listing.tokenId}`} alt={listing.name || ""}
            className="w-full h-full object-cover" />
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-[#2081e2] text-sm font-mono">0xzvan.nft <span>✓</span></div>
            {listing.attributes && listing.attributes.length > 0 && (
              <span className="text-[10px] font-mono bg-violet-50 text-violet-500 px-2.5 py-1 rounded-full border border-violet-100">
                {listing.attributes.length} traits
              </span>
            )}
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">{listing.name || `Nexus #${listing.tokenId}`}</h2>
          {listing.description && (
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">{listing.description}</p>
          )}

          {/* Attributes */}
          {listing.attributes && listing.attributes.length > 0 && (
            <div className="mb-5">
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-3">Attributes</p>
              <div className="grid grid-cols-3 gap-2">
                {listing.attributes.map((attr, i) => (
                  <div key={i} className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-center">
                    <p className="text-[9px] font-mono text-blue-400 uppercase tracking-wider truncate">{attr.trait_type}</p>
                    <p className="text-xs font-semibold text-blue-900 mt-0.5 truncate">{String(attr.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 text-sm mb-5">
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
          <p className="text-xs font-mono text-gray-400 mb-1">Current Price</p>
          <p className="text-3xl font-bold font-mono text-gray-900 mb-5">{fmtPrice(listing.price)} NEX</p>
          {!isOwner && (
            <div className="flex gap-3">
              <button onClick={() => onBuy(listing)} disabled={isBuying}
                className="flex-1 h-12 bg-[#2081e2] hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-2xl font-medium transition-colors">
                {isBuying ? "Buying…" : "Buy Now"}
              </button>
              <button onClick={onClose} className="flex-1 h-12 border border-gray-200 hover:bg-gray-50 rounded-2xl font-medium transition-colors">
                Close
              </button>
            </div>
          )}
          <Link href={`/nft/${listing.nftAddress}/${listing.tokenId}`}
            className="block text-center text-xs font-mono text-gray-400 hover:text-gray-600 mt-4">
            View Detail Page ↗
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── List NFT Modal ─────────────────────────────────────────────────────────────
function ListModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<0 | 1>(0);
  const [selectedContract, setSelectedContract] = useState(NFT_ADDRESS_BAYC);
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("");
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!isSuccess) return;
    if (step === 0) { setStep(1); reset(); }
    else { onSuccess(); onClose(); }
  }, [isSuccess, step]);

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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all
                ${step === i ? "bg-[#2081e2] border-[#2081e2] text-white" : step > i ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-gray-400"}`}>
                {step > i ? "✓" : i + 1}
              </div>
              <div className="ml-3 text-xs font-medium text-gray-600">{label}</div>
              {i === 0 && <div className="flex-1 h-px bg-gray-200 mx-4" />}
            </div>
          ))}
        </div>
        <div className="space-y-5">
          <div>
            <label className="text-xs font-mono text-gray-500 block mb-2">NFT Collection</label>
            <select 
              className="w-full h-11 border border-gray-200 rounded-2xl px-4 text-sm font-mono focus:border-[#2081e2] outline-none bg-white"
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.target.value as `0x${string}`)}
              disabled={step === 1}
            >
              <option value={NFT_ADDRESS_BAYC}>BAYC Collection</option>
              <option value={ALL_NFT_ADDRESSES[1]}>Old Collection</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-mono text-gray-500 block mb-2">Token ID</label>
            <input type="number" value={tokenId} onChange={(e) => setTokenId(e.target.value)} disabled={step === 1} placeholder="1"
              className="w-full h-11 border border-gray-200 rounded-2xl px-4 text-sm font-mono focus:border-[#2081e2] outline-none" />
          </div>
          {step === 1 && (
            <div>
              <label className="text-xs font-mono text-gray-500 block mb-2">Price (NEX)</label>
              <div className="relative">
                <input type="number" step="0.001" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="5"
                  className="w-full h-11 border border-gray-200 rounded-2xl px-4 pr-16 text-sm font-mono focus:border-[#2081e2] outline-none" />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-mono text-gray-400">NEX</span>
              </div>
            </div>
          )}
        </div>
        <button onClick={() => {
          if (step === 0) {
            writeContract({ address: selectedContract as `0x${string}`, abi: ERC721_ABI, functionName: "setApprovalForAll", args: [MARKETPLACE_ADDRESS, true] });
          } else {
            writeContract({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "listNFT", args: [selectedContract as `0x${string}`, BigInt(tokenId), parseEther(price)] });
          }
        }} disabled={!tokenId || (step === 1 && !price) || isPending || isConfirming}
          className="mt-8 w-full h-12 bg-[#2081e2] hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-2xl transition-colors">
          {isPending || isConfirming ? (step === 0 ? "Approving..." : "Listing...") : step === 0 ? "Step 1: Approve" : "Step 2: List NFT"}
        </button>
        <p className="text-center text-[10px] text-gray-400 mt-4">2.5% platform fee applies</p>
      </div>
    </div>
  );
}

// ─── Edit Price Modal ───────────────────────────────────────────────────────────
function EditPriceModal({ listing, onClose, onSuccess }: { listing: Listing; onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<"cancel" | "relist" | "done">("cancel");
  const [newPrice, setNewPrice] = useState(fmtPrice(listing.price));
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { success } = useToast();

  useEffect(() => {
    if (!isSuccess) return;
    if (step === "cancel") { setStep("relist"); reset(); }
    else if (step === "relist") {
      success("Price updated successfully!");
      onSuccess(); onClose();
    }
  }, [isSuccess, step]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Edit Listing Price</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          {["Cancel Old", "Re-list"].map((label, i) => {
            const stepIndex = step === "cancel" ? 0 : 1;
            return (
              <div key={i} className="flex items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all
                  ${stepIndex === i ? "bg-[#2081e2] border-[#2081e2] text-white" : stepIndex > i ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-gray-400"}`}>
                  {stepIndex > i ? "✓" : i + 1}
                </div>
                <div className="ml-2 text-xs font-medium text-gray-600">{label}</div>
                {i === 0 && <div className="flex-1 h-px bg-gray-200 mx-3" />}
              </div>
            );
          })}
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 font-mono text-xs">NFT</span>
            <span className="font-medium">{listing.name || `Nexus #${listing.tokenId}`}</span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-gray-500 font-mono text-xs">Current Price</span>
            <span className="font-mono text-sm">{fmtPrice(listing.price)} NEX</span>
          </div>
        </div>

        {step === "relist" && (
          <div className="mb-5">
            <label className="text-xs font-mono text-gray-500 block mb-2">New Price (NEX)</label>
            <div className="relative">
              <input type="number" step="0.001" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
                className="w-full h-11 border border-gray-200 rounded-2xl px-4 pr-16 text-sm font-mono focus:border-[#2081e2] outline-none" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-gray-400">NEX</span>
            </div>
          </div>
        )}

        <button onClick={() => {
          if (step === "cancel") {
            writeContract({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "cancelListing", args: [listing.nftAddress as `0x${string}`, listing.tokenId] });
          } else {
            writeContract({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "listNFT", args: [listing.nftAddress as `0x${string}`, listing.tokenId, parseEther(newPrice)] });
          }
        }} disabled={isPending || isConfirming || (step === "relist" && !newPrice)}
          className="w-full h-12 bg-[#2081e2] hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-2xl transition-colors">
          {isPending || isConfirming ? "Processing..." : step === "cancel" ? "Step 1: Cancel Listing" : "Step 2: Re-list with New Price"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Marketplace ─────────────────────────────────────────────────────────
export default function MarketplaceClient() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { success, error: toastError } = useToast();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<"price_asc" | "price_desc" | "newest">("price_asc");
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [activeBuyKey, setActiveBuyKey] = useState<string | null>(null);

  const { writeContract: writeBuy, data: buyHash, isPending: isBuyPending, reset: resetBuy } = useWriteContract();
  const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({ hash: buyHash });
  const { writeContract: writeCancel, data: cancelHash } = useWriteContract();
  const { isSuccess: isCancelSuccess } = useWaitForTransactionReceipt({ hash: cancelHash });

  const fetchListings = useCallback(async () => {
    if (!publicClient) return;
    setLoading(true);
    setFetchError(null);

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > 100000n ? currentBlock - 100000n : 0n;

      const [listedLogs, soldLogs, canceledLogs] = await Promise.all([
        publicClient.getContractEvents({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, eventName: "NFTListed", fromBlock }),
        publicClient.getContractEvents({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, eventName: "NFTSold", fromBlock }),
        publicClient.getContractEvents({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, eventName: "ListingCanceled", fromBlock }),
      ]);

      const inactive = new Set<string>();
      [...soldLogs, ...canceledLogs].forEach((log: any) => {
        const { nftAddress, tokenId } = log.args;
        inactive.add(`${(nftAddress as string).toLowerCase()}-${tokenId}`);
      });

      const active: Listing[] = [];
      const seen = new Set<string>();

      for (const log of [...listedLogs].reverse()) {
        const { seller, nftAddress, tokenId, price } = log.args as any;
        const key = `${(nftAddress as string).toLowerCase()}-${tokenId}`;

        // CEK APAKAH ALAMAT NFT ADA DI DAFTAR (BAYC atau OLD)
        const isAllowed = ALL_NFT_ADDRESSES.some(addr => addr.toLowerCase() === (nftAddress as string).toLowerCase());

        if (!isAllowed || inactive.has(key) || seen.has(key)) continue;
        seen.add(key);

        // PILIH ABI BERDASARKAN KONTRAK
        const isBayc = (nftAddress as string).toLowerCase() === NFT_ADDRESS_BAYC.toLowerCase();
        const currentAbi = isBayc ? ABI_BAYC : ABI_OLD;

        let imageUrl = `/api/image/${tokenId}`;
        let nftName = `Nexus #${tokenId}`;
        let nftDesc = "";
        let nftAttrs: { trait_type: string; value: string | number }[] = [];

        try {
          const tokenUri = await publicClient.readContract({
            address: nftAddress as `0x${string}`,
            abi: currentAbi,
            functionName: "tokenURI",
            args: [tokenId],
          }) as string;

          console.log(`[marketplace] token ${tokenId} URI:`, tokenUri?.slice(0, 80));

          if (tokenUri) {
            // resolveMetaUri handles BOTH data:application/json;base64, AND ipfs:// AND https://
            const meta = await resolveMetaUri(tokenUri);
            if (meta) {
              if (meta.name) nftName = meta.name;
              if (meta.description) nftDesc = meta.description;
              if (meta.attributes) nftAttrs = meta.attributes;
              if (meta.image) {
                // BAYC often uses data:image/svg+xml;base64, — pass through directly
                imageUrl = resolveIpfs(meta.image);
                console.log(`[marketplace] token ${tokenId} image:`, imageUrl.slice(0, 80));
              }
            }
          }
        } catch (e) { console.error("Metadata error:", e); }

        active.push({ seller, nftAddress, tokenId, price, image: imageUrl, name: nftName, description: nftDesc, attributes: nftAttrs });
      }
      setListings(active);
    } catch (err) {
      toastError("Gagal memuat data marketplace");
    } finally {
      setLoading(false);
    }
  }, [publicClient, toastError]);

  useEffect(() => { fetchListings(); }, [fetchListings]);
  useEffect(() => { if (isBuySuccess || isCancelSuccess) { fetchListings(); resetBuy(); setActiveBuyKey(null); setSelectedListing(null); } }, [isBuySuccess, isCancelSuccess, fetchListings, resetBuy]);

  const handleBuy = (listing: Listing) => {
    setActiveBuyKey(`${listing.nftAddress}-${listing.tokenId}`);
    writeBuy({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "buyNFT", args: [listing.nftAddress as `0x${string}`, listing.tokenId], value: listing.price });
  };
  const handleCancel = (listing: Listing) => {
    writeCancel({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "cancelListing", args: [listing.nftAddress as `0x${string}`, listing.tokenId] });
  };

  const filtered = listings.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.tokenId.toString().includes(search)
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "price_asc") return Number(a.price - b.price);
    if (sort === "price_desc") return Number(b.price - a.price);
    return 0;
  });

  const displayed = tab === "mine" && address
    ? sorted.filter(l => getAddress(l.seller) === getAddress(address))
    : sorted;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-6 h-16 gap-4">
        <Link href="/" className="font-mono text-sm font-bold shrink-0">
          0XZVAN<span className="text-[#2081e2]">.NFT</span>
        </Link>
        <div className="flex-1 max-w-md relative mx-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⌕</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 text-sm outline-none focus:border-[#2081e2] focus:bg-white transition-all"
            placeholder="Search by name or ID..." />
        </div>
        <div className="ml-auto flex items-center gap-3">
          {address && (
            <button onClick={() => setShowListModal(true)}
              className="h-9 px-5 bg-[#2081e2] text-white rounded-xl text-xs font-mono font-bold hover:bg-[#1a6fc4] transition-all">
              + LIST NFT
            </button>
          )}
          <WalletButton />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-8">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl">
            {(["all", "mine"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-6 py-2 rounded-xl text-xs font-mono font-bold transition-all
                  ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {t === "all" ? "EXPLORE" : "MY LISTINGS"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-gray-400">{displayed.length} items</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as any)}
              className="h-10 border border-gray-200 rounded-2xl px-4 text-xs font-mono outline-none bg-white cursor-pointer">
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Recently Listed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-[3rem]">
            <span className="text-5xl mb-6">🏪</span>
            <p className="text-gray-500 font-mono text-sm">No NFTs found in this collection</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayed.map(l => (
              <NFTCard key={`${l.nftAddress}-${l.tokenId}`} listing={l}
                onBuy={handleBuy} onCancel={handleCancel} onEdit={setEditListing} onClick={setSelectedListing}
                isBuying={activeBuyKey === `${l.nftAddress}-${l.tokenId}` && (isBuyPending || isBuyConfirming)}
                isOwner={!!(address && getAddress(l.seller) === getAddress(address))} />
            ))}
          </div>
        )}
      </main>

      {selectedListing && (
        <NFTModal listing={selectedListing} onClose={() => setSelectedListing(null)} onBuy={handleBuy}
          isOwner={!!(address && getAddress(selectedListing.seller) === getAddress(address))}
          isBuying={activeBuyKey === `${selectedListing.nftAddress}-${selectedListing.tokenId}` && (isBuyPending || isBuyConfirming)} />
      )}
      {showListModal && <ListModal onClose={() => setShowListModal(false)} onSuccess={fetchListings} />}
      {editListing && <EditPriceModal listing={editListing} onClose={() => setEditListing(null)} onSuccess={fetchListings} />}
    </div>
  );
}
