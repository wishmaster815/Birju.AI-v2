import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Geist_Mono } from "next/font/google"
// import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "react-hot-toast"

const _inter = Inter({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Birjuram.Ai",
  description: "AI Career Guidance Coach",
  generator: "Birju Bytes",
  
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
  <link rel="icon" href="/favicon.png?v=2" type="image/png" />
  <link rel="shortcut icon" href="/favicon.png?v=2" type="image/png" />
  <link rel="apple-touch-icon" href="/favicon.png?v=2" />
</head>
      <body className={`font-sans antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 5000,
            style: {
              borderRadius: "12px",
              background: "#fff",
              color: "var(--color-dark-text)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              border: "1px solid var(--color-light-blue)",
            },
            success: {
              iconTheme: {
                primary: "var(--color-primary-blue)",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#fff",
              },
            },
          }}
        />
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
