import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

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
    default: "Slice of Life",
    template: "%s | Slice of Life",
  },
  description:
    "A personal space for reflection, documentation, and growth — where ideas take shape through writing and conversation.",
  keywords: ["blog", "podcast", "personal", "reflection", "growth", "journal"],
  authors: [{ name: "Slice of Life" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Slice of Life",
    title: "Slice of Life",
    description:
      "A personal space for thinking out loud, documenting what I learn, and tracking growth over time.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Slice of Life",
    description:
      "A personal space for thinking out loud, documenting what I learn, and tracking growth over time.",
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
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <Navbar />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
