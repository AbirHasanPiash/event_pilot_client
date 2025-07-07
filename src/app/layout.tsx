import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Configure Inter font with Tailwind CSS variable
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// SEO & Metadata
export const metadata: Metadata = {
  title: {
    default: "Event Management",
    template: "%s | Event Management",
  },
  description: "A modern event management platform built with Next.js",
  authors: [{ name: "Your Name", url: "https://yourwebsite.com" }],
  creator: "Your Name",
  keywords: ["Next.js", "Event", "Management", "Booking", "Platform"],
  metadataBase: new URL("https://yourdomain.com"), // replace with actual domain
  openGraph: {
    title: "Event Management",
    description: "Plan, book, and manage your events effortlessly.",
    url: "https://yourdomain.com",
    siteName: "Event Management",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Event Management",
    description: "Plan, book, and manage your events effortlessly.",
    creator: "@yourhandle",
  },
  themeColor: "#ffffff",
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <main className="flex flex-col min-h-screen">
          <Navbar />
          {children}
          <Footer />
        </main>
      </body>
    </html>
  );
}
