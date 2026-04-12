"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { storage, db } from "@/lib/firebase"; // Pastikan path ini benar
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { NFT_ADDRESS, ERC721_ABI } from "@/lib/marketplace";

export default function CreatePage() {
  const { address, isConnected } = useAccount();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { writeContract } = useWriteContract();

  const handleMint = async () => {
    if (!file || !name || !address) return;
    setLoading(true);
    try {
      // 1. Upload Gambar ke Firebase Storage
      const tokenId = Date.now().toString(); // Contoh ID unik sederhana
      const imageRef = ref(storage, `nfts/${tokenId}.png`);
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);

      // 2. Simpan Metadata ke Firestore
      await setDoc(doc(db, "metadata", tokenId), {
        name,
        image: imageUrl,
        owner: address,
        attributes: []
      });

      // 3. Minting di Smart Contract
      writeContract({
        address: NFT_ADDRESS,
        abi: ERC721_ABI,
        functionName: "mint",
        args: [`https://0xzvan-nft.vercel.app/api/metadata/${tokenId}`] as any,
      });

      alert("Minting success & metadata saved!");
    } catch (err) {
      console.error(err);
      alert("Error processing mint!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-mono">
      <div className="max-w-md mx-auto border border-zinc-800 p-6 rounded-lg bg-zinc-900/50">
        <h1 className="text-xl mb-6 text-emerald-500 underline">CREATE NEW NFT</h1>
        {!isConnected ? (
          <p className="text-red-400 text-xs text-center">PLEASE CONNECT WALLET...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1 uppercase">NFT Image</label>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full bg-zinc-800 text-xs p-2 border border-zinc-700" />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1 uppercase">NFT Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nexus Collector #01" className="w-full bg-zinc-800 text-xs p-2 border border-zinc-700 outline-none focus:border-emerald-500" />
            </div>
            <button onClick={handleMint} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-black py-2 text-xs font-bold transition-all disabled:opacity-50">
              {loading ? "PROCESSING..." : "MINT TO NEXUS"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
