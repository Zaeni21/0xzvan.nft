import { NextRequest, NextResponse } from "next/server";

const BASE_SEND_URL = "https://dashboard.base.org/api/v1/notifications/send";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const API_KEY = process.env.BASE_API_KEY!;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { wallet_addresses, title, message, target_path } = body;

  if (!wallet_addresses || !title || !message) {
    return NextResponse.json(
      { error: "wallet_addresses, title, and message are required" },
      { status: 400 }
    );
  }

  if (title.length > 30) {
    return NextResponse.json(
      { error: "title must be 30 characters or fewer" },
      { status: 400 }
    );
  }

  if (message.length > 200) {
    return NextResponse.json(
      { error: "message must be 200 characters or fewer" },
      { status: 400 }
    );
  }

  const payload: Record<string, unknown> = {
    app_url: APP_URL,
    wallet_addresses,
    title,
    message,
  };

  if (target_path) {
    payload.target_path = target_path;
  }

  const res = await fetch(BASE_SEND_URL, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}
