import type { Metadata } from "next"
import { DM_Sans, Geist_Mono, Playfair_Display } from "next/font/google"
import NextTopLoader from "nextjs-toploader"

import { AppProviders } from "@/components/providers"

import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "HealthFlow",
  description: "Virtual care platform for providers and patients.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className="light"
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <body
        className={`${dmSans.variable} ${playfairDisplay.variable} ${geistMono.variable} bg-[var(--surface)] text-[var(--text-primary)] antialiased`}
      >
        <AppProviders>
          <NextTopLoader color="#00D4B8" height={3} showSpinner={false} />
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
