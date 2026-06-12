import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bolão Copa 2026",
    short_name: "Bolão 2026",
    description: "Bolão da família — Copa do Mundo 2026",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8f4",
    theme_color: "#0a7e3d",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
