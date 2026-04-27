"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  address: string;
  notificationsEnabled: boolean;
}

interface SendResult {
  walletAddress: string;
  sent: boolean;
  failureReason?: string;
}

interface SendResponse {
  success: boolean;
  results: SendResult[];
  sentCount: number;
  failedCount: number;
}

export default function NotificationsPage() {
  // ── Users state ──────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // ── Send state ────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetPath, setTargetPath] = useState("/");
  const [sendToAll, setSendToAll] = useState(true);
  const [customAddresses, setCustomAddresses] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResponse | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // ── Fetch opted-in users ──────────────────────────────────────
  const fetchUsers = useCallback(async (cursor?: string) => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const params = new URLSearchParams({ notification_enabled: "true", limit: "100" });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/notifications/users?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch users");
      setUsers((prev) => (cursor ? [...prev, ...data.users] : data.users));
      setNextCursor(data.nextCursor ?? null);
    } catch (e: unknown) {
      setUsersError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Send notification ─────────────────────────────────────────
  const handleSend = async () => {
    setSending(true);
    setSendResult(null);
    setSendError(null);

    const wallet_addresses = sendToAll
      ? users.map((u) => u.address)
      : customAddresses
          .split(/[\n,]+/)
          .map((a) => a.trim())
          .filter(Boolean);

    if (wallet_addresses.length === 0) {
      setSendError("No wallet addresses to send to.");
      setSending(false);
      return;
    }

    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_addresses, title, message, target_path: targetPath || "/" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setSendResult(data);
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSending(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 font-mono">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-blue-400">🔔 Base Notifications</h1>
          <p className="text-gray-400 text-sm mt-1">
            Send in-app notifications to users who opted in via the Base App.
          </p>
        </div>

        {/* Users panel */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-200">Opted-in Users</h2>
            <button
              onClick={() => { setUsers([]); fetchUsers(); }}
              className="text-xs text-blue-400 hover:underline"
            >
              Refresh
            </button>
          </div>

          {loadingUsers && <p className="text-sm text-gray-500">Loading…</p>}
          {usersError && <p className="text-sm text-red-400">{usersError}</p>}

          {!loadingUsers && users.length === 0 && !usersError && (
            <p className="text-sm text-gray-500">No opted-in users found.</p>
          )}

          {users.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {users.map((u) => (
                <div key={u.address} className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="truncate font-mono">{u.address}</span>
                </div>
              ))}
            </div>
          )}

          {nextCursor && (
            <button
              onClick={() => fetchUsers(nextCursor)}
              disabled={loadingUsers}
              className="text-xs text-blue-400 hover:underline"
            >
              Load more
            </button>
          )}

          <p className="text-xs text-gray-600">{users.length} user(s) loaded</p>
        </section>

        {/* Send panel */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-200">Send Notification</h2>

          {/* Title */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Title <span className="text-gray-600">({title.length}/30)</span>
            </label>
            <input
              type="text"
              maxLength={30}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New NFT minted! 🎉"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Message <span className="text-gray-600">({message.length}/200)</span>
            </label>
            <textarea
              maxLength={200}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your 0xzvan NFT has been minted on Nexus Testnet."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Target path */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Target Path</label>
            <input
              type="text"
              value={targetPath}
              onChange={(e) => setTargetPath(e.target.value)}
              placeholder="/mint"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Recipients */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Recipients</label>
            <div className="flex gap-3 mb-2">
              <button
                onClick={() => setSendToAll(true)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  sendToAll
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-700 text-gray-400 hover:border-gray-500"
                }`}
              >
                All opted-in ({users.length})
              </button>
              <button
                onClick={() => setSendToAll(false)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  !sendToAll
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-700 text-gray-400 hover:border-gray-500"
                }`}
              >
                Custom addresses
              </button>
            </div>

            {!sendToAll && (
              <textarea
                rows={3}
                value={customAddresses}
                onChange={(e) => setCustomAddresses(e.target.value)}
                placeholder="0xABC..., 0xDEF... (comma or newline separated)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
              />
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || !title || !message}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-sm font-semibold transition-colors"
          >
            {sending ? "Sending…" : "Send Notification"}
          </button>

          {/* Result */}
          {sendError && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300">
              {sendError}
            </div>
          )}

          {sendResult && (
            <div className="bg-green-950 border border-green-800 rounded-lg p-3 space-y-1">
              <p className="text-sm font-semibold text-green-400">
                ✅ Sent {sendResult.sentCount} · ❌ Failed {sendResult.failedCount}
              </p>
              {sendResult.results
                .filter((r) => !r.sent)
                .map((r) => (
                  <p key={r.walletAddress} className="text-xs text-red-400">
                    {r.walletAddress}: {r.failureReason}
                  </p>
                ))}
            </div>
          )}
        </section>

        {/* Docs link */}
        <p className="text-xs text-gray-600 text-center">
          Powered by{" "}
          <a
            href="https://docs.base.org/apps/technical-guides/base-notifications"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Base Notifications API
          </a>
        </p>
      </div>
    </main>
  );
}
