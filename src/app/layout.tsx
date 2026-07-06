import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mohiyat AI — Shartnoma xavfsizligini 30 soniyada tekshiring",
  description:
    "Sun'iy intellekt yordamida shartnomadagi yashirin jarimalar, xavfli bandlar va qonunga zid shartlarni avtomatik aniqlang. O'zbekiston Fuqarolik Kodeksiga asoslangan.",
  keywords: [
    "shartnoma tekshirish",
    "yuridik tahlil",
    "AI",
    "O'zbekiston",
    "Fuqarolik Kodeksi",
    "ijara shartnomasi",
    "xizmat shartnomasi",
    "penya",
    "jarima",
  ],
  openGraph: {
    title: "Mohiyat AI — Avtomatik shartnoma tahlili",
    description:
      "Shartnomadagi yashirin xavflarni 30 soniyada aniqlang. Kichik biznes va frilanserlar uchun.",
    type: "website",
    locale: "uz_UZ",
    siteName: "Mohiyat AI",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mohiyat AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[var(--font-inter)]">
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('ServiceWorker registration successful');
                  },
                  function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
