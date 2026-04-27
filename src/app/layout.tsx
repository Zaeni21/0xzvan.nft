import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "0xzvan.nft | Nexus Marketplace",
  description: "NFT Marketplace on Nexus Testnet",
  metadataBase: new URL("https://0xzvan-nft.vercel.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Meta tag khusus Base Mini App - ini yang kamu minta */}
        <meta name="base:app_id" content="69ef7cb87bbc513a443f26fe" />
      </head>
      <body className="antialiased bg-black text-white font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
