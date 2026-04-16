"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { getAddress, parseEther } from "viem";
import { ERC721_ABI, MARKETPLACE_ADDRESS, MARKETPLACE_ABI, NFT_ADDRESS_BAYC as NFT_ADDRESS } from "@/lib/marketplace";
import { useToast } from "@/app/components/Toast";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const resolveIpfs = (uri: string) => {
  if (!uri) return "";
  if (uri.startsWith("data:")) return uri; // data:image/... or data:application/json;base64,...
  const gw = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";
  return uri.startsWith("ipfs://") ? uri.replace("ipfs://", `https://${gw}/ipfs/`) : uri;
};

// Handle semua format tokenURI: data:application/json;base64,, ipfs://, https://
const resolveMetaUri = async (tokenUri: string): Promise<any> => {
  if (!tokenUri) return null;
  try {
    if (tokenUri.startsWith("data:application/json;base64,")) {
      return JSON.parse(atob(tokenUri.split(",")[1]));
    }
    if (tokenUri.startsWith("data:application/json,")) {
      return JSON.parse(decodeURIComponent(tokenUri.split(",")[1]));
    }
    const res = await fetch(resolveIpfs(tokenUri), { cache: "force-cache" });
    return res.ok ? await res.json() : null;
  } catch { return null; }
};

// Render NFT image — handle data:image/svg+xml;base64, inline agar tidak kena CSP block
function NFTImage({ src, fallback, alt, className }: { src: string; fallback: string; alt: string; className?: string }) {
  const [errored, setErrored] = useState(false);
  return (
    <img
      src={errored || !src ? fallback : src}
      alt={alt}
      className={className}
      onError={() => { if (!errored) setErrored(true); }}
    />
  );
}

// Minimal ABI untuk read-only: tokenURI + ownerOf
const READ_ABI = [
  { inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }], name: "tokenURI", outputs: [{ internalType: "string", name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }], name: "ownerOf", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
] as const;

