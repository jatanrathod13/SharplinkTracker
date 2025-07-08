import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SharpLink Gaming ETH Treasury Tracker - Community Analytics',
  description: 'Independent community tracker for SharpLink Gaming Ethereum treasury analytics. Real-time ETH holdings, staking rewards, and portfolio insights. Not officially affiliated.',
  keywords: 'SharpLink Gaming, ETH treasury, Ethereum holdings, crypto analytics, blockchain tracking, community project, treasury analytics',
  openGraph: {
    title: 'SharpLink Gaming ETH Treasury Tracker',
    description: 'Community-driven analytics dashboard for tracking Ethereum treasury performance and holdings.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SharpLink Gaming ETH Treasury Tracker',
    description: 'Independent community tracker for Ethereum treasury analytics.',
  },
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
} 