import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "0xzvan.nft | Nexus Marketplace",
  description: "NFT Marketplace on Nexus Testnet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
