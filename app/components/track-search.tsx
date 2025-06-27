"use client";

import { useState, useEffect, useRef } from "react";
import "@fontsource/dm-sans/400.css"; // normal
import "@fontsource/dm-sans/700.css"; // bold

export default function TrackSearch() {
  const [input, setInput] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    if (!result || result.error || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coverUrl =
      result.type === "track"
        ? result.album.images[0].url
        : result.images[0].url;

    const image = document.createElement("img") as HTMLImageElement;
    image.crossOrigin = "anonymous";
    image.src = coverUrl;

    image.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      canvas.width = 1080;
      canvas.height = 1920;

      // 🎨 Gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#1f1f1f");
      gradient.addColorStop(1, "#101010");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 🎵 Album cover
      const coverSize = 920;
      const coverX = (canvas.width - coverSize) / 2;
      const coverY = 80;
      const radius = 40;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(coverX + radius, coverY);
      ctx.lineTo(coverX + coverSize - radius, coverY);
      ctx.quadraticCurveTo(
        coverX + coverSize,
        coverY,
        coverX + coverSize,
        coverY + radius,
      );
      ctx.lineTo(coverX + coverSize, coverY + coverSize - radius);
      ctx.quadraticCurveTo(
        coverX + coverSize,
        coverY + coverSize,
        coverX + coverSize - radius,
        coverY + coverSize,
      );
      ctx.lineTo(coverX + radius, coverY + coverSize);
      ctx.quadraticCurveTo(
        coverX,
        coverY + coverSize,
        coverX,
        coverY + coverSize - radius,
      );
      ctx.lineTo(coverX, coverY + radius);
      ctx.quadraticCurveTo(coverX, coverY, coverX + radius, coverY);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(image, coverX, coverY, coverSize, coverSize);
      ctx.restore();

      document.fonts.ready.then(() => {
        // 🧑‍🎤 Format Artist Names
        const artistNames = result.artists.map((a: Artist) => a.name);
        const formattedArtists =
          artistNames.length > 2
            ? artistNames.slice(0, -1).join(", ") +
              ", and " +
              artistNames.slice(-1)
            : artistNames.join(" and ");

        const message = `${formattedArtists} just passed 5000 streams on their song, "${result.name}".`;

        // ✍️ Font and wrapping
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.font = "bold 65px 'DM Sans', sans-serif";

        const maxWidth = 920;
        const xPadding = 80;
        const words = message.split(" ");
        const lines: string[] = [];

        let currentLine = "";
        for (let i = 0; i < words.length; i++) {
          const testLine = currentLine + words[i] + " ";
          const testWidth = ctx.measureText(testLine).width;
          if (testWidth > maxWidth && currentLine !== "") {
            lines.push(currentLine.trim());
            currentLine = words[i] + " ";
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine.trim());

        // 🧭 Draw lines (left aligned, top padding)
        const lineHeight = 80;
        const startY = coverY + coverSize + 80; // vertical padding from top

        lines.forEach((line, i) => {
          ctx.fillText(line, xPadding, startY + i * lineHeight);
        });
      });

      // 🟩 Spotify logo (load and draw)
      const spotifyLogo = new Image();
      spotifyLogo.src = "/spotify.png";
      spotifyLogo.onload = () => {
        const logoWidth = 150;
        const logoHeight = 150;
        const padding = 40;
        const logoX = (canvas.width - logoWidth) / 2;
        const logoY = canvas.height - logoHeight - padding;
        ctx.drawImage(spotifyLogo, logoX, logoY, logoWidth, logoHeight);
      };
    };
  }, [result]);

  function downloadCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "track_info.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="text-sm font-[family-name:var(--font-geist-mono)]"
    >
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
          <canvas
            ref={canvasRef}
            style={{ width: "100%", maxWidth: "400px", height: "auto" }}
            className="my-4 border"
          />

          <button
            type="button"
            onClick={downloadCanvas}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded"
          >
            Download Canvas
          </button>
        </div>
      )}

      {result?.error && <p className="text-red-500">Error: {result.error}</p>}
    </form>
  );
}
