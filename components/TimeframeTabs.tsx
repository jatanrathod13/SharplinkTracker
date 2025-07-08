'use client'

import React from 'react'

interface TimeframeTabsProps {
  selectedTimeframe: string
  onTimeframeChange: (timeframe: string) => void
}

const timeframes = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: '1y', value: '1y' },
]

export default function TimeframeTabs({ selectedTimeframe, onTimeframeChange }: TimeframeTabsProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-1 inline-flex rounded-lg">
        {timeframes.map((timeframe) => (
          <button
            key={timeframe.value}
            onClick={() => onTimeframeChange(timeframe.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              selectedTimeframe === timeframe.value
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {timeframe.label}
          </button>
        ))}
      </div>
    </div>
  )
} 