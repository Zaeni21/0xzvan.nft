'use client'

import { useAccount, useConnect, useConnectors, useDisconnect } from 'wagmi'

export function ConnectWallet() {
  const { address, status } = useAccount()
  const { mutate: connect } = useConnect()
  const { mutate: disconnect } = useDisconnect()
  const connectors = useConnectors()

  const injected = connectors.find((c) => c.type === 'injected')

  switch (status) {
    case 'reconnecting':
      return (
        <span className="px-4 py-2 text-sm text-gray-400 border border-gray-700 rounded-xl">
          Reconnecting...
        </span>
      )

    case 'connecting':
      return (
        <button
          disabled
          className="px-5 py-2.5 bg-blue-700 text-white font-semibold rounded-xl text-sm opacity-50"
        >
          Connecting...
        </button>
      )

    case 'connected':
      return (
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm bg-gray-800 px-3 py-1.5 rounded-lg text-gray-300">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <button
            onClick={() => disconnect()}
            className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-2"
          >
            Disconnect
          </button>
        </div>
      )

    case 'disconnected':
      if (!injected) return null
      return (
        <button
          onClick={() => connect({ connector: injected })}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Connect Wallet
        </button>
      )
  }
}
