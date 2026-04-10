'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserProvider, Contract, Interface, JsonRpcProvider, formatEther, parseEther } from 'ethers';
import { ERC721_ABI, MARKETPLACE_ABI, MARKETPLACE_ADDRESS, NFT_ADDRESS } from '@/lib/marketplace';

interface Listing {
  seller: string;
  nftAddress: string;
  tokenId: bigint;
  price: bigint;
  blockNumber: bigint;
}

const CHAIN_ID = 3945;
const CHAIN_ID_HEX = `0x${CHAIN_ID.toString(16)}`;
const RPC_URL = 'https://testnet.rpc.nexus.xyz';
const EXPLORER_URL = 'https://testnet.explorer.nexus.xyz';

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function nftArt(tokenId: bigint): string {
  const arts = ['🌌', '⚡', '🔷', '🌀', '✨', '🔮', '🌊', '🔥', '💎', '🛸'];
  return arts[Number(tokenId) % arts.length];
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="font-mono text-base leading-tight font-medium text-white">{value}</p>
      {sub && <p className="mt-1 font-mono text-[10px] text-zinc-600">{sub}</p>}
    </div>
  );
}

function TxBadge({ status, txHash }: { status: string; txHash?: string }) {
  if (!status) return null;

  return (
    <div className="mt-3 flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-300">
      <span>{status}</span>
      {txHash && (
        <a
          href={`${EXPLORER_URL}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-sky-400 hover:underline"
        >
          View tx ↗
        </a>
      )}
    </div>
  );
}

function NFTCard({
  listing,
  connectedAddress,
  onBuy,
  onCancel,
  isBuying,
}: {
  listing: Listing;
  connectedAddress?: string;
  onBuy: (l: Listing) => void;
  onCancel: (l: Listing) => void;
  isBuying: boolean;
}) {
  const isSeller =
    !!connectedAddress && connectedAddress.toLowerCase() === listing.seller.toLowerCase();

  return (
    <div className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-sky-500/50">
      <div className="relative flex aspect-square items-center justify-center bg-zinc-950 text-5xl">
        {nftArt(listing.tokenId)}
        <span className="absolute top-2 right-2 rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
          #{listing.tokenId.toString()}
        </span>
      </div>

      <div className="p-3">
        <div className="mb-1 flex items-start justify-between">
          <p className="text-sm font-medium text-white">Nexus #{listing.tokenId.toString()}</p>
          <p className="font-mono text-sm font-medium text-sky-400">
            {parseFloat(formatEther(listing.price)).toFixed(3)} NEX
          </p>
        </div>
        <p className="mb-3 truncate font-mono text-[10px] text-zinc-600">{shortAddr(listing.seller)}</p>

        {isSeller ? (
          <button
            onClick={() => onCancel(listing)}
            className="w-full rounded border border-zinc-700 py-1.5 font-mono text-xs text-zinc-400 transition-colors hover:border-red-500/60 hover:text-red-400"
          >
            Cancel Listing
          </button>
        ) : (
          <button
            onClick={() => onBuy(listing)}
            disabled={isBuying || !connectedAddress}
            className="w-full rounded border border-sky-500/50 py-1.5 font-mono text-xs text-sky-400 transition-all hover:border-sky-500 hover:bg-sky-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isBuying ? 'Buying…' : connectedAddress ? 'Buy Now' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </div>
  );
}

function ListNFTForm({
  address,
  onActionDone,
}: {
  address?: string;
  onActionDone: () => Promise<void>;
}) {
  const [step, setStep] = useState<'approve' | 'list'>('approve');
  const [nftAddr, setNftAddr] = useState(NFT_ADDRESS);
  const [tokenId, setTokenId] = useState('');
  const [priceEth, setPriceEth] = useState('');
  const [pending, setPending] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [txHash, setTxHash] = useState<string | undefined>(undefined);

  const handleApprove = async () => {
    if (!window.ethereum || !tokenId) return;
    setPending(true);
    setTxHash(undefined);

    try {
      setTxStatus('⏳ Waiting for wallet…');
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const nftContract = new Contract(nftAddr, ERC721_ABI, signer);
      const tx = await nftContract.approve(MARKETPLACE_ADDRESS, BigInt(tokenId));
      setTxHash(tx.hash);

      setTxStatus('🔄 Confirming on-chain…');
      await tx.wait();

      setTxStatus('✅ Approve success. Continue to list.');
      setStep('list');
    } catch (error) {
      console.error(error);
      setTxStatus('❌ Approve failed.');
    } finally {
      setPending(false);
    }
  };

  const handleList = async () => {
    if (!window.ethereum || !tokenId || !priceEth) return;
    setPending(true);
    setTxHash(undefined);

    try {
      setTxStatus('⏳ Waiting for wallet…');
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const marketplace = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      const tx = await marketplace.listNFT(nftAddr, BigInt(tokenId), parseEther(priceEth));
      setTxHash(tx.hash);

      setTxStatus('🔄 Confirming on-chain…');
      await tx.wait();
      setTxStatus('✅ NFT listed successfully!');
      await onActionDone();
    } catch (error) {
      console.error(error);
      setTxStatus('❌ Listing failed.');
    } finally {
      setPending(false);
    }
  };

  const weiPreview = priceEth ? `= ${(parseFloat(priceEth) * 1e18).toLocaleString()} wei` : '= 0 wei';

  return (
    <div className="max-w-md">
      <div className="mb-5 space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Marketplace</span>
          <span className="font-mono text-[10px] text-sky-400">{shortAddr(MARKETPLACE_ADDRESS)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">NFT Contract</span>
          <span className="font-mono text-[10px] text-sky-400">{shortAddr(NFT_ADDRESS)}</span>
        </div>
      </div>

      <div className="mb-5 flex gap-2">
        {(['approve', 'list'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-6 bg-zinc-800" />}
            <div
              className={`flex items-center gap-1.5 rounded border px-3 py-1.5 font-mono text-xs ${
                step === s ? 'border-sky-500/50 bg-sky-500/5 text-sky-400' : 'border-zinc-800 text-zinc-600'
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                  step === s ? 'bg-sky-500 text-white' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {i + 1}
              </span>
              {s === 'approve' ? 'Approve' : 'List NFT'}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            NFT Contract Address
          </label>
          <input
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-sky-500/50"
            value={nftAddr}
            onChange={(e) => setNftAddr(e.target.value)}
            disabled={step === 'list' || pending}
          />
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-zinc-500">Token ID</label>
          <input
            type="number"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-sky-500/50"
            placeholder="0"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            disabled={step === 'list' || pending}
          />
        </div>

        {step === 'list' && (
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Price (NEX)
            </label>
            <input
              type="number"
              step="0.001"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-sky-500/50"
              placeholder="0.1"
              value={priceEth}
              onChange={(e) => setPriceEth(e.target.value)}
              disabled={pending}
            />
            <p className="mt-1.5 font-mono text-[10px] text-zinc-600">{weiPreview}</p>
          </div>
        )}
      </div>

      {step === 'approve' ? (
        <button
          onClick={handleApprove}
          disabled={!address || !tokenId || pending}
          className="mt-5 w-full rounded-lg bg-zinc-800 py-2.5 font-mono text-sm text-white transition-colors hover:bg-zinc-700 disabled:opacity-40"
        >
          {pending ? 'Approving…' : 'Step 1: Approve Marketplace →'}
        </button>
      ) : (
        <button
          onClick={handleList}
          disabled={!address || !priceEth || pending}
          className="mt-5 w-full rounded-lg bg-sky-500 py-2.5 font-mono text-sm text-white transition-colors hover:bg-sky-400 disabled:opacity-40"
        >
          {pending ? 'Listing…' : 'Step 2: List NFT ↗'}
        </button>
      )}

      <TxBadge status={txStatus} txHash={txHash} />
    </div>
  );
}

type Tab = 'browse' | 'list' | 'mine';

export default function MarketplacePage() {
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [correctNetwork, setCorrectNetwork] = useState(false);
  const [tab, setTab] = useState<Tab>('browse');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBuy, setActiveBuy] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState('');
  const [txHash, setTxHash] = useState<string | undefined>(undefined);

  const rpcProvider = useMemo(() => new JsonRpcProvider(RPC_URL), []);

  const refreshWallet = useCallback(async () => {
    if (!window.ethereum) return;

    const browserProvider = new BrowserProvider(window.ethereum);
    const accounts = await browserProvider.listAccounts();
    setAddress(accounts[0]?.address);

    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    setCorrectNetwork(chainIdHex?.toLowerCase() === CHAIN_ID_HEX.toLowerCase());
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return;
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    await refreshWallet();
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_ID_HEX }],
      });
    } catch (error: any) {
      if (error?.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: CHAIN_ID_HEX,
              chainName: 'Nexus Testnet',
              nativeCurrency: { name: 'NEX', symbol: 'NEX', decimals: 18 },
              rpcUrls: [RPC_URL],
              blockExplorerUrls: [EXPLORER_URL],
            },
          ],
        });
      } else {
        throw error;
      }
    }
    await refreshWallet();
  };

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const marketplaceInterface = new Interface(MARKETPLACE_ABI);

      const listedTopic = marketplaceInterface.getEvent('NFTListed')?.topicHash;
      const soldTopic = marketplaceInterface.getEvent('NFTSold')?.topicHash;
      const canceledTopic = marketplaceInterface.getEvent('ListingCanceled')?.topicHash;

      if (!listedTopic || !soldTopic || !canceledTopic) {
        setListings([]);
        setLoading(false);
        return;
      }

      const [listedLogsRaw, soldLogsRaw, canceledLogsRaw] = await Promise.all([
        rpcProvider.getLogs({ address: MARKETPLACE_ADDRESS, fromBlock: 0, toBlock: 'latest', topics: [listedTopic] }),
        rpcProvider.getLogs({ address: MARKETPLACE_ADDRESS, fromBlock: 0, toBlock: 'latest', topics: [soldTopic] }),
        rpcProvider.getLogs({ address: MARKETPLACE_ADDRESS, fromBlock: 0, toBlock: 'latest', topics: [canceledTopic] }),
      ]);

      const inactive = new Set<string>();

      for (const log of [...soldLogsRaw, ...canceledLogsRaw]) {
        const parsed = marketplaceInterface.parseLog(log);
        const nftAddress = String(parsed?.args?.nftAddress ?? '').toLowerCase();
        const tokenId = BigInt(parsed?.args?.tokenId ?? 0n);
        inactive.add(`${nftAddress}-${tokenId.toString()}`);
      }

      const seen = new Set<string>();
      const activeListings: Listing[] = [];

      for (const log of listedLogsRaw.reverse()) {
        const parsed = marketplaceInterface.parseLog(log);
        const seller = String(parsed?.args?.seller ?? '');
        const nftAddress = String(parsed?.args?.nftAddress ?? '');
        const tokenId = BigInt(parsed?.args?.tokenId ?? 0n);
        const price = BigInt(parsed?.args?.price ?? 0n);
        const key = `${nftAddress.toLowerCase()}-${tokenId.toString()}`;

        if (!inactive.has(key) && !seen.has(key)) {
          seen.add(key);
          activeListings.push({
            seller,
            nftAddress,
            tokenId,
            price,
            blockNumber: BigInt(log.blockNumber ?? 0),
          });
        }
      }

      setListings(activeListings);
    } catch (error) {
      console.error('fetchListings error:', error);
    } finally {
      setLoading(false);
    }
  }, [rpcProvider]);

  useEffect(() => {
    fetchListings();
    if (!window.ethereum) return;

    refreshWallet();
    window.ethereum.on('accountsChanged', refreshWallet);
    window.ethereum.on('chainChanged', refreshWallet);

    return () => {
      if (!window.ethereum) return;
      window.ethereum.removeListener('accountsChanged', refreshWallet);
      window.ethereum.removeListener('chainChanged', refreshWallet);
    };
  }, [fetchListings, refreshWallet]);

  const handleBuy = async (listing: Listing) => {
    if (!window.ethereum || !address || !correctNetwork) return;

    const key = `${listing.nftAddress}-${listing.tokenId.toString()}`;
    setActiveBuy(key);
    setTxHash(undefined);

    try {
      setTxStatus('⏳ Waiting for wallet…');
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const marketplace = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      const tx = await marketplace.buyNFT(listing.nftAddress, listing.tokenId, { value: listing.price });
      setTxHash(tx.hash);

      setTxStatus('🔄 Confirming on-chain…');
      await tx.wait();
      setTxStatus('✅ Buy success!');
      await fetchListings();
    } catch (error) {
      console.error(error);
      setTxStatus('❌ Buy failed.');
    } finally {
      setActiveBuy(null);
    }
  };

  const handleCancel = async (listing: Listing) => {
    if (!window.ethereum || !address || !correctNetwork) return;

    setTxHash(undefined);

    try {
      setTxStatus('⏳ Waiting for wallet…');
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const marketplace = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      const tx = await marketplace.cancelListing(listing.nftAddress, listing.tokenId);
      setTxHash(tx.hash);

      setTxStatus('🔄 Confirming on-chain…');
      await tx.wait();
      setTxStatus('✅ Listing canceled.');
      await fetchListings();
    } catch (error) {
      console.error(error);
      setTxStatus('❌ Cancel failed.');
    }
  };

  const myListings = address
    ? listings.filter((l) => l.seller.toLowerCase() === address.toLowerCase())
    : [];

  const tabData: Record<Tab, Listing[]> = {
    browse: listings,
    list: [],
    mine: myListings,
  };

  const tabs = [
    { id: 'browse' as Tab, label: 'Browse', count: listings.length },
    { id: 'list' as Tab, label: 'List NFT' },
    { id: 'mine' as Tab, label: 'My Listings', count: myListings.length },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-900 pb-5">
          <div>
            <h1 className="font-mono text-xl font-medium tracking-tight">
              NEXUS<span className="text-sky-400">.</span>MKT
            </h1>
            <p className="mt-0.5 font-mono text-[11px] text-zinc-600">Nexus Testnet • Chain ID {CHAIN_ID}</p>
          </div>
          <div className="flex items-center gap-2">
            {!address ? (
              <button
                onClick={connectWallet}
                className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-[11px] text-zinc-300 hover:border-sky-500/50"
              >
                Connect Wallet
              </button>
            ) : !correctNetwork ? (
              <button
                onClick={switchNetwork}
                className="rounded border border-amber-500/50 bg-zinc-900 px-3 py-1.5 font-mono text-[11px] text-amber-300 hover:border-amber-400"
              >
                Switch to Nexus
              </button>
            ) : (
              <span className="rounded border border-emerald-500/30 bg-zinc-900 px-3 py-1.5 font-mono text-[11px] text-emerald-400">
                ● {shortAddr(address)}
              </span>
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <StatCard label="Active Listings" value={listings.length.toString()} sub="on Nexus Testnet" />
          <StatCard label="Platform Fee" value="2.5%" sub="basis points: 250" />
          <StatCard label="Seller Proceeds" value="97.5%" sub="per sale" />
          <StatCard
            label="Your Listings"
            value={myListings.length.toString()}
            sub={address ? 'active' : 'connect wallet'}
          />
        </div>

        <div className="mb-6 w-fit rounded-lg border border-zinc-900 bg-zinc-950 p-1">
          <div className="flex gap-1">
            {tabs.map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 rounded-md px-4 py-2 font-mono text-xs transition-all ${
                  tab === id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {label}
                {count !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      tab === id ? 'bg-sky-500/20 text-sky-400' : 'bg-zinc-800 text-zinc-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {tab === 'list' && <ListNFTForm address={address} onActionDone={fetchListings} />}

        {tab !== 'list' && (
          <>
            {loading ? (
              <div className="py-12 text-center font-mono text-xs text-zinc-600">Fetching listings from chain…</div>
            ) : tabData[tab].length === 0 ? (
              <div className="rounded-xl border border-zinc-900 py-12 text-center font-mono text-xs text-zinc-600">
                {tab === 'mine'
                  ? address
                    ? 'No active listings. List an NFT to get started.'
                    : 'Connect your wallet to see your listings.'
                  : 'No NFTs listed yet. Be the first!'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {tabData[tab].map((listing) => {
                  const key = `${listing.nftAddress}-${listing.tokenId.toString()}`;
                  return (
                    <NFTCard
                      key={key}
                      listing={listing}
                      connectedAddress={address}
                      onBuy={handleBuy}
                      onCancel={handleCancel}
                      isBuying={activeBuy === key}
                    />
                  );
                })}
              </div>
            )}

            <button
              onClick={fetchListings}
              disabled={loading}
              className="mt-6 rounded-lg border border-zinc-900 px-4 py-2 font-mono text-xs text-zinc-600 transition-colors hover:border-zinc-700 hover:text-zinc-400 disabled:opacity-40"
            >
              ↻ Refresh listings
            </button>
          </>
        )}

        <TxBadge status={txStatus} txHash={txHash} />
      </div>
    </main>
  );
}
