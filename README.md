# 0xzvan.nft

> NFT minting & marketplace dApp built on **Nexus Testnet**

🌐 **Live** → [0xzvan-nft.vercel.app](https://0xzvan-nft.vercel.app)

---

## Features

- 🎨 **Mint NFT** — upload an image, fill in metadata, and store it permanently on IPFS via Pinata
- 🛒 **Marketplace** — list, buy, and cancel NFT listings on-chain
- 🔗 **Nexus Testnet** — Chain ID 3945, native currency NEX
- 👛 **Wallet** — connect via MetaMask / injected wallet (wagmi v2)
- 📦 **On-chain metadata** — tokenURI stored on contract, image & metadata on IPFS

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Web3 | wagmi v2 + viem |
| Storage | Pinata (IPFS) |
| Styling | Tailwind CSS |
| Deploy | Vercel |

---

## Contract Addresses (Nexus Testnet)

| Contract | Address |
|---|---|
| NFT (ERC-721) | `0x2311751bb8cFCD111ED1Bf7FEFAf3fbe79e98c89` |
| Marketplace | `0x5645cC460DFa9CE4Dea89DC9df331C0C1721FDFf` |

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Zaeni21/0xzvan.nft.git
cd 0xzvan.nft
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY=your_gateway.mypinata.cloud
NEXT_PUBLIC_PINATA_GATEWAY=your_gateway.mypinata.cloud
```

> Get your Pinata JWT & Gateway at [app.pinata.cloud](https://app.pinata.cloud)

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/create` | Mint a new NFT |
| `/marketplace` | Browse & buy listed NFTs |
| `/collection/[address]` | View collection by contract address |

---

## How It Works

### Minting
1. Upload image → stored on Pinata IPFS
2. Generate metadata JSON → stored on Pinata IPFS
3. Call `mint(tokenURI)` on the ERC-721 contract
4. Token is stored on-chain with an `ipfs://` URI

### Marketplace
1. Approve contract → `setApprovalForAll(marketplace, true)`
2. List NFT → `listNFT(nftAddress, tokenId, price)`
3. Buy NFT → `buyNFT(nftAddress, tokenId)` + send NEX
4. Cancel listing → `cancelListing(nftAddress, tokenId)`

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Zaeni21/0xzvan.nft)

Set the following environment variables in your Vercel Dashboard → Settings → Environment Variables:

```
PINATA_JWT
PINATA_GATEWAY
NEXT_PUBLIC_PINATA_GATEWAY
```

---

Built by [0xzvan](https://github.com/Zaeni21) • Nexus Testnet
