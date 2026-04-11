"use client";

import dynamic from "next/dynamic";

const MarketplaceClient = dynamic(() => import("./MarketplaceClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center font-mono text-xs tracking-widest uppercase">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-3" />
      Syncing Marketplace...
    </div>
  ),
});

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
