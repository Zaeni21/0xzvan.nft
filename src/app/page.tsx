"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* ─── NAVBAR ─── */}
      <nav className="flex items-center justify-between px-6 h-16 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-mono text-sm font-bold tracking-tighter">
            0XZVAN<span className="text-[#2081e2]">.NFT</span>
          </Link>
        </div>

        {/* Navigation links (bisa ditambah nanti) */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/marketplace" className="hover:text-[#2081e2] transition-colors">
            Marketplace
          </Link>
          <Link href="/create" className="hover:text-[#2081e2] transition-colors">
            Create
          </Link>
          <Link href="/collections" className="hover:text-[#2081e2] transition-colors">
            Collections
          </Link>
        </div>

        {/* Tombol Connect Wallet dihilangkan */}
        <div className="flex items-center gap-4">
          <Link 
            href="/marketplace"
            className="bg-black text-white px-6 py-2.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <main>
        <section className="max-w-7xl mx-auto px-6 pt-32 pb-20 text-center">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.8] mb-8 uppercase">
            Discover, collect, and sell <br/>
            <span className="text-[#2081e2]">extraordinary</span> NFTs
          </h1>
          
          <p className="text-xs font-mono text-gray-500 uppercase tracking-[0.2em] mb-12 max-w-xl mx-auto leading-relaxed">
            The first community-driven NFT marketplace on Nexus Network. 
            Deploy, mint, and trade with zero friction.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/marketplace" 
              className="w-full sm:w-auto bg-[#2081e2] text-white px-10 py-5 rounded-full text-xs font-mono font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-100"
            >
              Explore Marketplace
            </Link>
            <Link 
              href="/create" 
              className="w-full sm:w-auto bg-black text-white px-10 py-5 rounded-full text-xs font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200"
            >
              Create NFT
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
