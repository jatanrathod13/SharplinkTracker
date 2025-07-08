'use client'

import React from 'react'

interface KPICardProps {
  title: string
  value: string
  change?: number
  subtitle?: string
  icon: string | React.ReactElement
  highlight?: boolean
}

export default function KPICard({ 
  title, 
  value, 
  change, 
  subtitle, 
  icon, 
  highlight = false 
}: KPICardProps) {
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗'
    if (change < 0) return '↘'
    return '→'
  }

  return (
    <div className={`
      relative overflow-hidden rounded-xl p-6 backdrop-blur-sm border transition-all duration-300 hover:scale-105
      ${highlight 
        ? 'bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-blue-500/10 border-blue-500/30 shadow-lg' 
        : 'bg-slate-800/50 border-slate-700 hover:border-blue-500/20'
      }
    `}>
      {/* Background gradient overlay */}
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-50"></div>
      )}

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`
              text-2xl p-2 rounded-lg flex items-center justify-center
              ${highlight 
                ? 'bg-blue-500/20 border border-blue-400/30' 
                : 'bg-gray-500/10 border border-gray-400/20'
              }
            `}>
              {typeof icon === 'string' ? icon : icon}
            </div>
            <div>
              <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
            </div>
          </div>
          
          {change !== undefined && (
            <div className={`flex items-center space-x-1 ${getChangeColor(change)}`}>
              <span className="text-lg">{getChangeIcon(change)}</span>
              <span className="text-sm font-medium">
                {Math.abs(change).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className={`
            text-2xl font-bold font-mono
            ${highlight ? 'text-blue-100' : 'text-white'}
          `}>
            {value}
          </div>
          
          {subtitle && (
            <p className="text-gray-400 text-sm">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  )
} 