import { NextRequest, NextResponse } from "next/server";

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY ?? "";
const OPENSEA_BASE = "https://api.opensea.io/api/v2";

export async function GET(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
  const { route } = await params;
  const path = route.join("/");
  const search = req.nextUrl.search;
  const url = `${OPENSEA_BASE}/${path}${search}`;

  try {
    const res = await fetch(url, {
      headers: { "x-api-key": OPENSEA_API_KEY, accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json({ error: "OpenSea fetch failed" }, { status: res.status });
    return NextResponse.json(await res.json(), {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ error: "OpenSea request failed" }, { status: 500 });
  }
}
