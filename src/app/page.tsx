"use client";

import Head from "next/head";
import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <Head>
        <meta name="base:app_id" content="699d9d9812d4a113d9719f69" />
      </Head>
      <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 h-16 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-mono text-sm font-bold tracking-tighter">
            0XZVAN<span className="text-[#2081e2]">.NFT</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/marketplace"
            className="bg-black text-white px-6 py-2.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
          >
            LAUNCH APP
          </Link>
        </div>
      </nav>

      {/* HERO SECTION - Diperbaiki ukuran teksnya */}
      <main>
        <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] mb-8 uppercase">
            DISCOVER, COLLECT, AND SELL
            <br className="hidden md:block" />
            <span className="text-[#2081e2] block md:inline">EXTRAORDINARY</span> NFTs
          </h1>

          <p className="text-sm md:text-base font-light text-gray-600 max-w-2xl mx-auto leading-relaxed mb-12">
            The first community-driven NFT marketplace on Nexus Network.
            Deploy, mint, and trade with zero friction.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              href="/marketplace"
              className="w-full sm:w-auto bg-[#2081e2] hover:bg-blue-600 text-white px-10 py-4 rounded-full text-sm font-mono font-bold uppercase tracking-widest transition-all shadow-lg"
            >
              EXPLORE MARKETPLACE
            </Link>
            <Link
              href="/create"
              className="w-full sm:w-auto bg-black hover:bg-zinc-800 text-white px-10 py-4 rounded-full text-sm font-mono font-bold uppercase tracking-widest transition-all shadow-lg"
            >
              CREATE NFT
            </Link>
          </div>
        </section>
      </main>
      </div>
    </>
  );
}
