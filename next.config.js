/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Allow SVG images + data: URIs via Next.js
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  // Fix: allow data: URIs for <img> tags (BAYC uses data:image/svg+xml;base64,)
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
