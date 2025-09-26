// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthProvider from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider";
import { SWRProvider } from "@/lib/swrConfig";

// Load Inter font with Tailwind CSS variable
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// --- SEO & Metadata ---
export const metadata: Metadata = {
  title: {
    default: "Event Management",
    template: "%s | Event Management",
  },
  description: "A modern event management platform built with Next.js",
  metadataBase: new URL("https://yourdomain.com"),
  keywords: ["Next.js", "Event", "Management", "Booking", "Platform"],
  authors: [{ name: "Your Name", url: "https://yourwebsite.com" }],
  creator: "Your Name",
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
};

// --- Viewport settings (new as of Next.js 13.4+)
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SWRProvider>
            <AuthProvider>
              <Toaster position="top-right" />
              <main className="flex flex-col bg-white dark:bg-black min-h-screen">
                <Navbar />
                <div className="flex-grow">{children}</div>
                <Footer />
              </main>
            </AuthProvider>
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
