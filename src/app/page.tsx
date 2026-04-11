/**
 * @file app/page.tsx — Landing Page
 * 0xzvan.nft · Nexus Testnet NFT Marketplace
 */

import Link from "next/link";

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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#080809] text-white overflow-x-hidden">

      {/* ── Background ───────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,.025) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,.055) 0%, transparent 70%)" }}
      />

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-zinc-900/80">
        <span className="font-mono text-sm tracking-tight">
          0xzvan<span className="text-zinc-600">.nft</span>
        </span>
        <div className="flex items-center gap-7">
          <Link href="/marketplace" className="font-mono text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors tracking-wider">
            Marketplace
          </Link>
          <a
            href={`${EXPLORER}/address/${MARKETPLACE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors tracking-wider"
          >
            Contract ↗
          </a>
          <Link
            href="/marketplace"
            className="font-mono text-[11px] bg-white text-black px-4 py-2 rounded-[9px] font-medium hover:bg-zinc-100 transition-colors"
          >
            Open App →
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative z-5 text-center px-5 pt-24 pb-20">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 font-mono text-[10px] text-zinc-500 border border-zinc-800 px-4 py-1.5 rounded-full mb-10 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live on Nexus Testnet · Chain ID 3945
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.04em] leading-[1.05] mb-6">
          Trade NFTs<br />
          <span className="text-zinc-700">on Nexus.</span>
        </h1>

        <p className="text-zinc-500 text-sm sm:text-[15px] max-w-md mx-auto mb-11 leading-relaxed font-light">
          A trustless NFT marketplace on the Nexus Testnet. List, buy, and
          collect — with 2.5% platform fee and instant on-chain settlement.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/marketplace"
            className="font-mono text-xs bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-zinc-100 transition-all hover:-translate-y-0.5"
          >
            Browse Marketplace →
          </Link>
          <a
            href={`${EXPLORER}/address/${MARKETPLACE}?tab=contract`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-zinc-500 border border-zinc-800 px-6 py-3 rounded-xl hover:border-zinc-600 hover:text-zinc-300 transition-all"
          >
            View Contract ↗
          </a>
        </div>
      </section>

      {/* ── Ticker ───────────────────────────────────────────────── */}
      <div className="relative z-5 overflow-hidden border-t border-b border-zinc-900/60 py-3 mb-20">
        <div className="flex w-max animate-[ticker_20s_linear_infinite]">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-8 font-mono text-[10px] text-zinc-600 whitespace-nowrap">
              <span className="text-emerald-500">↑</span>
              {item}
              {(i + 1) % TICKER_ITEMS.length === 0 && (
                <span className="text-zinc-800 mx-2">//</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Featured NFTs ─────────────────────────────────────────── */}
      <section className="relative z-5 max-w-5xl mx-auto px-5 mb-20">
        <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.12em] text-center mb-12">
          Featured listings
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {FEATURED.map((nft) => (
            <Link
              key={nft.id}
              href="/marketplace"
              className="group bg-zinc-950 border border-zinc-800/80 hover:border-zinc-600 rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
            >
              <div
                className={`aspect-square bg-gradient-to-br ${nft.bg} via-zinc-950 to-zinc-950 flex items-center justify-center text-4xl relative`}
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
              >
                <span className="relative z-10 group-hover:scale-110 transition-transform duration-300">
                  {nft.art}
                </span>
              </div>
              <div className="p-3">
                <p className="font-mono text-[9px] text-zinc-600 mb-1">Nexus #{nft.id}</p>
                <p className="font-mono text-xs font-medium text-white">
                  {nft.price} <span className="text-zinc-500">NEX</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────── */}
      <section className="relative z-5 max-w-5xl mx-auto px-5 mb-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-zinc-900 border border-zinc-900 rounded-2xl overflow-hidden">
          {[
            { label: "Total listed", value: "5", sub: "active NFTs" },
            { label: "Floor price", value: "0.075", sub: "NEX per token" },
            { label: "Platform fee", value: "2.5%", sub: "250 basis points" },
            { label: "Seller gets", value: "97.5%", sub: "instant payout" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-zinc-950/60 px-7 py-6">
              <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest mb-3">{label}</p>
              <p className="font-mono text-xl font-medium text-white tracking-tight">{value}</p>
              <p className="font-mono text-[9px] text-zinc-700 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className="relative z-5 max-w-5xl mx-auto px-5 mb-20">
        <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.12em] text-center mb-12">
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {HOW_IT_WORKS.map(({ num, icon, title, desc }) => (
            <div key={num} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
              <p className="font-mono text-[10px] text-zinc-700 mb-4">{num}</p>
              <div className="text-2xl mb-4">{icon}</div>
              <h3 className="text-sm font-medium text-white mb-2 tracking-tight">{title}</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-light">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Fee split visual ──────────────────────────────────────── */}
      <section className="relative z-5 max-w-5xl mx-auto px-5 mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight leading-tight mb-4">
              Transparent<br />fee structure
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6 font-light">
              Every sale is settled on-chain with a built-in fee split. No hidden
              fees, no custodians. Funds are distributed atomically at purchase time.
            </p>
            <div className="flex flex-wrap gap-2">
              {["97.5% to seller", "2.5% platform", "On-chain split", "No custodian"].map((tag) => (
                <span key={tag} className="font-mono text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-7">
            <div className="mb-5">
              <div className="flex justify-between font-mono text-[10px] mb-2">
                <span className="text-zinc-500">Seller proceeds</span>
                <span className="text-white">97.5%</span>
              </div>
              <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: "97.5%" }} />
              </div>
            </div>
            <div className="mb-6">
              <div className="flex justify-between font-mono text-[10px] mb-2">
                <span className="text-zinc-500">Platform fee</span>
                <span className="text-zinc-500">2.5%</span>
              </div>
              <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-600 rounded-full" style={{ width: "2.5%" }} />
              </div>
            </div>
            <div className="h-px bg-zinc-900 mb-5" />
            <p className="font-mono text-[10px] text-zinc-600 leading-relaxed">
              Fee encoded as basis points (250 / 10000).<br />
              Adjustable by owner up to 10% max.<br />
              Distributed in the same tx as the sale.
            </p>
          </div>
        </div>
      </section>

      {/* ── Contract details ──────────────────────────────────────── */}
      <section className="relative z-5 max-w-5xl mx-auto px-5 mb-20">
        <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.12em] text-center mb-12">
          On-chain details
        </p>
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
          {[
            {
              key: "Marketplace contract",
              value: `${MARKETPLACE.slice(0, 10)}…${MARKETPLACE.slice(-4)}`,
              href: `${EXPLORER}/address/${MARKETPLACE}`,
              copy: MARKETPLACE,
            },
            {
              key: "NFT contract",
              value: `${NFT_CONTRACT.slice(0, 10)}…${NFT_CONTRACT.slice(-4)}`,
              href: `${EXPLORER}/address/${NFT_CONTRACT}`,
              copy: NFT_CONTRACT,
            },
            { key: "Network", value: "Nexus Testnet · Chain ID 3945" },
            { key: "Platform fee", value: "250 basis points (2.5%)" },
            { key: "Standard", value: "ERC-721 · NexusMarketplace v1" },
          ].map(({ key, value, href, copy }, i, arr) => (
            <div
              key={key}
              className={`flex items-center justify-between px-7 py-4 ${
                i < arr.length - 1 ? "border-b border-zinc-900" : ""
              }`}
            >
              <span className="font-mono text-[10px] text-zinc-600">{key}</span>
              <div className="flex items-center gap-3">
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    {value} ↗
                  </a>
                ) : (
                  <span className="font-mono text-[11px] text-zinc-400">{value}</span>
                )}
                {copy && (
                  <CopyButton text={copy} />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────── */}
      <section className="relative z-5 max-w-5xl mx-auto px-5 mb-16">
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl px-10 py-14 text-center"
          style={{
            backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,.06) 0%, transparent 60%)",
          }}
        >
          <h2 className="text-3xl font-semibold tracking-tight mb-4">
            Start trading now
          </h2>
          <p className="text-zinc-500 text-sm mb-8 font-light">
            Connect your wallet and jump into the Nexus NFT ecosystem.
          </p>
          <Link
            href="/marketplace"
            className="inline-block font-mono text-sm bg-white text-black px-8 py-3.5 rounded-xl font-medium hover:bg-zinc-100 transition-all hover:-translate-y-0.5"
          >
            Open Marketplace →
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="relative z-5 border-t border-zinc-900 px-8 py-8 flex items-center justify-between">
        <span className="font-mono text-xs text-zinc-700">
          0xzvan<span className="text-zinc-800">.nft</span>
        </span>
        <div className="flex gap-6">
          <Link href="/marketplace" className="font-mono text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors">
            Marketplace
          </Link>
          <a
            href="https://github.com/Zaeni21/0xzvan.nft"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors"
          >
            GitHub ↗
          </a>
          <a
            href={`${EXPLORER}/address/${MARKETPLACE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors"
          >
            Explorer ↗
          </a>
        </div>
        <span className="font-mono text-[10px] text-zinc-800">Nexus Testnet · 3945</span>
      </footer>
    </main>
  );
}

// ─── Copy Button (client component) ───────────────────────────────────────────
// Note: extract to a separate "use client" component file if needed

function CopyButton({ text }: { text: string }) {
  // In Next.js App Router, inline interactivity needs "use client"
  // Extract this to: src/components/CopyButton.tsx with "use client" at top
  return (
    <button
      className="font-mono text-[9px] text-zinc-600 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md hover:text-zinc-300 hover:border-zinc-700 transition-colors"
      onClick={() => {
        if (typeof navigator !== "undefined") {
          navigator.clipboard.writeText(text);
        }
      }}
    >
      Copy
    </button>
  );
}
