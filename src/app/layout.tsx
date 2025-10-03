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
    default: "EventPilot",
    template: "%s | EventPilot",
  },
  description: "A modern event management platform built with Next.js",
  metadataBase: new URL("https://eventpilot-pearl.vercel.app/"),
  keywords: ["Next.js", "Event", "Management", "Booking", "Platform", "React", "django", "Abir Hasan Piash", "a_h_Piash"],
  authors: [{ name: "MD. ABIR HASAN PIASH", url: "https://ahpiashportfolio.vercel.app/" }],
  creator: "Your Name",
  openGraph: {
    title: "EventPilot - Event Management",
    description: "Plan, book, and manage your events effortlessly.",
    url: "https://eventpilot-pearl.vercel.app/",
    siteName: "EventPilot",
    images: [
      {
        url: "https://eventpilot-pearl.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "EventPilot",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EventPilot - Event Management",
    description: "Plan, book, and manage your events effortlessly.",
    creator: "@yourhandle",
    images: ["https://eventpilot-pearl.vercel.app/og-image.png"],
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
