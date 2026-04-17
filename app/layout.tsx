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
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.manualfor.life";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f5f0",
};

export const metadata: Metadata = {
  metadataBase: new URL(appSiteUrl),
  title: "Manualfor.life — Leave a trace",
  description: "Leave one thought for someone you will never meet.",
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
    title: "Manualfor.life App",
    description: "Leave a trace. Read what remains.",
    images: [
      {
        url: "/og/og-ecosystem.png",
        width: 1200,
        height: 630,
        alt: "Manualfor.life — A place where people leave one thought that changed their life.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Manualfor.life App",
    description: "Leave a trace. Read what remains.",
    images: ["/og/og-ecosystem.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      {
        url: "/brand/android-chrome-192x192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/brand/android-chrome-512x512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
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
