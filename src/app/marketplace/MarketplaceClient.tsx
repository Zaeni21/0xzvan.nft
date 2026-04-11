"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  useAccount, 
  useWriteContract, 
  usePublicClient, 
  useConnect, 
  useDisconnect,
  useSwitchChain 
} from "wagmi";
import { injected } from "wagmi/connectors";
import { formatEther, parseEther } from "viem";
import { 
  MARKETPLACE_ADDRESS, 
  MARKETPLACE_ABI,
  NFT_ADDRESS,
  ERC721_ABI 
} from "@/lib/marketplace";

const CHAIN_ID = 3945;
const CHAIN_ID_HEX = `0x${CHAIN_ID.toString(16)}`;
const RPC_URL = 'https://testnet.rpc.nexus.xyz';
const IPFS_GATEWAY = "https://ipfs.io/ipfs/bafybeidugde7xt3w65absgiv7o5qjkgtrgm4klrpip4viol6ur7mfsaaj4";

export default function MarketplaceClient() {
  const [mounted, setMounted] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [myNFTs, setMyNFTs] = useState<bigint[]>([]); // Simpan Koleksi User
  const { address, isConnected, chainId } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContract } = useWriteContract();

  useEffect(() => { setMounted(true); }, []);

  // 1. AMBIL DATA MARKETPLACE (YANG DIJUAL)
  const fetchMarketplace = useCallback(async () => {
    if (!publicClient) return;
    try {
      const logs = await publicClient.getLogs({ 
        address: MARKETPLACE_ADDRESS, 
        event: { 
          type: "event", 
          name: "NFTListed", 
          inputs: [
            { name: "seller", type: "address", indexed: true },
            { name: "nftAddress", type: "address", indexed: true },
            { name: "tokenId", type: "uint256", indexed: true },
            { name: "price", type: "uint256" }
          ]
        }, 
        fromBlock: 0n 
      });
      setListings(logs.map(log => log.args));
    } catch (err) { console.error("Market error:", err); }
  }, [publicClient]);

  // 2. AMBIL KOLEKSI PRIBADI (YANG DIMILIKI USER)
  const fetchMyCollection = useCallback(async () => {
    if (!publicClient || !address) return;
    try {
      // Kita scan logs Transfer untuk tahu NFT apa saja yang pernah masuk ke wallet ini
      const logs = await publicClient.getLogs({
        address: NFT_ADDRESS,
        event: {
          type: "event",
          name: "Transfer",
          inputs: [
            { name: "from", type: "address", indexed: true },
            { name: "to", type: "address", indexed: true },
            { name: "tokenId", type: "uint256", indexed: true }
          ]
        },
        args: { to: address },
        fromBlock: 0n
      });

      const ids = logs.map(log => log.args.tokenId as bigint);
      // Filter unik
      setMyNFTs([...new Set(ids)]);
    } catch (err) { console.error("Collection error:", err); }
  }, [publicClient, address]);

  useEffect(() => { 
    if (mounted) {
      fetchMarketplace();
      if (isConnected) fetchMyCollection();
    }
  }, [mounted, isConnected, fetchMarketplace, fetchMyCollection]);

  const validateNetwork = async () => {
    if (chainId !== CHAIN_ID) {
      await switchChain({ chainId: CHAIN_ID });
      return false;
    }
    return true;
  };

  // 3. FUNGSI SELL (DARI KOLEKSI)
  const handleSell = async (tokenId: bigint) => {
    const prc = prompt(`Jual NFT #${tokenId.toString()} seharga (NEX):`);
    if (!prc || !(await validateNetwork())) return;

    writeContract({
      address: NFT_ADDRESS,
      abi: ERC721_ABI,
      functionName: "approve",
      args: [MARKETPLACE_ADDRESS, tokenId],
    });

    alert("Approve dulu di wallet. Tunggu 8 detik baru konfirmasi Listing.");
    setTimeout(() => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "listNFT",
        args: [NFT_ADDRESS, tokenId, parseEther(prc)],
      });
    }, 8000);
  };

  const handleBuy = async (tokenId: bigint, price: bigint) => {
    if (!(await validateNetwork())) return;
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: "buyNFT",
      args: [NFT_ADDRESS, tokenId],
      value: price,
    });
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#050505] text-white p-6">
      <nav className="max-w-7xl mx-auto flex justify-between items-center py-8 mb-12 border-b border-zinc-900">
        <h1 className="text-2xl font-black italic tracking-tighter">0XZVAN<span className="text-emerald-500">.NFT</span></h1>
        {isConnected ? (
          <button onClick={() => disconnect()} className="px-5 py-2 bg-zinc-900 text-[10px] font-mono rounded-xl border border-zinc-800">
            {address?.slice(0,6)}...
          </button>
        ) : (
          <button onClick={() => connect({ connector: injected() })} className="px-6 py-2 bg-white text-black text-[10px] font-black rounded-xl">CONNECT</button>
        )}
      </nav>

      {/* SECTION: KOLEKSI SAYA */}
      {isConnected && (
        <section className="max-w-7xl mx-auto mb-20">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.4em] mb-8">My Collection</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {myNFTs.length > 0 ? (
              myNFTs.map((id) => (
                <div key={id.toString()} className="bg-zinc-900/40 p-3 rounded-3xl border border-zinc-900 group">
                  <img src={`${IPFS_GATEWAY}/${id.toString()}.jpg`} className="rounded-2xl mb-3 aspect-square object-cover" onError={(e) => (e.currentTarget.src="https://via.placeholder.com/150")} />
                  <p className="text-[9px] font-mono text-zinc-600 mb-2 text-center">ID #{id.toString()}</p>
                  <button onClick={() => handleSell(id)} className="w-full py-2 bg-sky-500 text-black text-[9px] font-black rounded-xl hover:bg-sky-400 transition-all">SELL NFT</button>
                </div>
              ))
            ) : (
              <p className="col-span-full text-zinc-800 text-[10px] font-mono italic">Koleksi masih kosong...</p>
            )}
          </div>
        </section>
      )}

      {/* SECTION: MARKETPLACE (YANG DIJUAL) */}
      <section className="max-w-7xl mx-auto">
        <h2 className="text-xs font-mono text-emerald-500 uppercase tracking-[0.4em] mb-8">Live Marketplace</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {listings.length > 0 ? (
            listings.map((item, i) => (
              <div key={i} className="bg-zinc-900/20 border border-zinc-900 p-5 rounded-[2.5rem] hover:border-zinc-700 transition-all">
                <div className="aspect-square bg-zinc-900 rounded-[1.8rem] mb-6 overflow-hidden relative">
                  <img src={`${IPFS_GATEWAY}/${item.tokenId.toString()}.jpg`} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                </div>
                <div className="flex justify-between items-end mb-6 px-2">
                  <div>
                    <p className="text-zinc-600 text-[9px] uppercase font-bold tracking-widest mb-1">Price</p>
                    <p className="text-xl font-black">{formatEther(item.price)} <span className="text-[10px] text-zinc-700">NEX</span></p>
                  </div>
                </div>
                <button onClick={() => handleBuy(item.tokenId, item.price)} className="w-full py-4 bg-white text-black text-[11px] font-black rounded-2xl uppercase tracking-widest hover:bg-zinc-200 transition-all">BUY NOW</button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-900 rounded-[3rem]">
              <p className="text-zinc-700 font-mono text-[10px] uppercase tracking-[0.5em]">No Listings Found</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
