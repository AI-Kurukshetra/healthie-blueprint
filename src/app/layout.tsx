import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import NextTopLoader from "nextjs-toploader"

import { AppProviders } from "@/components/providers"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 text-slate-950 antialiased`}
      >
        <AppProviders>
          <NextTopLoader color="#0EA5E9" height={3} showSpinner={false} />
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
