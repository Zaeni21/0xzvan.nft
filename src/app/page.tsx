"use client";

import Link from "next/link";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export default function LandingPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* ─── NAVBAR ─── */}
      <nav className="flex items-center justify-between px-6 h-16 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-mono text-sm font-bold tracking-tighter">
            0XZVAN<span className="text-[#2081e2] text-blue-600">.NFT</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {!isConnected ? (
            <button 
              onClick={() => connect({ connector: injected() })}
              className="bg-black text-white px-5 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
            >
              Connect Wallet
            </button>
          ) : (
            <button 
              onClick={() => disconnect()}
              className="bg-gray-100 text-gray-500 px-5 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-gray-200 transition-all"
            >
              {short(address!)}
            </button>
          )}
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <main>
        <section className="max-w-7xl mx-auto px-6 pt-32 pb-20 text-center">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.8] mb-8 uppercase">
            Discover, collect, and sell <br/>
            <span className="text-[#2081e2] text-blue-600">extraordinary</span> NFTs
          </h1>
          
          <p className="text-xs font-mono text-gray-500 uppercase tracking-[0.2em] mb-12 max-w-xl mx-auto leading-relaxed">
            The first community-driven NFT marketplace on Nexus Network. Deploy, mint, and trade with zero friction.
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
