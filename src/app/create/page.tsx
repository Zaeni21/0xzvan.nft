"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useConnect, useDisconnect, useWriteContract } from "wagmi";
import { injected } from "wagmi/connectors";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { NFT_ADDRESS, ERC721_ABI } from "@/lib/marketplace";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export default function CreatePage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract } = useWriteContract();

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMint = async () => {
    if (!file || !name || !address) return;
    setLoading(true);
    try {
      const tokenId = Date.now().toString();
      const imageRef = ref(storage, `nfts/${tokenId}.png`);
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);

      await setDoc(doc(db, "metadata", tokenId), {
        name,
        image: imageUrl,
        owner: address,
      });

      writeContract({
        address: NFT_ADDRESS,
        abi: ERC721_ABI,
        functionName: "mint",
        args: [`https://0xzvan-nft.vercel.app/api/metadata/${tokenId}`] as any,
      });

      alert("Minting success!");
    } catch (err) {
      console.error(err);
      alert("Error processing mint!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* ─── NAVBAR (SAMA KAYA LANDING PAGE) ─── */}
      <nav className="flex items-center justify-between px-6 h-16 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-mono text-sm font-bold tracking-tighter">
            0XZVAN<span className="text-[#2081e2]">.NFT</span>
          </Link>
        </div>
        <div>
          {isConnected ? (
            <button onClick={() => disconnect()} className="text-[10px] font-mono font-bold border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-50 transition-all uppercase tracking-widest">
              {short(address!)}
            </button>
          ) : (
            <button onClick={() => connect({ connector: injected() })} className="text-[10px] font-mono font-bold bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-all uppercase tracking-widest">
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {/* ─── FORM CREATE (TEMA BERSIH) ─── */}
      <main className="max-w-xl mx-auto py-20 px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create New NFT</h1>
          <p className="text-xs font-mono text-gray-500 uppercase">Mint your assets to Nexus Blockchain</p>
        </div>

        <div className="space-y-8 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
          <div>
            <label className="block text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Upload File</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-xs font-mono file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-[#2081e2] file:text-white hover:file:bg-blue-600" />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">NFT Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nexus Collector #01" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2081e2]/20 transition-all" />
          </div>

          <button 
            onClick={handleMint} 
            disabled={loading || !isConnected}
            className="w-full bg-[#2081e2] text-white py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {loading ? "PROCESSING..." : "MINT NFT"}
          </button>
        </div>
      </main>
    </div>
  );
}
