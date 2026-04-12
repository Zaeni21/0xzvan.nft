# 0xzvan.nft

> NFT minting & marketplace dApp built on **Nexus Testnet**

🌐 **Live** → [0xzvan-nft.vercel.app](https://0xzvan-nft.vercel.app)

---

## Features

- 🎨 **Mint NFT** — upload image, fill metadata, store permanently on IPFS via Pinata
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

### 2. Setup Environment Variables

Buat file `.env.local` di root project:

```env
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY=your_gateway.mypinata.cloud
NEXT_PUBLIC_PINATA_GATEWAY=your_gateway.mypinata.cloud
```

> Dapatkan Pinata JWT & Gateway di [app.pinata.cloud](https://app.pinata.cloud)

### 3. Run Development Server

```bash
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Pages

| Route | Deskripsi |
|---|---|
| `/` | Landing page |
| `/create` | Mint NFT baru |
| `/marketplace` | Lihat & beli listing NFT |
| `/collection/[address]` | Detail koleksi per contract |

---

## How It Works

### Minting
1. Upload gambar → Pinata IPFS
2. Generate metadata JSON → Pinata IPFS
3. Call `mint(tokenURI)` di contract ERC-721
4. Token tersimpan on-chain dengan `ipfs://` URI

### Marketplace
1. Approve contract → `setApprovalForAll(marketplace, true)`
2. List NFT → `listNFT(nftAddress, tokenId, price)`
3. Buy NFT → `buyNFT(nftAddress, tokenId)` + kirim NEX
4. Cancel → `cancelListing(nftAddress, tokenId)`

---

## Deploy to Vercel

```bash
vercel deploy
```

Set env vars di Vercel Dashboard → Settings → Environment Variables:

```
PINATA_JWT
PINATA_GATEWAY
NEXT_PUBLIC_PINATA_GATEWAY
```

---

Built by [0xzvan](https://github.com/Zaeni21) • Nexus Testnet
