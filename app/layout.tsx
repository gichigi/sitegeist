import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { JetBrains_Mono } from "next/font/google"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Sitegeist | Your site is haunted. We see the spirits.",
  description: "The digital spirit that haunts your website. Sitegeist crawls through forgotten corners, revealing hidden structures and lost pages that lurk in the digital shadows.",
  keywords: [
    "website analyzer",
    "site structure",
    "orphaned pages",
    "broken links",
    "SEO audit",
    "website crawler",
    "digital spirits",
    "site health",
    "website analysis",
    "technical SEO"
  ],
  authors: [{ name: "Sitegeist" }],
  creator: "Sitegeist",
  publisher: "Sitegeist",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://sitegeist.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Sitegeist | Your site is haunted. We see the spirits.",
    description: "The digital spirit that haunts your website. Sitegeist crawls through forgotten corners, revealing hidden structures and lost pages that lurk in the digital shadows.",
    url: "https://sitegeist.vercel.app",
    siteName: "Sitegeist",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Sitegeist - The digital spirit that haunts your website",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sitegeist | Your site is haunted. We see the spirits.",
    description: "The digital spirit that haunts your website. Sitegeist crawls through forgotten corners, revealing hidden structures and lost pages that lurk in the digital shadows.",
    images: ["/twitter-image.svg"],
    creator: "@sitegeist",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Sitegeist",
    "description": "The digital spirit that haunts your website. Sitegeist crawls through forgotten corners, revealing hidden structures and lost pages that lurk in the digital shadows.",
    "url": "https://sitegeist.vercel.app",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "Sitegeist"
    },
    "featureList": [
      "Website structure analysis",
      "Orphaned page detection", 
      "Broken link identification",
      "AI-powered insights",
      "SEO audit tools"
    ]
  }

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00ff00" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={jetbrainsMono.className}>{children}</body>
    </html>
  )
}

import "./globals.css"
