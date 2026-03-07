import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Blog & Podcast",
    template: "%s | Blog & Podcast",
  },
  description: "A modern blog and podcast platform built with Next.js, DaisyUI, and Prisma",
  keywords: ["blog", "podcast", "nextjs", "typescript", "react"],
  authors: [{ name: "Blog & Podcast Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Blog & Podcast",
    title: "Blog & Podcast",
    description:
      "Discover insightful articles and engaging podcasts on technology, development, and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog & Podcast",
    description:
      "Discover insightful articles and engaging podcasts on technology, development, and more.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="night" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
