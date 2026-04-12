"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useConnect, usePublicClient, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { NFT_ADDRESS, ERC721_ABI } from "@/lib/marketplace";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

interface OwnedNFT {
  tokenId: bigint;
  tokenUri: string;
  name: string;
  image: string;
  description?: string;
}

const resolveIpfs = (uri: string) => {
  const gw = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";
  return uri.startsWith("ipfs://") ? uri.replace("ipfs://", `https://${gw}/ipfs/`) : uri;
};

export default function MyNFTsPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();

  const [nfts, setNfts] = useState<OwnedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !publicClient) return;

    const fetchMyNFTs = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get all Transfer events: received & sent
        const base = { address: NFT_ADDRESS as `0x${string}` };
        const TRANSFER_EVENT = {
          type: "event" as const,
          name: "Transfer",
          inputs: [
            { name: "from", type: "address", indexed: true },
            { name: "to", type: "address", indexed: true },
            { name: "tokenId", type: "uint256", indexed: true },
          ],
        };

        const [received, sent] = await Promise.all([
          publicClient.getLogs({ ...base, event: TRANSFER_EVENT, args: { to: address }, fromBlock: 0n, toBlock: "latest" }).catch(() => []),
          publicClient.getLogs({ ...base, event: TRANSFER_EVENT, args: { from: address }, fromBlock: 0n, toBlock: "latest" }).catch(() => []),
        ]);

        // Owned = received tokenIds minus sent
        const sentIds = new Set(sent.map((l: any) => l.args.tokenId.toString()));
        const ownedIds = [...new Set(
          received
            .map((l: any) => l.args.tokenId as bigint)
            .filter((id: bigint) => !sentIds.has(id.toString()))
        )];

        // Fetch metadata for each
        const result: OwnedNFT[] = [];
        for (const tokenId of ownedIds) {
          try {
            const tokenUri = await publicClient.readContract({
              address: NFT_ADDRESS as `0x${string}`,
              abi: ERC721_ABI,
              functionName: "tokenURI",
              args: [tokenId],
            }) as string;

            let name = `Nexus #${tokenId}`;
            let image = `/api/image/${tokenId}`;
            let description = "";

            if (tokenUri) {
              const res = await fetch(resolveIpfs(tokenUri)).catch(() => null);
              const meta = res?.ok ? await res.json().catch(() => null) : null;
              if (meta) {
                name = meta.name || name;
                description = meta.description || "";
                if (meta.image) image = resolveIpfs(meta.image);
              }
            }

            result.push({ tokenId, tokenUri, name, image, description });
          } catch {
            result.push({ tokenId, tokenUri: "", name: `Nexus #${tokenId}`, image: `/api/image/${tokenId}` });
          }
        }

        setNfts(result.reverse());
      } catch (err: any) {
        setError(err.message || "Failed to load NFTs");
      } finally {
        setLoading(false);
      }
    };

    fetchMyNFTs();
  }, [address, publicClient]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center px-6 h-16 gap-4">
        <Link href="/" className="font-mono text-sm font-medium shrink-0">
          0xzvan<span className="text-[#2081e2]">.nft</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/create" className="h-9 px-4 bg-[#2081e2] text-white rounded-xl text-xs font-mono font-medium hover:bg-[#1a6fc4] transition-colors">
            + Mint NFT
          </Link>
          <Link href="/marketplace" className="h-9 px-4 border border-gray-200 rounded-xl text-xs font-mono font-medium hover:bg-gray-50 transition-colors flex items-center">
            Marketplace
          </Link>
          {isConnected ? (
            <button onClick={() => disconnect()} className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-mono hover:bg-gray-50">
              {short(address!)}
            </button>
          ) : (
            <button onClick={() => connect({ connector: injected() })} className="h-9 px-4 bg-gray-900 text-white rounded-xl text-xs font-mono hover:bg-gray-800">
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">My NFTs</h1>
          {address && <p className="text-xs font-mono text-gray-400 mt-1">{address}</p>}
        </div>

        {!isConnected ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">👛</p>
            <p className="text-gray-500 mb-6">Connect your wallet to view your NFTs</p>
            <button onClick={() => connect({ connector: injected() })} className="px-8 py-3 bg-[#2081e2] text-white rounded-2xl font-medium hover:bg-[#1a6fc4] transition-colors">
              Connect Wallet
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden border border-gray-100">
                <div className="aspect-square bg-gray-100 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="text-red-500 text-sm font-mono mb-2">Failed to load NFTs</p>
            <p className="text-gray-400 text-xs">{error}</p>
          </div>
        ) : nfts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🎨</p>
            <p className="text-gray-500 mb-6">You don't own any NFTs yet</p>
            <Link href="/create" className="px-8 py-3 bg-[#2081e2] text-white rounded-2xl font-medium hover:bg-[#1a6fc4] transition-colors">
              Mint your first NFT
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs font-mono text-gray-400 mb-6">{nfts.length} NFT{nfts.length !== 1 ? "s" : ""} owned</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {nfts.map((nft) => (
                <Link
                  key={nft.tokenId.toString()}
                  href={`/nft/${NFT_ADDRESS}/${nft.tokenId}`}
                  className="group rounded-3xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = `/api/image/${nft.tokenId}`; }}
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#2081e2] mb-1">
                      <span>0xzvan.nft</span>
                      <span>✓</span>
                    </div>
                    <p className="text-sm font-medium truncate">{nft.name}</p>
                    <p className="text-[10px] font-mono text-gray-400 mt-0.5">#{nft.tokenId.toString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
