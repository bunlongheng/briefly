import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Briefly",
    short_name: "Briefly",
    description: "Paste any text, hear it read aloud, follow along karaoke-style.",
    start_url: "/",
    display: "standalone",
    background_color: "#111112",
    theme_color: "#111112",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
  };
}
