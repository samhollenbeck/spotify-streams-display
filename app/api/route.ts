// app/api/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSpotifyAccessToken } from "@/lib/spotify";

function extractId(input: string, type: "track" | "album"): string | null {
  input = input.trim();

  // Spotify IDs are always 22 alphanumeric chars
  if (/^[a-zA-Z0-9]{22}$/.test(input)) return input;

  // Match URLs like https://open.spotify.com/{type}/{id}
  const urlRegex = new RegExp(`${type}\/([a-zA-Z0-9]{22})`);
  const urlMatch = input.match(urlRegex);
  if (urlMatch) return urlMatch[1];

  // Match URIs like spotify:{type}:{id}
  const uriRegex = new RegExp(`spotify:${type}:([a-zA-Z0-9]{22})`);
  const uriMatch = input.match(uriRegex);
  if (uriMatch) return uriMatch[1];

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { id: input } = await req.json();
    const type = "track";
    const trackId = extractId(input, type);
    if (!trackId)
      return NextResponse.json(
        { error: "Invalid Spotify track ID" },
        { status: 400 },
      );

    const token = await getSpotifyAccessToken();
    const res = await fetch(`https://api.spotify.com/v1/${type}s/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    // console.log(data);
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
