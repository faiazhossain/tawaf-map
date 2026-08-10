import type { Metadata, Viewport } from "next";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import local from "next/font/local";
import "./globals.css";
import { ThemeProvider, themeNoFlashScript } from "@/components/theme/theme-provider";

// Latin UI type — clean, neutral, calm.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Bengali — the primary content language. Inter has no Bengali glyphs, so all
// Bengali text falls through to this face (Mehdi Ekushey, local) in the body
// font stack. Only Regular + Italic ship with the family.
const mehdiEkushey = local({
  src: [
    {
      path: "../public/MehdiEkushey/Unicode/Li Mehdi Ekushey Unicode.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/MehdiEkushey/Unicode/Li Mehdi Ekushey Unicode Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-mehdi-ekushey",
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
  title: "TawafMap — তওয়াফ গাইড ও মক্কা-মদিনা ম্যাপ",
  description:
    "হজ ও ওমরাহ যাত্রীদের জন্য সহজ ম্যাপ গাইড — তওয়াফের প্রতিটি চক্কর, প্রতিটি ধাপ স্পষ্টভাবে দেখুন।",
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
      <body className={`${inter.variable} ${mehdiEkushey.variable} ${notoNaskhArabic.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
