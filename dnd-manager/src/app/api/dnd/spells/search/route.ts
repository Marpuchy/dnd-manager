import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://www.dnd5eapi.co/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${BASE_URL}/spells?name=${encodeURIComponent(name)}`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ results: [] });
  }
}
