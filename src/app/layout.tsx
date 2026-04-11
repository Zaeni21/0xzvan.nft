import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "0xzvan.nft | Nexus Marketplace",
  description: "NFT Marketplace on Nexus Testnet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-black text-white font-sans">
        {children}
      </body>
    </html>
  );
}
