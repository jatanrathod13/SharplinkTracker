'use client'

import React from 'react'
import Image from 'next/image'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-8 animate-bounce">
          <Image
            src="/images/sharplink-official-logo.png"
            alt="SharpLink Gaming Logo"
            width={128}
            height={128}
            className="mx-auto"
            priority
          />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          SharpLink Gaming
        </h1>
        <h2 className="text-2xl font-semibold text-blue-300 mb-6">
          ETH Treasury Tracker
        </h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
        <p className="text-gray-300 mt-4 text-sm">
          Community Project - Not Officially Affiliated
        </p>
      </div>
    </div>
  )
} 