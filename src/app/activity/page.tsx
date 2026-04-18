"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePublicClient } from "wagmi";
import { formatEther, getAddress } from "viem";
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from "@/lib/marketplace";

type EventType = "listed" | "sold" | "canceled";

interface Activity {
  type: EventType;
  seller?: string;
  buyer?: string;
  nftAddress: string;
  tokenId: bigint;
  price?: bigint;
  blockNumber: bigint;
  txHash: string;
  timestamp?: number;
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const fmtPrice = (p: bigint) => parseFloat(parseFloat(formatEther(p)).toFixed(3)).toString();

const TYPE_CONFIG: Record<EventType, { label: string; icon: string; color: string; bg: string }> = {
  listed:   { label: "Listed",     icon: "🏷️", color: "text-blue-600",  bg: "bg-blue-50 border-blue-100" },
  sold:     { label: "Sold",       icon: "⚡",  color: "text-green-600", bg: "bg-green-50 border-green-100" },
  canceled: { label: "Cancelled",  icon: "✕",   color: "text-red-500",   bg: "bg-red-50 border-red-100" },
};

const LISTED_EVENT   = { type: "event" as const, name: "NFTListed",      inputs: [{ name: "seller", type: "address", indexed: true }, { name: "nftAddress", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }, { name: "price", type: "uint256", indexed: false }] };
const SOLD_EVENT     = { type: "event" as const, name: "NFTSold",        inputs: [{ name: "buyer",  type: "address", indexed: true }, { name: "nftAddress", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }, { name: "price", type: "uint256", indexed: false }] };
const CANCELED_EVENT = { type: "event" as const, name: "ListingCanceled",inputs: [{ name: "seller", type: "address", indexed: true }, { name: "nftAddress", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }] };

export default function ActivityPage() {
  const publicClient = usePublicClient();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | EventType>("all");
  const [blockTimes, setBlockTimes] = useState<Record<string, number>>({});

  const fetchActivity = useCallback(async () => {
    if (!publicClient) return;
    setLoading(true);
    setError(null);
    try {
      const base = { address: MARKETPLACE_ADDRESS as `0x${string}`, fromBlock: 0n, toBlock: "latest" as const };
      const [listedLogs, soldLogs, canceledLogs] = await Promise.all([
        publicClient.getLogs({ ...base, event: LISTED_EVENT }).catch(() => []),
        publicClient.getLogs({ ...base, event: SOLD_EVENT }).catch(() => []),
        publicClient.getLogs({ ...base, event: CANCELED_EVENT }).catch(() => []),
      ]);

      const all: Activity[] = [
        ...listedLogs.map((l: any) => ({
          type: "listed" as EventType,
          seller: l.args.seller,
          nftAddress: l.args.nftAddress,
          tokenId: l.args.tokenId,
          price: l.args.price,
          blockNumber: l.blockNumber,
          txHash: l.transactionHash,
        })),
        ...soldLogs.map((l: any) => ({
          type: "sold" as EventType,
          buyer: l.args.buyer,
          nftAddress: l.args.nftAddress,
          tokenId: l.args.tokenId,
          price: l.args.price,
          blockNumber: l.blockNumber,
          txHash: l.transactionHash,
        })),
        ...canceledLogs.map((l: any) => ({
          type: "canceled" as EventType,
          seller: l.args.seller,
          nftAddress: l.args.nftAddress,
          tokenId: l.args.tokenId,
          blockNumber: l.blockNumber,
          txHash: l.transactionHash,
        })),
      ].sort((a, b) => Number(b.blockNumber - a.blockNumber));

      setActivities(all);

      // Fetch timestamps for top 30 unique blocks
      const uniqueBlocks = [...new Set(all.slice(0, 30).map(a => a.blockNumber.toString()))];
      const times: Record<string, number> = {};
      await Promise.all(
        uniqueBlocks.map(async (bn) => {
          try {
            const block = await publicClient.getBlock({ blockNumber: BigInt(bn) });
            times[bn] = Number(block.timestamp);
          } catch {}
        })
      );
      setBlockTimes(times);
    } catch (e: any) {
      setError(e.message || "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const displayed = filter === "all" ? activities : activities.filter(a => a.type === filter);

  const timeAgo = (blockNum: bigint) => {
    const ts = blockTimes[blockNum.toString()];
    if (!ts) return `Block #${blockNum}`;
    const diff = Math.floor(Date.now() / 1000) - ts;
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6 h-16 gap-4">
        <Link href="/" className="font-mono text-sm font-medium shrink-0">
          0xzvan<span className="text-[#2081e2]">.nft</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/marketplace" className="text-xs font-mono text-gray-500 hover:text-gray-900 hidden sm:block">Marketplace</Link>
          <Link href="/ranks" className="text-xs font-mono text-gray-500 hover:text-gray-900 hidden sm:block">Ranks</Link>
          <Link href="/my-nfts" className="text-xs font-mono text-gray-500 hover:text-gray-900 hidden sm:block">My NFTs</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Activity</h1>
            <p className="text-xs font-mono text-gray-400 mt-0.5">Live on-chain events</p>
          </div>
          <button onClick={fetchActivity} className="text-xs font-mono text-gray-400 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
            ↻ Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(["all", "listed", "sold", "canceled"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-mono whitespace-nowrap border transition-all
                ${filter === f ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
              {f === "all" ? `All (${activities.length})` : `${TYPE_CONFIG[f].icon} ${TYPE_CONFIG[f].label} (${activities.filter(a => a.type === f).length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
                <div className="h-4 bg-gray-100 rounded w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-red-500 text-sm font-mono mb-4">{error}</p>
            <button onClick={fetchActivity} className="px-5 py-2 bg-[#2081e2] text-white text-sm rounded-xl">Try Again</button>
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((item, i) => {
              const cfg = TYPE_CONFIG[item.type];
              const actor = item.type === "sold" ? item.buyer : item.seller;
              return (
                <div key={i} className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-2xl ${cfg.bg} transition-all hover:shadow-sm`}>
                  {/* Icon */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-white/60 flex items-center justify-center text-base shrink-0 shadow-sm">
                    {cfg.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-mono font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs font-mono text-gray-500">
                        {item.type === "sold" ? "bought by" : item.type === "listed" ? "by" : "by"}
                      </span>
                      <a href={`https://testnet.explorer.nexus.xyz/address/${actor}`} target="_blank" rel="noreferrer"
                        className="text-xs font-mono text-[#2081e2] hover:underline">
                        {actor ? short(actor) : "—"}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-medium text-gray-900 truncate">Nexus #{item.tokenId.toString()}</span>
                      <span className="text-[10px] font-mono text-gray-400 shrink-0">{timeAgo(item.blockNumber)}</span>
                    </div>
                  </div>

                  {/* Price + Link */}
                  <div className="text-right shrink-0">
                    {item.price != null && (
                      <p className="text-sm font-bold font-mono text-gray-900">{fmtPrice(item.price)} <span className="text-gray-400 text-xs">NEX</span></p>
                    )}
                    <a href={`https://testnet.explorer.nexus.xyz/tx/${item.txHash}`} target="_blank" rel="noreferrer"
                      className="text-[10px] font-mono text-gray-400 hover:text-gray-600">
                      tx ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
