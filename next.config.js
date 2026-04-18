/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Farcaster MiniApp: expose app URL to client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "https://0xzvan-nft.vercel.app",
  },

  // Allow dev origins for Farcaster debugging
  allowedDevOrigins: ["*.ngrok.app", "*.neynar.com", "*.neynar.app"],

  // SVG + all remote image hosts
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  // CSP: allow data: URIs for BAYC SVG images
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src * data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https: wss:",
              "frame-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Fix: wagmi/viem Node.js modules in browser bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ws: false, net: false, tls: false, fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
