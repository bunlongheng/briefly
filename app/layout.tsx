import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://briefly-bheng.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Briefly",
  description: "Great books, in 5 minutes. Hear the big ideas read aloud and follow every word as it lands.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Briefly - great books in 5 minutes",
    description: "No time for the whole book? Get the big ideas read aloud, with every word lit up as it lands.",
    siteName: "Briefly",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Briefly - great books in 5 minutes",
    description: "No time for the whole book? Get the big ideas read aloud, with every word lit up as it lands.",
  },
  appleWebApp: { capable: true, title: "Briefly", statusBarStyle: "black-translucent" },
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#111112",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* set the theme before paint so there's no light/dark flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('briefly-theme');if(!t){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
