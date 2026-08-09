import type { Metadata, Viewport } from "next";
import { Inter, Hind_Siliguri, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeNoFlashScript } from "@/components/theme/theme-provider";

// Latin UI type — clean, neutral, calm.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Bengali — the primary content language. Inter has no Bengali glyphs, so all
// Bengali text falls through to this face in the body font stack.
const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

// Arabic — used for duas / Quranic text. Apply via the `.font-arabic` utility
// with dir="rtl" on the consuming element.
const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-naskh-arabic",
  display: "swap",
});

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
    { media: "(prefers-color-scheme: light)", color: "#FAF8F2" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1715" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        {/* Apply stored theme before hydration to avoid a flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body className={`${inter.variable} ${hindSiliguri.variable} ${notoNaskhArabic.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
