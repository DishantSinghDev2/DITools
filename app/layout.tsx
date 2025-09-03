import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ShortcutsProvider } from "@/context/shortcuts"
import "./globals.css"



// --- SEO ENHANCEMENTS ---
// The metadata object is now much more detailed to provide search engines
// with comprehensive information about your site.

const siteConfig = {
  name: "DITools by DishIs Technologies",
  description: "A collection of free, fast, and reliable online developer tools, including a Redis connection tester, JSON formatter, and more. Built to Do-It-Together.",
  url: "https://tools.dishis.tech", // Replace with your actual domain
  ogImage: "https://tools.dishis.tech/og-image.png", // An attractive image for social sharing (e.g., 1200x630px)
  author: "DishIs Technologies",
  twitterHandle: "@dishistech", // Replace with your Twitter handle
};

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const baseUrl = "https://tools.dishis.tech" // <-- replace with your real domain

  // Construct canonical from path params (works in app router)
  const canonical = `${baseUrl}${params?.slug ? `/${params.slug}` : ""}`
  return {
    // Title template allows child pages to append their own titles.
    // Example: "Redis Tester | DITools by DishIs Technologies"
    title: {
      template: `%s | ${siteConfig.name}`,
      default: siteConfig.name, // Fallback title for the homepage
    },
    description: siteConfig.description,
    alternates: {
      canonical,
    },

    // Keywords help search engines understand your content.
    keywords: ["developer tools", "online tools", "redis", "json", "formatter", "tester", "cron", "utilities", "DishIs Technologies"],

    authors: [{ name: siteConfig.author, url: "https://dishis.tech" }],

    // Sets the canonical URL to avoid duplicate content issues.
    metadataBase: new URL(siteConfig.url),

    // --- Open Graph (for Facebook, LinkedIn, etc.) ---
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      title: siteConfig.name,
      description: siteConfig.description,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} - Online Developer Tools`,
        },
      ],
    },

    // --- Twitter Card (for Twitter sharing) ---
    twitter: {
      card: "summary_large_image",
      title: siteConfig.name,
      description: siteConfig.description,
      images: [siteConfig.ogImage],
      creator: siteConfig.twitterHandle,
    },

    // --- Additional Meta Tags ---
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon-16x16.png",
      apple: "/apple-touch-icon.png",
    },
    manifest: `/site.webmanifest`,
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} h-full flex flex-col`}>
        <ShortcutsProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <div className="flex-1">{children}</div>
          </Suspense>
          <footer className="border-t bg-background text-muted-foreground">
            <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
              <p className="text-sm">
                © {new Date().getFullYear()} DishIs Technologies —
                <a href="https://dishis.tech" target="_blank" rel="noreferrer" className="underline ml-1">
                  dishis.tech
                </a>
              </p>
              <nav className="flex items-center gap-4 text-sm">
                <a href="/privacy" className="hover:underline">
                  Privacy
                </a>
                <a href="/terms" className="hover:underline">
                  Terms
                </a>
                <a href="/changelog/redis" className="hover:underline">
                  Changelog (Redis)
                </a>
                <a href="/changelog/mongodb" className="hover:underline">
                  Changelog (MongoDB)
                </a>
                <a href="/mongodb" className="hover:underline">
                  MongoDB Manager
                </a>
                <a href="/" className="hover:underline">
                  Redis Tester
                </a>
              </nav>
            </div>
          </footer>
          <Analytics />
        </ShortcutsProvider>
      </body>
    </html>
  )
}
