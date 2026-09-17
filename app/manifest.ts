import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest, and linked automatically by Next.js. This is what
// Android and Chrome read when the site is added to a home screen, so the icons here are
// the ones that end up on the launcher — the same LoanINNeed mark as the browser favicon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LoanINNeed — An Instant Loan Pass",
    short_name: "LoanINNeed",
    description:
      "Get ₹5000 - ₹1L personal payday loans at a low rate of interest. Apply in minutes.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#EF4444",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Launchers that crop icons to their own shape use this one, whose mark sits inside
      // the 80% safe zone so nothing is clipped off.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
