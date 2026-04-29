import { ConnectWallet } from '@/components/ConnectWallet'
import { NotificationButton } from '@/components/NotificationButton'

const BASE_BLUE = '#0052ff'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">0xzvan.nft</span>
          <ConnectWallet />
        </div>
      </nav>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        {/* Hero */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight leading-tight mb-2">
            Notifications API
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Send in-app notifications to users who have pinned your app and opted in. Two
            endpoints — fetch your audience, then send targeted or broadcast messages.
          </p>
        </section>

        {/* Audience endpoint card */}
        <section className="mb-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
            <div className="bg-gray-800 rounded-lg px-3 py-2 mb-5 font-mono text-sm text-green-400">
              GET /v1/notifications/app/users
            </div>
            <h2 className="text-lg font-bold mb-1">Fetch your audience</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Retrieve wallet addresses of users who have pinned your app and enabled notifications.
            </p>
          </div>
        </section>

        {/* Send endpoint card */}
        <section className="mb-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
            <div className="bg-gray-800 rounded-lg px-3 py-2 mb-5 font-mono text-sm text-green-400">
              POST /v1/notifications/send
            </div>
            <h2 className="text-lg font-bold mb-1">Send notifications</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Post a list of wallet addresses and a message body to deliver targeted or broadcast
              notifications inside the Base app.
            </p>
          </div>
        </section>

        {/* Try it live */}
        <section className="mb-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-bold mb-1">Try it live</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Send a notification to your connected wallet. You must have the app pinned
              in Base with notifications enabled.
            </p>
            <NotificationButton />
          </div>
        </section>

        {/* Code example */}
        <section className="mb-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="text-lg font-bold mb-1">Quick example</h2>
              <p className="text-gray-400 text-sm">Send a notification in a single fetch call.</p>
            </div>
            <pre className="bg-gray-950 text-gray-100 px-5 py-5 text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{`const response = await fetch(
  'https://dashboard.base.org/api/v1/notifications/send',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.BASE_API_KEY,
    },
    body: JSON.stringify({
      app_url: '<your-app-url>',
      wallet_addresses: ['0xA11ce...'],
      title: 'Your transaction confirmed',
      message: 'Block #19842301 - view on Basescan',
      target_path: '/transactions',
    }),
  }
)

const { success, sentCount, failedCount } = await response.json()`}</code>
            </pre>
          </div>
        </section>

        {/* Key capabilities */}
        <section className="mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-bold mb-5">Key capabilities</h2>
            <div className="flex flex-col gap-5">
              {[
                {
                  title: 'Opt-in only',
                  body: 'Only users who explicitly pin your app and enable notifications receive messages — no spam, full consent.',
                },
                {
                  title: 'Targeted or broadcast',
                  body: 'Send to a single wallet for personalized alerts, or broadcast to your entire opted-in audience.',
                },
                {
                  title: 'REST API',
                  body: 'Standard HTTP endpoints — integrate from any backend language or framework with a single POST.',
                },
              ].map(({ title, body }, i) => (
                <div key={title} className="flex gap-4 items-start">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: BASE_BLUE }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-0.5">{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-8">
          <div
            className="rounded-2xl px-6 py-8 text-center"
            style={{ backgroundColor: BASE_BLUE }}
          >
            <h2 className="text-white font-bold text-xl mb-2">Ready to build?</h2>
            <p className="text-blue-200 text-sm mb-6">
              Connect your wallet and start integrating the Notifications API today.
            </p>
            <a
              href="https://docs.base.org/apps/technical-guides/base-notifications"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
              style={{ color: BASE_BLUE }}
            >
              Read the docs
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7h10M7 2l5 5-5 5"
                  stroke={BASE_BLUE}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-5">
        <div className="max-w-lg mx-auto flex items-center justify-between text-xs text-gray-500">
          <span>0xzvan.nft — Built on Base</span>
          <span>Powered by wagmi + viem</span>
        </div>
      </footer>
    </div>
  )
}
