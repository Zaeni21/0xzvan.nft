import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Definisikan Network Nexus secara manual
const nexusTestnet = {
  id: 3945,
  name: 'Nexus Testnet',
  nativeCurrency: { name: 'Nexus', symbol: 'NEX', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.rpc.nexus.xyz'] },
  },
  blockExplorers: {
    default: { name: 'NexusScan', url: 'https://testnet.explorer.nexus.xyz' },
  },
} as const

export const config = createConfig({
  chains: [nexusTestnet], // HAPUS mainnet dari sini agar ETH tidak muncul
  connectors: [injected()],
  transports: {
    [nexusTestnet.id]: http(),
  },
})
