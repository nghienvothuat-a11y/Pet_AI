import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BossCare",
  description: "Sàng lọc sức khỏe sơ bộ cho chó và mèo bằng ảnh.",
  icons: {
    icon: "/logo-ai-paw.png",
    apple: "/logo-ai-paw.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fdf6ec"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
