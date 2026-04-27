# Base Notifications — Integration Guide

This patch adds **Base Notifications** support to `0xzvan.nft`.  
Users who pin your app in the Base App and opt in to notifications can receive
in-app push messages you send from the admin panel.

---

## New files

```
src/
  app/
    api/
      notifications/
        users/route.ts   ← GET opted-in user list from Base Dashboard API
        send/route.ts    ← POST notification to one or more wallet addresses
    notifications/
      page.tsx           ← Admin UI at /notifications
```

---

## Setup (3 steps)

### 1. Register your app on Base Dashboard
Go to [dashboard.base.org](https://dashboard.base.org), create a project, and
add your deployed app URL.

### 2. Enable notifications
In your project settings, toggle **Notifications** on.
Copy your **API Key** from **Settings → API Key**.

### 3. Add environment variables
Copy `.env.example` and fill in:

```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
BASE_API_KEY=your_base_api_key_here
```

> `BASE_API_KEY` is server-only and never exposed to the browser.

---

## Usage

Navigate to `/notifications` in your app to:
- View all users who opted in to notifications
- Send a notification (title ≤ 30 chars, message ≤ 200 chars) to all or specific addresses
- Set a deep-link `target_path` so tapping the notification opens the right page

---

## API rate limits

Both proxy routes forward requests to the Base Dashboard API which enforces
**10 requests/minute per IP**. For large audiences (>1000 addresses) the send
route will need to be batched — the current implementation sends up to 1000
addresses per request automatically.

---

## References
- [Base Notifications Technical Guide](https://docs.base.org/apps/technical-guides/base-notifications)
- [Base Dashboard](https://dashboard.base.org)
