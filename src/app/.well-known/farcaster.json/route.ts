import { NextResponse } from "next/server";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://0xzvan-nft.vercel.app";

export async function GET() {
  return NextResponse.json({
    miniapp: {
      version: "1",
      name: "0xzvan.nft",
      homeUrl: BASE_URL,
      iconUrl: `${BASE_URL}/app-logo.png`,
      splashImageUrl: `${BASE_URL}/app-splash.png`,
      splashBackgroundColor: "#000000",
      subtitle: "NFT on Nexus Testnet",
      description: "Mint, buy, and sell NFTs on the Nexus Testnet blockchain. A decentralized NFT marketplace powered by Farcaster.",
      primaryCategory: "defi",
      tags: ["nft", "nexus", "marketplace", "mint", "web3"],
      heroImageUrl: `${BASE_URL}/app-hero.png`,
      tagline: "Mint & Trade on Nexus",
      ogTitle: "0xzvan.nft",
      ogDescription: "NFT Marketplace on Nexus Testnet",
      ogImageUrl: `${BASE_URL}/app-hero.png`,
      canonicalDomain: "0xzvan-nft.vercel.app",
      requiredChains: ["eip155:3945"],
    },
  });
}
