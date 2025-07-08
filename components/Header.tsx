'use client'

import React from 'react'
import Image from 'next/image'

export default function Header() {
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src="/images/sharplink-official-logo.png"
              alt="SharpLink Gaming Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">
                SharpLink Gaming
              </h1>
              <p className="text-sm text-blue-300">
                ETH Treasury Tracker
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-sm text-gray-400">Community Project</div>
              <div className="text-xs text-gray-500">Not Officially Affiliated</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 