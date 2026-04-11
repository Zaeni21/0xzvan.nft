"use client";

/**
 * @file app/page.tsx — Landing Page
 * 0xzvan.nft · Nexus Testnet NFT Marketplace
 */

import Link from "next/link";
import { useState, useEffect } from "react";

const MARKETPLACE = "0x5645cC460DFa9CE4Dea89DC9df331C0C1721FDFf";
const NFT_CONTRACT = "0x1EF92429dBB23E3fc563d203be756E07c12AB7Df";
const EXPLORER = "https://testnet.explorer.nexus.xyz";

const FEATURED = [
  { id: 0, art: "🌌", price: "0.100", bg: "from-violet-950" },
  { id: 1, art: "⚡", price: "0.250", bg: "from-sky-950" },
  { id: 2, art: "🔷", price: "0.500", bg: "from-emerald-950" },
  { id: 3, art: "🌀", price: "0.150", bg: "from-rose-950" },
  { id: 4, art: "✨", price: "0.075", bg: "from-amber-950" },
];

const HOW_IT_WORKS = [
  {
    num: "01",
    icon: "🔑",
    title: "Connect wallet",
    desc: "Connect MetaMask or any injected wallet. Switch to Nexus Testnet (Chain ID 3945) to get started.",
  },
  {
    num: "02",
    icon: "📋",
    title: "Approve & list",
    desc: "Approve the marketplace to transfer your NFT, then set your price in NEX. Two transactions, done.",
  },
  {
    num: "03",
    icon: "⚡",
    title: "Instant settlement",
    desc: "When sold, 97.5% goes straight to your wallet. The contract handles splitting — no waiting, no middleman.",
  },
];

const TICKER_ITEMS = [
  ...FEATURED.map((f) => `Nexus #${f.id} · ${f.price} NEX`),
  "Platform fee · 2.5%",
  "Seller proceeds · 97.5%",
  "Chain ID · 3945",
];

// ─── Internal Component: CopyButton ───────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="font-mono text-[9px] text-zinc-600 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md hover:text-zinc-300 hover:border-zinc-700 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#080809] text-white overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,.025) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,.055) 0%, transparent 70%)" }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-zinc-900/80">
        <span className="font-mono text-sm tracking-tight">
          0xzvan<span className="text-zinc-600">.nft</span>
        </span>
        <div className="flex items-center gap-7">
          <Link href="/marketplace" className="font-mono text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors tracking-wider">
            Marketplace
          </Link>
          <a href={`${EXPLORER}/address/${MARKETPLACE}`} target="_blank" className="font-mono text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors tracking-wider">
            Contract ↗
          </a>
          <Link href="/marketplace" className="font-mono text-[11px] bg-white text-black px-4 py-2 rounded-[9px] font-medium hover:bg-zinc-100 transition-colors">
            Open App →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-5 text-center px-5 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 font-mono text-[10px] text-zinc-500 border border-zinc-800 px-4 py-1.5 rounded-full mb-10 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live on Nexus Testnet · Chain ID 3945
        </div>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.04em] leading-[1.05] mb-6">
          Trade NFTs<br />
          <span className="text-zinc-700">on Nexus.</span>
        </h1>
        <p className="text-zinc-500 text-sm sm:text-[15px] max-w-md mx-auto mb-11 leading-relaxed font-light">
          A trustless NFT marketplace on the Nexus Testnet. List, buy, and
          collect — with 2.5% platform fee and instant on-chain settlement.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/marketplace" className="font-mono text-xs bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-zinc-100 transition-all hover:-translate-y-0.5">
            Browse Marketplace →
          </Link>
          <a href={`${EXPLORER}/address/${MARKETPLACE}?tab=contract`} target="_blank" className="font-mono text-xs text-zinc-500 border border-zinc-800 px-6 py-3 rounded-xl hover:border-zinc-600 hover:text-zinc-300 transition-all">
            View Contract ↗
          </a>
        </div>
      </section>

      {/* Ticker */}
      <div className="relative z-5 overflow-hidden border-t border-b border-zinc-900/60 py-3 mb-20">
        <div className="flex w-max animate-[ticker_20s_linear_infinite]">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-8 font-mono text-[10px] text-zinc-600 whitespace-nowrap">
              <span className="text-emerald-500">↑</span>
              {item}
              {(i + 1) % TICKER_ITEMS.length === 0 && <span className="text-zinc-800 mx-2">//</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Featured NFTs */}
      <section className="relative z-5 max-w-5xl mx-auto px-5 mb-20">
        <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.12em] text-center mb-12">Featured listings</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {FEATURED.map((nft) => (
            <Link key={nft.id} href="/marketplace" className="group bg-zinc-950 border border-zinc-800/80 hover:border-zinc-600 rounded-2xl overflow-hidden transition-all hover:-translate-y-1">
              <div className={`aspect-square bg-gradient-to-br ${nft.bg} via-zinc-950 to-zinc-950 flex items-center justify-center text-4xl relative`}>
                <span className="relative z-10 group-hover:scale-110 transition-transform duration-300">{nft.art}</span>
              </div>
              <div className="p-3">
                <p className="font-mono text-[9px] text-zinc-600 mb-1">Nexus #{nft.id}</p>
                <p className="font-mono text-xs font-medium text-white">{nft.price} <span className="text-zinc-500">NEX</span></p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Fee Split Visual */}
      <section className="relative z-5 max-w-5xl mx-auto px-5 mb-20">
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-7">
          <div className="flex justify-between font-mono text-[10px] mb-2">
            <span className="text-zinc-500">Seller proceeds</span>
            <span className="text-white">97.5%</span>
          </div>
          <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-white rounded-full" style={{ width: "97.5%" }} />
          </div>
          <div className="h-px bg-zinc-900 mb-5" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-zinc-600">Contract:</span>
              <span className="font-mono text-[11px] text-zinc-400">{MARKETPLACE.slice(0, 15)}...</span>
              <CopyButton text={MARKETPLACE} />
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-5 border-t border-zinc-900 px-8 py-8 flex items-center justify-between">
        <span className="font-mono text-xs text-zinc-700">0xzvan<span className="text-zinc-800">.nft</span></span>
        <span className="font-mono text-[10px] text-zinc-800">Nexus Testnet · 3945</span>
      </footer>
    </main>
  );
}
