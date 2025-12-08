import { createClient } from "redis";

const redis = createClient({
  url: process.env.STORAGE_REDIS_URL,
});

if (!redis.isOpen) {
  await redis.connect();
}

export async function getSpotifyAccessToken() {
  const cachedToken = await redis.get("spotify_token");

  if (cachedToken) {
    return cachedToken;
  }

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

  const token = data.access_token;
  const expiresInMs = data.expires_in * 1000;

  // Store token with auto-expiry
  await redis.set("spotify_token", token, {
    PX: expiresInMs,
  });

  return token;
}
