import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { BankingProvider } from "@/lib/banking-context"
import { RealtimeProvider } from "@/lib/realtime-orchestrator"
import "./globals.css"

const _geistSans = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Chase Bank - Enterprise Financial System",
  description: "Integrated financial management with real-time updates and instant account opening",
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#117aca",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased overflow-x-hidden overscroll-none touch-pan-y">
        <RealtimeProvider>
          <BankingProvider>
            {children}
            <Toaster />
          </BankingProvider>
        </RealtimeProvider>
      </body>
    </html>
  )
}
