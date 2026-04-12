"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useConnect, useDisconnect, useWriteContract } from "wagmi";
import { injected } from "wagmi/connectors";
import { uploadToPinata } from "@/app/actions/uploadToPinata";
import { NFT_ADDRESS, ERC721_ABI } from "@/lib/marketplace";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export default function CreatePage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract } = useWriteContract();

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMint = async () => {
    if (!file || !name || !address) {
      alert("Please upload an image and fill the name");
      return;
    }

    setLoading(true);

    try {
      // Upload ke Pinata
      const uploadResult = await uploadToPinata(file, name, description);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Upload to Pinata failed");
      }

      // Mint NFT dengan IPFS URI
      writeContract({
        address: NFT_ADDRESS,
        abi: ERC721_ABI,
        functionName: "mint",
        args: [uploadResult.metadataUri!],
      });

      alert("✅ NFT successfully minted!\nImage & Metadata stored permanently on IPFS via Pinata.");

      // Reset form
      setFile(null);
      setName("");
      setDescription("");

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Minting failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 h-16 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-mono text-sm font-bold tracking-tighter">
            0XZVAN<span className="text-[#2081e2]">.NFT</span>
          </Link>
        </div>
        <div>
          {isConnected ? (
            <button 
              onClick={() => disconnect()} 
              className="text-[10px] font-mono font-bold border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-50 transition-all uppercase tracking-widest"
            >
              {short(address!)}
            </button>
          ) : (
            <button 
              onClick={() => connect({ connector: injected() })} 
              className="text-[10px] font-mono font-bold bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-all uppercase tracking-widest"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {/* Form */}
      <main className="max-w-xl mx-auto py-20 px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create New NFT</h1>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
            Upload • Pin to IPFS • Mint on Nexus
          </p>
        </div>

        <div className="bg-gray-50/70 border border-gray-100 p-8 rounded-3xl space-y-8">
          {/* Upload Image */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">
              NFT Image
            </label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
              className="w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-white file:bg-[#2081e2] hover:file:bg-blue-600 file:font-medium transition-all"
            />
            {file && <p className="mt-2 text-xs text-green-600 font-mono">✓ {file.name}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">
              NFT Name
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Nexus Explorer #001"
              className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#2081e2]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">
              Description (optional)
            </label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe your extraordinary NFT..."
              rows={4}
              className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#2081e2] resize-y"
            />
          </div>

          {/* Mint Button */}
          <button 
            onClick={handleMint} 
            disabled={loading || !file || !name || !isConnected}
            className="w-full bg-[#2081e2] hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-4 rounded-2xl text-sm tracking-widest transition-all"
          >
            {loading ? "UPLOADING TO IPFS & MINTING..." : "MINT NFT TO PINATA"}
          </button>

          <p className="text-center text-[10px] text-gray-400 font-mono">
            Your file and metadata will be stored permanently on IPFS via Pinata
          </p>
        </div>
      </main>
    </div>
  );
}
