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

export const metadata: Metadata = {
  metadataBase: new URL("https://tipac.co.ug"),
  title: "TIPAC - Theatre Initiative for The Pearl of Africa Children",
  description: "Empowering children through the art of theatre in Uganda",
  openGraph: {
    title: "TIPAC - Theatre Initiative for The Pearl of Africa Children",
    description: "Empowering children through the art of theatre in Uganda",
    url: "https://tipac.co.ug",
    siteName: "TIPAC Uganda", // Added for better branding
    type: "website",
    locale: "en_US", // Added for language specification
    images: [
      {
        url: "/og-image.jpg", // Relative path for flexibility
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
    images: ["/og-image.jpg"], // Relative path
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
