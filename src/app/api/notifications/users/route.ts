import { NextRequest, NextResponse } from "next/server";

const BASE_API_URL = "https://dashboard.base.org/api/v1/notifications/app/users";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const API_KEY = process.env.BASE_API_KEY!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const notificationEnabled = searchParams.get("notification_enabled") ?? "true";
  const cursor = searchParams.get("cursor") ?? "";
  const limit = searchParams.get("limit") ?? "100";

  const params = new URLSearchParams({
    app_url: APP_URL,
    notification_enabled: notificationEnabled,
    limit,
    ...(cursor ? { cursor } : {}),
  });

  const res = await fetch(`${BASE_API_URL}?${params}`, {
    headers: { "x-api-key": API_KEY },
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}
