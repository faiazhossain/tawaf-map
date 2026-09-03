import { NextResponse } from "next/server";

const BARIKOI_STYLE_URL = "https://map.barikoi.com/styles/osm_barikoi_pl/style.json";

export async function GET() {
  const key = process.env.NEXT_PUBLIC_BARIKOI_API_KEY;

  if (!key) {
    return NextResponse.json(
      {
        error:
          "NEXT_PUBLIC_BARIKOI_API_KEY is not configured for the client-side Barikoi style proxy.",
      },
      { status: 500 }
    );
  }

  try {
    const upstream = await fetch(`${BARIKOI_STYLE_URL}?key=${key}`, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: `Barikoi style request failed: ${upstream.status}`,
          detail: text.slice(0, 500),
        },
        { status: 502 }
      );
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Barikoi style proxy failed.",
        detail: error instanceof Error ? error.message : "unknown error",
      },
      { status: 502 }
    );
  }
}
