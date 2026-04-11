"use client";

import Link from "next/link";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

// Helper untuk ringkas alamat
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
            0XZVAN<span className="text-[#2081e2]">.NFT</span>
          </Link>
          <div className="hidden md:flex gap-6 text-xs font-mono text-gray-500 uppercase tracking-widest">
            <Link href="/marketplace" className="hover:text-[#2081e2] transition-colors">Marketplace</Link>
            <a href="#" className="hover:text-[#2081e2] transition-colors">Stats</a>
            <a href="#" className="hover:text-[#2081e2] transition-colors">Resources</a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isConnected ? (
            <button 
              onClick={() => disconnect()}
              className="h-9 px-4 rounded-xl border border-gray-200 bg-white text-[11px] font-mono hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {short(address as string)}
            </button>
          ) : (
            <button 
              onClick={() => connect({ connector: injected() })}
              className="h-9 px-6 bg-[#2081e2] text-white text-[11px] font-mono font-bold rounded-xl hover:bg-[#1a6fc4] transition-all"
            >
              CONNECT WALLET
            </button>
          )}
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <main>
        <section className="relative overflow-hidden pt-20 pb-32 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2081e2] text-[10px] font-mono font-bold mb-8 uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Nexus Testnet Live
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6 max-w-4xl">
              Discover, collect, and sell <span className="text-[#2081e2]">extraordinary</span> NFTs
            </h1>
            
            <p className="text-gray-500 text-sm md:text-base font-mono max-w-2xl mb-10 leading-relaxed">
              The first community-driven NFT marketplace on Nexus Network. 
              Deploy, mint, and trade with zero friction.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/marketplace" 
                className="px-10 py-4 bg-[#2081e2] text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-all"
              >
                Explore Marketplace
              </Link>
              <button className="px-10 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl font-bold hover:bg-gray-50 transition-all">
                Create NFT
              </button>
            </div>
          </div>

          {/* Background Decorative Circles */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-violet-50 rounded-full blur-[120px] opacity-60"></div>
          </div>
        </section>

        {/* ─── STATS SECTION ─── */}
        <section className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 border border-gray-100 rounded-[2.5rem] bg-gray-50/50">
            {[
              { label: "Chain ID", value: "3945" },
              { label: "Network", value: "Nexus" },
              { label: "Platform Fee", value: "2.5%" },
              { label: "Status", value: "Active" }
            ].map((stat, i) => (
              <div key={i} className="text-center md:border-r last:border-0 border-gray-200/50 py-4">
                <p className="text-xl font-bold font-mono text-gray-900 mb-1">{stat.value}</p>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FEATURE SECTION ─── */}
        <section className="max-w-7xl mx-auto px-6 py-32">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { title: "Set up your wallet", desc: "Connect your Mises or MetaMask wallet to the Nexus Testnet and get started.", icon: "🔌" },
              { title: "Create collection", desc: "Mint your unique digital assets directly on the Nexus blockchain protocol.", icon: "🖼️" },
              { title: "List them for sale", desc: "Choose between fixed-price listings or auctions to sell your favorite NFTs.", icon: "🏷️" }
            ].map((feature, i) => (
              <div key={i} className="group p-8 border border-transparent hover:border-gray-100 hover:bg-white rounded-[2rem] transition-all">
                <div className="text-3xl mb-6">{feature.icon}</div>
                <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
                <p className="text-xs font-mono text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            © 2026 0XZVAN.NFT Protocol · All Rights Reserved
          </p>
          <div className="flex gap-8 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            <a href="https://testnet.explorer.nexus.xyz" target="_blank" className="hover:text-[#2081e2]">Explorer</a>
            <a href="#" className="hover:text-[#2081e2]">Privacy</a>
            <a href="#" className="hover:text-[#2081e2]">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
