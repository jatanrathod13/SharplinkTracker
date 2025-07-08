import React, { useState } from 'react'

export default function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-blue-100 text-sm font-medium">LIVE</span>
            </div>
            
            <div className="hidden sm:block h-4 w-px bg-blue-300/30"></div>
            
            <div className="flex items-center space-x-3">
              <span className="text-white font-semibold text-sm lg:text-base">
                🎯 Real SharpLink Gaming Data Loaded: 198,167 ETH ($485.3M)
              </span>
              <span className="hidden lg:inline text-blue-100 text-sm">
                • Largest Publicly-Traded ETH Holder • 100% Staked • Live Treasury Tracking
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/10 rounded text-blue-100 hover:text-white transition-colors duration-200"
              aria-label="Close announcement"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 