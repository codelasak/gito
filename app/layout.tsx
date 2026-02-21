import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "GİTO — Namaz Vakitleriyle Üretkenlik",
  description:
    "Gito Kız İmam Hatip Lisesi öğrencileri için namaz vakitleri bazlı üretkenlik ve ibadet takip uygulaması",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#7C5CFC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <Providers>
          <div className="app-container">{children}</div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
