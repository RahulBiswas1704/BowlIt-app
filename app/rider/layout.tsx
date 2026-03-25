import type { Metadata, Viewport } from "next";

// Override the root PWA metadata for the Rider sub-app
export const metadata: Metadata = {
  title: "BowlIt Rider | Delivery Dashboard",
  description: "Rider delivery panel for BowlIt.",
  manifest: "/rider-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BowlIt Rider",
  },
  icons: {
    icon: "/rider-icon.svg",
    apple: "/rider-icon.svg",
  },
};

// Override the theme color for the Rider app
export const viewport: Viewport = {
  themeColor: "#0ea5e9", // Cyan for Rider branding
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
