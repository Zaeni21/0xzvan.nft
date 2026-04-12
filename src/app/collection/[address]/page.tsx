'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  usePublicClient,
  useSwitchChain
} from 'wagmi'
import { getAddress, parseAbiItem } from 'viem'
import { Navbar } from '../../components/Navbar'
import { NFTCard } from '../../components/NFTCard'
import { ExplorerLink } from '../../components/ExplorerLink'

// ABI Minimalis biar gak berat
const ABI = [
  "function name() view returns (string)",
  "function owner() view returns (address)",
  "function totalSupply() view returns (uint256)",
  "function tokenURI(uint256) view returns (string)",
  "function mint() public returns (uint256)",
  "function transferFrom(address from, address to, uint256 tokenId) public"
] as const;

export default function Collection({ params: paramsPromise }: { params: Promise<{ address: string }> }) {
  const { address: contractAddress } = use(paramsPromise)
  const router = useRouter()
  const { address: userAddress, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const publicClient = usePublicClient()

  const [status, setStatus] = useState({ type: 'info', message: '', tx: '' })
  const [ownedNFTs, setOwnedNFTs] = useState<any[]>([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)

  // 1. Ambil Data Kontrak (Name & Owner)
  const { data: collectionName } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ABI,
    functionName: 'name',
  })

  const { data: contractOwner } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ABI,
    functionName: 'owner',
  })

  const isOwner = userAddress && contractOwner && getAddress(userAddress) === getAddress(contractOwner)

  // 2. Fungsi Mint (Paket Wagmi)
  const { writeContract: mint, data: mintHash, isPending: isMinting } = useWriteContract()
  const { isLoading: isWaitingMint, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({ hash: mintHash })

  // 3. Fetch NFTs (Pake PublicClient Viem)
  const fetchNFTs = async () => {
    if (!publicClient || !contractAddress) return
    setIsLoadingNFTs(true)
    try {
      const totalSupply = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: ABI,
        functionName: 'totalSupply',
      }) as bigint

      const nfts = []
      for (let i = 1; i <= Number(totalSupply); i++) {
        try {
          const tokenURI = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: ABI,
            functionName: 'tokenURI',
            args: [BigInt(i)]
          }) as string
          
          // Ganti ke Dedicated Gateway Pinata lu biar kenceng
          const gatewayUrl = tokenURI.replace("ipfs://", "https://scarlet-absent-fox-734.mypinata.cloud/ipfs/")
          const res = await fetch(gatewayUrl)
          const metadata = await res.json()
          nfts.push({ tokenId: i.toString(), metadata })
        } catch (e) {
          nfts.push({ tokenId: i.toString(), metadata: null })
        }
      }
      setOwnedNFTs(nfts)
    } finally {
      setIsLoadingNFTs(false)
    }
  }

  useEffect(() => { fetchNFTs() }, [contractAddress, isMintSuccess])

  const handleMint = () => {
    mint({
      address: contractAddress as `0x${string}`,
      abi: ABI,
      functionName: 'mint',
    })
  }

  return (
    <main className="min-h-screen bg-white pt-14">
      <Navbar 
        title="Nexus NFT" 
        isConnected={isConnected} 
        userAddress={userAddress} 
        onSwitchNetwork={() => switchChain({ chainId: 292 })} // Ganti ID Chain Nexus lu
      />

      <div className="bg-gray-50 border-b border-gray-100 p-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{String(collectionName || 'Loading...')}</h1>
            <ExplorerLink type="address" value={contractAddress} />
          </div>

          {isOwner && (
            <button 
              onClick={handleMint}
              disabled={isMinting || isWaitingMint}
              className="bg-black text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {isMinting || isWaitingMint ? 'Processing...' : 'Mint NFT'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {isLoadingNFTs ? (
          <p>Loading collection...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {ownedNFTs.map(nft => (
              <NFTCard key={nft.tokenId} tokenId={nft.tokenId} metadata={nft.metadata} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
