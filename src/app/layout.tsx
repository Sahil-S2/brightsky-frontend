import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "BSC Tracker — Bright Sky Construction",
  description: "Employee time tracking and management system for Bright Sky Construction.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BSC Tracker",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png",  sizes: "32x32",  type: "image/png" },
      { url: "/icons/icon-96x96.png",  sizes: "96x96",  type: "image/png" },
      { url: "/icons/icon-192x192.png",sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BSC Tracker" />
        <meta name="application-name" content="BSC Tracker" />
      </head>
      <body>{children}</body>
    </html>
  );
}