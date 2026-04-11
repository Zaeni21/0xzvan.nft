import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers"; // Kita akan buat file ini

export const metadata: Metadata = {
  title: "0xzvan.nft | Nexus Marketplace",
  description: "NFT Marketplace on Nexus Testnet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-black text-white font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
