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
  title: "Fancy-Doc — File Converter",
  description:
    "Convert images and documents instantly. IMG to PDF, DOC to PDF, PDF to DOC. Fast, free, and secure.",
  manifest: "/manifest.json",
  themeColor: "#0ea5e9",
  keywords: [
    "file converter",
    "img to pdf",
    "doc to pdf",
    "pdf to doc",
    "free converter",
  ],
  authors: [{ name: "Fancy-Doc" }],
  openGraph: {
    title: "Fancy-Doc — Free File Converter",
    description:
      "Convert images and documents instantly. IMG to PDF, DOC to PDF, PDF to DOC. Fast, free, and secure.",
    url: "https://fancy-doc.vercel.app",
    siteName: "Fancy-Doc",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fancy-Doc — File Converter",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fancy-Doc — Free File Converter",
    description:
      "Convert images and documents instantly. IMG to PDF, DOC to PDF, PDF to DOC.",
    images: ["/og-image.png"],
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