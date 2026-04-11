import Link from "next/link";

const MARKETPLACE = "0x5645cC460DFa9CE4Dea89DC9df331C0C1721FDFf";
const NFT_CONTRACT = "0x1EF92429dBB23E3fc563d203be756E07c12AB7Df";
const EXPLORER = "https://testnet.explorer.nexus.xyz";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#080809] text-white flex flex-col items-center justify-center p-5 text-center">
      {/* Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10">
        <h1 className="text-7xl font-black mb-6 tracking-tighter italic">
          0xzvan<span className="text-zinc-700">.nft</span>
        </h1>
        
        <p className="text-zinc-400 max-w-lg mx-auto mb-12 font-mono text-sm leading-relaxed uppercase tracking-widest">
          The next generation NFT protocol on Nexus Testnet. 
          <span className="block mt-2 text-zinc-600 text-[10px]">Secure • Instant • Decenteralized</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/marketplace" className="w-full sm:w-auto bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-tighter hover:bg-zinc-200 transition-all active:scale-95">
            Enter Marketplace
          </Link>
          
          <a 
            href={`${EXPLORER}/address/${MARKETPLACE}`} 
            target="_blank" 
            className="w-full sm:w-auto border border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-10 py-4 rounded-2xl font-bold hover:bg-zinc-900 transition-all text-sm"
          >
            View Contract ↗
          </a>
        </div>

        {/* Stats Minimalis */}
        <div className="mt-24 grid grid-cols-3 gap-8 border-t border-zinc-900 pt-12">
          <div>
            <p className="text-zinc-500 text-[10px] uppercase font-mono">Network</p>
            <p className="text-emerald-500 font-bold">Nexus</p>
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] uppercase font-mono">Status</p>
            <p className="text-white font-bold">Testnet</p>
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] uppercase font-mono">Fee</p>
            <p className="text-white font-bold">0%</p>
          </div>
        </div>
      </div>
    </main>
  );
}
