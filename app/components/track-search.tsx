"use client";

import { useState } from "react";
import Image from "next/image";

export default function TrackSearch() {
  const [input, setInput] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: input }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="text-sm font-[family-name:var(--font-geist-mono)]">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Track URL or ID"
        className="p-2 border border-gray-300 rounded"
      />
      <button
        type="submit"
        className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Search
      </button>

      {loading && <p>Loading...</p>}

      {result && !result.error && (
        <div className="mt-4">
          <h2>{result.name}</h2>
          <p>{result.artists.map((a: Artist) => a.name).join(", ")}</p>
          <Image
            src={
              result.type === "track"
                ? result.album.images[0].url
                : result.images[0].url
            }
            alt="cover art"
            height={200}
            width={200}
          />
        </div>
      )}

      {result?.error && <p className="text-red-500">Error: {result.error}</p>}
    </form>
  );
}
