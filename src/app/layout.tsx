import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "0xzvan.nft | Nexus Marketplace",
  description: "NFT Marketplace on Nexus Testnet",
  metadataBase: new URL("https://0xzvan-nft.vercel.app"),

  // ← Ini yang penting untuk Base Mini App verification
  other: {
    "base:app_id": "69ef7cb87bbc513a443f26fe",
  },

  // Biar lebih bagus di share / Base App
  openGraph: {
    title: "0xzvan.nft | Nexus Marketplace",
    description: "NFT Marketplace on Nexus Testnet",
    images: [
      {
        url: "/og-image.png",        // kalau belum ada, buat dulu atau hapus sementara
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-black text-white font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
