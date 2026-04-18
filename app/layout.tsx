import type { Metadata, Viewport } from "next";
import { Caveat, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

const appSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://manualfor.life";

/**
 * Favicon files live on this Next deployment, while metadataBase stays on the
 * marketing domain for OG/Twitter. Relative icon URLs would otherwise resolve
 * against metadataBase and load from manualfor.life (stale / wrong tree).
 */
function iconAssetOrigin(): string {
  if (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL.length > 0) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NODE_ENV === "development") {
    return `http://localhost:${process.env.PORT ?? "3000"}`;
  }
  return "https://app.manualfor.life";
}

const iconOnDeployment = (path: string) =>
  new URL(path, iconAssetOrigin());

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f5f0",
};

const shareTitle = "Manualfor.life — One thought worth keeping";
const shareDescription = "A quiet place to leave one thought that mattered.";
const ogImageAlt =
  "One thought can travel further than we do. — Manualfor.life";

export const metadata: Metadata = {
  metadataBase: new URL(appSiteUrl),
  title: shareTitle,
  description: shareDescription,
  applicationName: "Manualfor.life",
  alternates: {
    canonical: "/",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Manualfor.life",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appSiteUrl,
    siteName: "Manualfor.life",
    title: shareTitle,
    description: shareDescription,
    images: [
      {
        url: "/og/og-share.png",
        width: 1200,
        height: 630,
        alt: ogImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDescription,
    images: ["/og/og-share.png"],
  },
  icons: {
    icon: [
      { url: iconOnDeployment("/favicon.ico?v=3"), sizes: "any" },
      {
        url: iconOnDeployment("/brand/favicon-32x32.png?v=3"),
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: iconOnDeployment("/brand/favicon-16x16.png?v=3"),
        type: "image/png",
        sizes: "16x16",
      },
      {
        url: iconOnDeployment("/brand/icon-192.png?v=3"),
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: iconOnDeployment("/brand/icon-512.png?v=3"),
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [
      { url: iconOnDeployment("/brand/apple-touch-icon.png?v=3"), sizes: "180x180" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorantGaramond.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
