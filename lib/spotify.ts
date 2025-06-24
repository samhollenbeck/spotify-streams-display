import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function getSpotifyAccessToken() {
  const now = Date.now();
  const token = await redis.get<string>("spotify_token");
  const expiresAt = await redis.get<number>("spotify_token_expires");

  if (!token || !expiresAt || now >= expiresAt) {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Missing Spotify credentials in env");
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Spotify token fetch failed: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const newToken = data.access_token;
    const newExpiry = now + data.expires_in * 1000;

    await redis.set("spotify_token", newToken);
    await redis.set("spotify_token_expires", newExpiry);

    return newToken;
  }

  return token;
}
