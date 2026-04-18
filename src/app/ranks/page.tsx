"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePublicClient, useAccount } from "wagmi";
import { formatEther, getAddress } from "viem";
import { MARKETPLACE_ADDRESS } from "@/lib/marketplace";

interface Trader {
  address: string;
  volume: bigint;      // total NEX traded
  sold: number;        // NFTs sold
  bought: number;      // NFTs bought
  listed: number;      // NFTs listed
  score: number;       // composite score
}

type SortKey = "volume" | "sold" | "bought" | "listed";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const fmtNEX = (p: bigint) => parseFloat(parseFloat(formatEther(p)).toFixed(1)).toString();

const MEDALS = ["🥇", "🥈", "🥉"];

const LISTED_EVENT   = { type: "event" as const, name: "NFTListed",       inputs: [{ name: "seller", type: "address", indexed: true }, { name: "nftAddress", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }, { name: "price", type: "uint256", indexed: false }] };
const SOLD_EVENT     = { type: "event" as const, name: "NFTSold",         inputs: [{ name: "buyer",  type: "address", indexed: true }, { name: "nftAddress", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }, { name: "price", type: "uint256", indexed: false }] };

export default function RanksPage() {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("volume");

  const fetchRanks = useCallback(async () => {
    if (!publicClient) return;
    setLoading(true);
    setError(null);
    try {
      const base = { address: MARKETPLACE_ADDRESS as `0x${string}`, fromBlock: 0n, toBlock: "latest" as const };
      const [listedLogs, soldLogs] = await Promise.all([
        publicClient.getLogs({ ...base, event: LISTED_EVENT }).catch(() => []),
        publicClient.getLogs({ ...base, event: SOLD_EVENT }).catch(() => []),
      ]);

      const map = new Map<string, Trader>();

      const get = (addr: string): Trader => {
        const key = addr.toLowerCase();
        if (!map.has(key)) map.set(key, { address: addr, volume: 0n, sold: 0, bought: 0, listed: 0, score: 0 });
        return map.get(key)!;
      };

      // Count listings
      listedLogs.forEach((l: any) => {
        const t = get(l.args.seller);
        t.listed++;
        t.address = l.args.seller; // preserve checksum
      });

      // Count sales (seller + buyer)
      soldLogs.forEach((l: any) => {
        const price: bigint = l.args.price ?? 0n;

        const seller = get(l.args.nftAddress); // seller isn't in sold event, use buyer side
        const buyer = get(l.args.buyer);
        buyer.bought++;
        buyer.volume += price;
        buyer.address = l.args.buyer;

        // Find original listing to credit seller volume
        const listedMatch = listedLogs.find((ll: any) =>
          ll.args.nftAddress?.toLowerCase() === l.args.nftAddress?.toLowerCase() &&
          ll.args.tokenId === l.args.tokenId
        ) as any;

        if (listedMatch) {
          const s = get(listedMatch.args.seller);
          s.sold++;
          s.volume += price;
          s.address = listedMatch.args.seller;
        }
      });

      // Compute score: volume (weighted) + sold*3 + bought*2 + listed*1
      const result = [...map.values()].map(t => ({
        ...t,
        score: Number(t.volume / BigInt(1e15)) + t.sold * 300 + t.bought * 200 + t.listed * 100,
      }));

      setTraders(result);
    } catch (e: any) {
      setError(e.message || "Failed to load ranks");
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  useEffect(() => { fetchRanks(); }, [fetchRanks]);

  const sorted = [...traders].sort((a, b) => {
    if (sort === "volume") return Number(b.volume - a.volume);
    return b[sort] - a[sort];
  });

  const myRank = address ? sorted.findIndex(t => t.address.toLowerCase() === address.toLowerCase()) + 1 : 0;
  const me = address ? sorted.find(t => t.address.toLowerCase() === address.toLowerCase()) : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6 h-16 gap-4">
        <Link href="/" className="font-mono text-sm font-medium shrink-0">
          0xzvan<span className="text-[#2081e2]">.nft</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/marketplace" className="text-xs font-mono text-gray-500 hover:text-gray-900 hidden sm:block">Marketplace</Link>
          <Link href="/activity" className="text-xs font-mono text-gray-500 hover:text-gray-900 hidden sm:block">Activity</Link>
          <Link href="/my-nfts" className="text-xs font-mono text-gray-500 hover:text-gray-900 hidden sm:block">My NFTs</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Leaderboard</h1>
            <p className="text-xs font-mono text-gray-400 mt-0.5">Ranked by on-chain trading activity</p>
          </div>
          <button onClick={fetchRanks} className="text-xs font-mono text-gray-400 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
            ↻ Refresh
          </button>
        </div>

        {/* My rank card */}
        {me && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-100 rounded-2xl">
            <p className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-2">Your Rank</p>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold font-mono text-blue-900">#{myRank}</span>
              <div className="flex gap-4 text-xs font-mono">
                <div><p className="text-gray-400">Volume</p><p className="font-bold text-gray-900">{fmtNEX(me.volume)} NEX</p></div>
                <div><p className="text-gray-400">Sold</p><p className="font-bold text-gray-900">{me.sold}</p></div>
                <div><p className="text-gray-400">Bought</p><p className="font-bold text-gray-900">{me.bought}</p></div>
                <div><p className="text-gray-400">Listed</p><p className="font-bold text-gray-900">{me.listed}</p></div>
              </div>
            </div>
          </div>
        )}

        {/* Sort tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {(["volume", "sold", "bought", "listed"] as SortKey[]).map((s) => (
            <button key={s} onClick={() => setSort(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-mono whitespace-nowrap border transition-all capitalize
                ${sort === s ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
              {s === "volume" ? "💰 Volume" : s === "sold" ? "⚡ Sold" : s === "bought" ? "🛍️ Bought" : "🏷️ Listed"}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 h-4 bg-gray-100 rounded" />
                <div className="w-20 h-4 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-red-500 text-sm font-mono mb-4">{error}</p>
            <button onClick={fetchRanks} className="px-5 py-2 bg-[#2081e2] text-white text-sm rounded-xl">Try Again</button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-gray-500">No traders yet. Be the first!</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 mb-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Trader</div>
              <div className="col-span-2 text-right">Volume</div>
              <div className="col-span-1 text-right">Sold</div>
              <div className="col-span-1 text-right">Bought</div>
              <div className="col-span-2 text-right">Listed</div>
            </div>

            <div className="space-y-1.5">
              {sorted.map((trader, i) => {
                const isMe = address && trader.address.toLowerCase() === address.toLowerCase();
                const medal = MEDALS[i];
                return (
                  <div key={trader.address}
                    className={`grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-2xl border transition-all
                      ${isMe ? "bg-blue-50 border-blue-200" : i < 3 ? "bg-amber-50 border-amber-100" : "bg-white border-gray-100 hover:border-gray-200"}`}>
                    {/* Rank */}
                    <div className="col-span-1">
                      {medal ? (
                        <span className="text-lg">{medal}</span>
                      ) : (
                        <span className="text-sm font-mono text-gray-400">{i + 1}</span>
                      )}
                    </div>

                    {/* Address */}
                    <div className="col-span-5">
                      <a href={`https://testnet.explorer.nexus.xyz/address/${trader.address}`}
                        target="_blank" rel="noreferrer"
                        className={`text-sm font-mono hover:underline ${isMe ? "text-blue-600 font-bold" : "text-gray-700"}`}>
                        {short(trader.address)}
                        {isMe && <span className="ml-1.5 text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">you</span>}
                      </a>
                    </div>

                    {/* Stats */}
                    <div className="col-span-2 text-right">
                      <span className="text-sm font-mono font-bold text-gray-900">{fmtNEX(trader.volume)}</span>
                      <span className="text-[10px] text-gray-400 ml-0.5">NEX</span>
                    </div>
                    <div className="col-span-1 text-right text-sm font-mono text-green-600 font-medium">{trader.sold}</div>
                    <div className="col-span-1 text-right text-sm font-mono text-blue-600 font-medium">{trader.bought}</div>
                    <div className="col-span-2 text-right text-sm font-mono text-gray-500">{trader.listed}</div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[10px] font-mono text-gray-300 mt-6">
              Score = volume + sold×3 + bought×2 + listed×1
            </p>
          </>
        )}
      </main>
    </div>
  );
}