export default function NFTDetailPage({ params: p }: { params: Promise<{ address: string; tokenId: string }> }) {
  const { address: contractAddress, tokenId } = use(p);
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  const { success, error: toastError, loading: toastLoading, dismiss } = useToast();

  const [meta, setMeta] = useState<any>(null);
  const [attrs, setAttrs] = useState<{trait_type:string;value:string|number}[]>([]);
  const [image, setImage] = useState(`/api/image/${tokenId}`);
  const [owner, setOwner] = useState<string | null>(null);
  const [listing, setListing] = useState<{ price: bigint; seller: string } | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [showListModal, setShowListModal] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const [listStep, setListStep] = useState<0 | 1>(0);

  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const isOwner = !!(userAddress && owner && getAddress(userAddress) === getAddress(owner));
  const isListedByUser = !!(listing && userAddress && getAddress(listing.seller) === getAddress(userAddress));

  useEffect(() => {
    if (!publicClient) return;
    const load = async () => {
      setLoadingMeta(true);
      try {
        const [tokenUri, ownerAddr] = await Promise.all([
          publicClient.readContract({ address: contractAddress as `0x${string}`, abi: READ_ABI, functionName: "tokenURI", args: [BigInt(tokenId)] }) as Promise<string>,
          publicClient.readContract({ address: contractAddress as `0x${string}`, abi: READ_ABI, functionName: "ownerOf", args: [BigInt(tokenId)] }) as Promise<string>,
        ]);
        setOwner(ownerAddr);
        if (tokenUri) {
          const data = await resolveMetaUri(tokenUri);
          if (data) {
            setMeta(data);
            if (data.image) setImage(resolveIpfs(data.image));
            if (data.attributes) setAttrs(data.attributes);
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoadingMeta(false); }
    };
    load();
  }, [contractAddress, tokenId, publicClient]);

  // Handle list steps success
  useEffect(() => {
    if (!isSuccess) return;
    if (listStep === 0) {
      setListStep(1);
      reset();
    } else if (listStep === 1) {
      success("NFT listed successfully!");
      setShowListModal(false);
      setListStep(0);
      setListPrice("");
      reset();
    }
  }, [isSuccess, listStep]);

  const handleList = () => {
    if (listStep === 0) {
      writeContract({ address: contractAddress as `0x${string}`, abi: ERC721_ABI, functionName: "setApprovalForAll", args: [MARKETPLACE_ADDRESS, true] });
    } else {
      writeContract({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "listNFT", args: [contractAddress as `0x${string}`, BigInt(tokenId), parseEther(listPrice)] });
    }
  };

  const name = meta?.name || `Nexus #${tokenId}`;
  const description = meta?.description || "";
  const attributes: { trait_type: string; value: string }[] = meta?.attributes || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center px-6 h-16 gap-4">
        <Link href="/" className="font-mono text-sm font-medium shrink-0">0xzvan<span className="text-[#2081e2]">.nft</span></Link>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/marketplace" className="text-xs font-mono text-gray-500 hover:text-gray-900 hidden sm:block">Marketplace</Link>
          <Link href="/my-nfts" className="text-xs font-mono text-gray-500 hover:text-gray-900 hidden sm:block">My NFTs</Link>
          {userAddress && <span className="text-xs font-mono text-gray-400 border border-gray-200 px-3 py-1.5 rounded-lg">{short(userAddress)}</span>}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mb-6">
          <Link href="/marketplace" className="hover:text-gray-700">Marketplace</Link>
          <span>/</span>
          <span className="text-gray-700 truncate">{name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="rounded-3xl overflow-hidden border border-gray-100 aspect-square bg-gray-50">
            {loadingMeta ? (
              <div className="w-full h-full animate-pulse bg-gray-100" />
            ) : (
              <NFTImage src={image} fallback={`/api/image/${tokenId}`} alt={name} className="w-full h-full object-cover" />
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-1 text-xs font-mono text-[#2081e2] mb-2">
                <span>0xzvan.nft</span><span>✓</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{name}</h1>
              {description && <p className="text-sm text-gray-500 leading-relaxed">{description}</p>}
            </div>

            {/* Owner */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">Owned by</p>
              <a href={`https://testnet.explorer.nexus.xyz/address/${owner}`} target="_blank" rel="noreferrer"
                className="text-sm font-mono text-[#2081e2] hover:underline">
                {owner ? (isOwner ? `${short(owner)} (you)` : short(owner)) : "—"}
              </a>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm border border-gray-100 rounded-2xl divide-y divide-gray-100">
              {[
                { label: "Token ID", value: `#${tokenId}` },
                { label: "Contract", value: short(contractAddress), href: `https://testnet.explorer.nexus.xyz/address/${contractAddress}` },
                { label: "Chain", value: "Nexus Testnet" },
                { label: "Standard", value: "ERC-721" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between px-4 py-3">
                  <span className="text-gray-400 font-mono text-xs">{item.label}</span>
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noreferrer" className="font-mono text-xs text-[#2081e2] hover:underline">{item.value}</a>
                  ) : (
                    <span className="font-mono text-xs text-gray-700">{item.value}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Attributes */}
            {attrs.length > 0 && (
              <div>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-3">Attributes</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {attrs.map((a, i) => (
                    <div key={i} className="bg-blue-50 border border-blue-100 rounded-2xl px-3 py-2.5 text-center">
                      <p className="text-[9px] font-mono text-blue-400 uppercase tracking-wider truncate">{a.trait_type}</p>
                      <p className="text-xs font-semibold text-blue-900 mt-0.5 truncate">{String(a.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {isOwner && (
              <button onClick={() => setShowListModal(true)}
                className="w-full h-12 bg-[#2081e2] hover:bg-[#1a6fc4] text-white rounded-2xl font-medium transition-colors">
                List for Sale
              </button>
            )}

            <Link href={`https://testnet.explorer.nexus.xyz/token/${contractAddress}/instance/${tokenId}`}
              target="_blank" rel="noreferrer"
              className="text-center text-xs font-mono text-gray-400 hover:text-gray-600">
              View on Explorer ↗
            </Link>
          </div>
        </div>

        {/* Attributes */}
        {attributes.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-mono font-bold text-gray-400 uppercase tracking-widest mb-4">Attributes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {attributes.map((a, i) => (
                <div key={i} className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-center">
                  <p className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-1">{a.trait_type}</p>
                  <p className="text-sm font-semibold text-blue-900">{a.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* List Modal */}
      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowListModal(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">List for Sale</h2>
              <button onClick={() => setShowListModal(false)} className="text-2xl text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {/* Steps */}
            <div className="flex items-center gap-3 mb-6">
              {["Approve", "List"].map((label, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all
                    ${listStep === i ? "bg-[#2081e2] border-[#2081e2] text-white" : listStep > i ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-gray-400"}`}>
                    {listStep > i ? "✓" : i + 1}
                  </div>
                  <div className="ml-2 text-xs font-medium text-gray-600">{label}</div>
                  {i === 0 && <div className="flex-1 h-px bg-gray-200 mx-3" />}
                </div>
              ))}
            </div>

            {listStep === 1 && (
              <div className="mb-6">
                <label className="text-xs font-mono text-gray-500 block mb-2">Price (NEX)</label>
                <div className="relative">
                  <input type="number" step="0.001" value={listPrice} onChange={(e) => setListPrice(e.target.value)} placeholder="5.0"
                    className="w-full h-11 border border-gray-200 rounded-2xl px-4 pr-16 text-sm font-mono focus:border-[#2081e2] outline-none" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-gray-400">NEX</span>
                </div>
              </div>
            )}

            <button onClick={handleList}
              disabled={isPending || isConfirming || (listStep === 1 && !listPrice)}
              className="w-full h-12 bg-[#2081e2] hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium rounded-2xl transition-colors">
              {isPending || isConfirming
                ? (listStep === 0 ? "Approving..." : "Listing...")
                : listStep === 0 ? "Step 1: Approve" : "Step 2: List NFT"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
