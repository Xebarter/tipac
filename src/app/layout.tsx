import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ Updated metadata with Open Graph and Twitter tags
export const metadata: Metadata = {
  title: "TIPAC - Theatre Initiative for The Pearl of Africa Children",
  description: "Empowering children through the art of theatre in Uganda",
  openGraph: {
    title: "TIPAC - Theatre Initiative for The Pearl of Africa Children",
    description: "Empowering children through the art of theatre in Uganda",
    url: "https://tipac.co.ug",
    type: "website",
    images: [
      {
        url: "https://tipac.co.ug/og-image.jpg", // Ensure this file is in your /public folder
        width: 1200,
        height: 630,
        alt: "TIPAC Uganda Poster",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TIPAC - Theatre Initiative for The Pearl of Africa Children",
    description: "Empowering children through the art of theatre in Uganda",
    images: ["https://tipac.co.ug/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
