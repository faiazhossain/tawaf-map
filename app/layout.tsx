import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TawafMap - Navigate Makkah & Madinah",
  description: "Localized AI navigation platform for pilgrims in Makkah and Madinah",
  applicationName: "TawafMap",
  authors: [{ name: "TawafMap Team" }],
  icons: {
    icon: "/icons/Tawafmap.webp",
    apple: "/icons/Tawafmap.webp",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
