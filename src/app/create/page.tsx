"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { injected } from "wagmi/connectors";
import { uploadToPinata } from "@/app/actions/uploadToPinata";
import { NFT_ADDRESS_BAYC as NFT_ADDRESS, ERC721_ABI } from "@/lib/marketplace";
import { useToast } from "@/app/components/Toast";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

type Step = "idle" | "uploading" | "minting" | "confirming" | "done";

const STEPS: { key: Step; label: string }[] = [
  { key: "uploading", label: "Uploading to IPFS" },
  { key: "minting", label: "Confirm in wallet" },
  { key: "confirming", label: "Waiting confirmation" },
  { key: "done", label: "Minted!" },
];

export default function CreatePage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract, data: txHash } = useWriteContract();
  const { isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const { success, error: toastError } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleMint = async () => {
    if (!file || !name || !address) {
      toastError("Please upload an image and fill in the NFT name");
      return;
    }

    try {
      // Step 1: Upload to IPFS
      setStep("uploading");
      const result = await uploadToPinata(file, name, description);
      if (!result.success) throw new Error(result.error || "Upload failed");

      // Step 2: Send tx
      setStep("minting");
      writeContract({
        address: NFT_ADDRESS,
        abi: ERC721_ABI,
        functionName: "mint",
        args: [result.metadataUri!],
        // @ts-ignore - callback after hash received
        onSuccess: () => setStep("confirming"),
      });

      // Step 3 & 4 handled by useWaitForTransactionReceipt below
      setStep("confirming");
    } catch (err: any) {
      console.error(err);
      toastError(err.message || "Mint failed");
      setStep("idle");
    }
  };

  // Watch tx success
  if (isTxSuccess && step === "confirming") {
    setStep("done");
    success("NFT minted successfully! Image & metadata stored on IPFS.");
    setTimeout(() => {
      setStep("idle");
      setFile(null);
      setPreview(null);
      setName("");
      setDescription("");
    }, 2000);
  }

  const isBusy = step !== "idle" && step !== "done";
  const activeStepIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <nav className="flex items-center justify-between px-6 h-16 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <Link href="/" className="font-mono text-sm font-bold tracking-tighter">
          0XZVAN<span className="text-[#2081e2]">.NFT</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/my-nfts" className="text-[10px] font-mono font-bold text-gray-500 hover:text-gray-900 uppercase tracking-widest hidden sm:block">
            My NFTs
          </Link>
          <Link href="/marketplace" className="text-[10px] font-mono font-bold text-gray-500 hover:text-gray-900 uppercase tracking-widest hidden sm:block">
            Marketplace
          </Link>
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

      <main className="max-w-xl mx-auto py-12 px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create New NFT</h1>
          <p className="text-xs font-mono text-gray-500 uppercase">Mint permanently to IPFS + Nexus</p>
        </div>

        <div className="bg-gray-50/70 border border-gray-100 p-8 rounded-3xl space-y-6">

          {/* Image Upload + Preview */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-gray-400 mb-3 uppercase tracking-widest">Upload Image</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`relative w-full aspect-square rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-all
                ${preview ? "border-transparent" : "border-gray-200 hover:border-[#2081e2] bg-white"}`}
            >
              {preview ? (
                <>
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Change Image</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl">🖼️</div>
                  <p className="text-sm text-gray-500 text-center">Click to upload image<br /><span className="text-xs text-gray-400">PNG, JPG, GIF, WEBP</span></p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            {file && <p className="mt-2 text-xs text-green-600 font-mono">✓ {file.name}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">NFT Name</label>
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
            <label className="block text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your extraordinary NFT..."
              rows={3}
              className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#2081e2] resize-none"
            />
          </div>

          {/* Transaction Progress */}
          {step !== "idle" && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4">Progress</p>
              <div className="space-y-3">
                {STEPS.map((s, i) => {
                  const isDone = activeStepIdx > i || step === "done";
                  const isActive = activeStepIdx === i && step !== "done";
                  return (
                    <div key={s.key} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                        ${isDone ? "bg-green-500 text-white" : isActive ? "bg-[#2081e2] text-white" : "bg-gray-100 text-gray-400"}`}>
                        {isDone ? "✓" : isActive ? (
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                        ) : i + 1}
                      </div>
                      <span className={`text-sm ${isDone ? "text-green-600" : isActive ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mint Button */}
          <button
            onClick={handleMint}
            disabled={isBusy || !file || !name || !isConnected}
            className="w-full bg-[#2081e2] hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl text-sm tracking-widest transition-all"
          >
            {isBusy ? "PROCESSING..." : step === "done" ? "✓ MINTED!" : "MINT NFT"}
          </button>

          {!isConnected && (
            <p className="text-center text-xs text-gray-400 font-mono">Connect wallet to mint</p>
          )}
        </div>
      </main>
    </div>
  );
}
