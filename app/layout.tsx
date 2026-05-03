import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fancy-Doc File Converter",
  description:
    "Convert images and documents instantly — IMG to PDF, DOC to PDF, PDF to DOC.",
  manifest: "/manifest.json",
  themeColor: "#e0f4ff",
  openGraph: {
    title: "Fancy-Doc File Converter",
    description:
      "Convert images and documents instantly — IMG to PDF, DOC to PDF, PDF to DOC.",
    images: [
      {
        url: "/icons/icon-192x192.png",
        width: 1200,
        height: 630,
        alt: "Fancy-Doc Logo",
      },
    ],
    type: "website",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#e0f4ff] flex flex-col">{children}</body>
    </html>
  );
}
