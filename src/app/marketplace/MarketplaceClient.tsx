"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useConnect,
  useDisconnect,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { parseEther, formatEther, getAddress } from "viem";
import {
  MARKETPLACE_ADDRESS,
  NFT_ADDRESS,
  MARKETPLACE_ABI,
  ERC721_ABI,
} from "@/lib/marketplace";

interface Listing {
  seller: string;
  nftAddress: string;
  tokenId: bigint;
  price: bigint;
  blockNumber: bigint;
}

const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const NFT_ARTS = ["🌌", "⚡", "🔷", "🌀", "✨", "🔮", "🌊", "🔥", "💎", "🛸"];
const nftArt = (id: bigint) => NFT_ARTS[Number(id) % NFT_ARTS.length];

function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  if (isConnected && address) {
    return (
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 font-mono text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {shortAddr(address)}
        </button>
        {open && (
          <div className="absolute right-0 top-12 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden text-white">
            <button onClick={() => disconnect()} className="w-full px-4 py-3 text-left font-mono text-xs text-red-400 hover:bg-zinc-800">
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }
  return (
    <button onClick={() => connect({ connector: injected() })} className="px-4 py-2 rounded-xl bg-white text-black font-mono text-sm font-medium">
      Connect Wallet
    </button>
  );
}

export default function MarketplaceClient() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [tab, setTab] = useState<"browse" | "list">("browse");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const { writeContract: writeBuy, data: buyHash, isPending: isBuyPending } = useWriteContract();
  const { isSuccess: isBuySuccess } = useWaitForTransactionReceipt({ hash: buyHash });

  const fetchListings = useCallback(async () => {
    if (!publicClient) return;
    setLoading(true);
    try {
      const logs = await publicClient.getLogs({ 
        address: MARKETPLACE_ADDRESS, 
        event: { type: "event", name: "NFTListed", inputs: [{ name: "seller", type: "address", indexed: true }, { name: "nftAddress", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }, { name: "price", type: "uint256" }]}, 
        fromBlock: 0n 
      });
      setListings(logs.map((log: any) => ({ ...log.args, blockNumber: log.blockNumber ?? 0n })));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [publicClient]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <nav className="flex justify-between items-center mb-12">
          <h1 className="text-xl font-mono">0xzvan<span className="text-zinc-500">.nft</span></h1>
          <WalletButton />
        </nav>
        
        <div className="flex gap-4 mb-8">
          <button onClick={() => setTab("browse")} className={`px-4 py-2 rounded-lg font-mono text-xs ${tab === "browse" ? "bg-white text-black" : "text-zinc-500"}`}>Browse</button>
          <button onClick={() => setTab("list")} className={`px-4 py-2 rounded-lg font-mono text-xs ${tab === "list" ? "bg-white text-black" : "text-zinc-500"}`}>List NFT</button>
        </div>

        {tab === "browse" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {listings.map((l, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="aspect-square bg-zinc-800 rounded-xl mb-4 flex items-center justify-center text-4xl">
                  {nftArt(l.tokenId)}
                </div>
                <p className="font-mono text-[10px] text-zinc-500">#{l.tokenId.toString()}</p>
                <p className="font-mono text-sm">{formatEther(l.price)} NEX</p>
                <button 
                  onClick={() => writeBuy({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "buyNFT", args: [l.nftAddress as `0x${string}`, l.tokenId], value: l.price })}
                  className="w-full mt-4 py-2 bg-white text-black rounded-lg text-xs font-bold"
                >
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
