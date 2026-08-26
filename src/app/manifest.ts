import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Intake — Nutrition & Habit Tracker",
    short_name: "Intake",
    description:
      "Track nutrition, hydration, activity, and habits with transparent scoring and evidence-based insights.",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7f8f2",
    theme_color: "#386f56",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: "/icons/intake-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/intake-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/intake-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Today",
        short_name: "Today",
        description: "Open today's Intake dashboard",
        url: "/today",
        icons: [{ src: "/icons/intake-192.png", sizes: "192x192" }],
      },
      {
        name: "Log food",
        short_name: "Log food",
        description: "Add a meal or snack",
        url: "/log/food",
        icons: [{ src: "/icons/intake-192.png", sizes: "192x192" }],
      },
    ],
  };
}
