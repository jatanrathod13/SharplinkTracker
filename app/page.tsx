'use client'

import React, { useState, useEffect } from 'react'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import Dashboard from '@/components/Dashboard'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoadingScreen from '@/components/LoadingScreen'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Reduced loading time for better performance
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <main className="min-h-screen flex flex-col bg-slate-900">
      <AnnouncementBanner />
      <Header />
      <div className="flex-1">
        <Dashboard />
      </div>
      <Footer />
    </main>
  )
} 