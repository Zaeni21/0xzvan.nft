import { http, createConfig, createStorage, cookieStorage } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

const nexusTestnet = {
  id: 3945,
  name: 'Nexus Testnet',
  nativeCurrency: { name: 'Nexus', symbol: 'NEX', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet.rpc.nexus.xyz'] } },
  blockExplorers: { default: { name: 'NexusScan', url: 'https://testnet.explorer.nexus.xyz' } },
} as const

export const config = createConfig({
  chains: [base, baseSepolia, nexusTestnet],
  connectors: [injected()],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http('https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [nexusTestnet.id]: http('https://testnet.rpc.nexus.xyz'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
