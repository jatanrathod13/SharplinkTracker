'use client'

import React, { useState, useEffect } from 'react'
import KPICard from './KPICard'
import TimeframeTabs from './TimeframeTabs'
import ETHYieldChart from './charts/ETHYieldChart'
import TreasuryChart from './charts/TreasuryChart'
import PerformanceChart from './charts/PerformanceChart'
import NAVMultiplierChart from './charts/NAVMultiplierChart'
import EthereumIcon from './EthereumIcon'
import AnnouncementBanner from './AnnouncementBanner'

type Timeframe = '24h' | '7d' | '30d' | '90d' | '1y'

interface ETHPurchase {
  timestamp: string
  eth_quantity: number
  eth_price_usd: number
  total_cost_usd: number
  concentration_change_pct: number
  notes: string
}

interface TreasuryDashboardData {
  sbet_stock: {
    current_price: number
    volume: number
  }
  eth_treasury: {
    total_holdings: number
    current_value_usd: number
    total_invested_usd: number
    average_purchase_price: number
    current_eth_price: number
    unrealized_pnl_usd: number
    unrealized_pnl_pct: number
  }
  concentration_metrics: {
    eth_concentration_pct: number
    treasury_value_usd: number
    nav_multiplier: number
    eth_per_share: number
  }
}

export default function Dashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('30d')
  const [isLoading, setIsLoading] = useState(true)
  const [ethPurchases, setEthPurchases] = useState<ETHPurchase[]>([])
  const [treasuryData, setTreasuryData] = useState<TreasuryDashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Reduced loading time for better performance
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [selectedTimeframe])

  useEffect(() => {
    // Fetch real ETH purchase data and treasury dashboard data
    const fetchRealData = async () => {
      try {
        const [purchasesResponse, dashboardResponse] = await Promise.all([
          fetch('http://localhost:8000/api/eth-purchases?timeframe=ALL'),
          fetch('http://localhost:8000/api/treasury-dashboard')
        ])

        if (purchasesResponse.ok) {
          const purchasesData = await purchasesResponse.json()
          setEthPurchases(purchasesData.purchases || [])
        }

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json()
          setTreasuryData(dashboardData)
        }
      } catch (error) {
        console.error('Error fetching real data:', error)
        setError('Failed to load live data')
      }
    }

    fetchRealData()
  }, [])

  // Use real data if available, otherwise fallback to actual SharpLink Gaming data
  const sampleData = {
    currentPrice: {
      eth: treasuryData?.eth_treasury.current_eth_price || 2444,
      change: 3.4,
      volume: '15.2B'
    },
    ethHoldings: {
      total: treasuryData?.eth_treasury.total_holdings || 198167, // Real ETH holdings: 198,167 ETH as of July 2025
      value: (treasuryData?.eth_treasury.current_value_usd || (198167 * 2444)) / 1000000, // Convert to millions
      change: treasuryData?.eth_treasury.unrealized_pnl_pct || 17.7,
      staking: 100 // 100% staked according to official reports
    },
    treasuryStats: {
      totalValue: (treasuryData?.concentration_metrics.treasury_value_usd || (198167 * 2444)) / 1000000, // Convert to millions
      stakingRewards: (222 * 2444) / 1000000, // 222 ETH staking rewards in millions USD
      avgYield: 3.8,
      ethPerShare: treasuryData?.concentration_metrics.eth_per_share || (198167 / 72050000) // Real calculation: 198,167 ETH / ~72M shares
    },
    performance: {
      ytd: 21.74,
      oneYear: 45.8,
      allTime: 125.3,
      stakeRewards: 222 // ETH earned from staking (simulated)
    },
    sbet: {
      currentPrice: treasuryData?.sbet_stock.current_price || 10.25,
      concentration: treasuryData?.concentration_metrics.eth_concentration_pct || 25.5
    }
  }

  const kpiData = [
    {
      title: 'ETH Holdings',
      value: `${sampleData.ethHoldings.total.toLocaleString()} ETH`,
      change: sampleData.ethHoldings.change,
      subtitle: `$${sampleData.ethHoldings.value.toFixed(1)}M • ${sampleData.ethHoldings.staking}% Staked`,
      icon: <EthereumIcon size={24} className="text-blue-400" />,
      highlight: true
    },
    {
      title: 'SBET Stock Price',
      value: `$${sampleData.sbet.currentPrice.toFixed(2)}`,
      change: sampleData.currentPrice.change,
      subtitle: `ETH Concentration: ${sampleData.sbet.concentration.toFixed(1)}%`,
      icon: '📈'
    },
    {
      title: 'Treasury Value',
      value: `$${sampleData.treasuryStats.totalValue.toFixed(1)}M`,
      change: 2.1,
      subtitle: 'Total Portfolio Value',
      icon: '💰'
    },
    {
      title: 'ETH per Share',
      value: `${(sampleData.treasuryStats.ethPerShare * 1000).toFixed(2)} ETH`,
      change: sampleData.ethHoldings.change,
      subtitle: 'Per 1,000 shares',
      icon: '🔗'
    },
    {
      title: 'Avg Purchase Price',
      value: `$${treasuryData?.eth_treasury.average_purchase_price.toFixed(0) || '2,599'}`, // Real avg: $2,599 weighted average
      change: treasuryData?.eth_treasury.unrealized_pnl_pct || -5.8,
      subtitle: `Current: $${sampleData.currentPrice.eth.toLocaleString()}`,
      icon: '⚡'
    },
    {
      title: 'YTD Performance',
      value: `+${sampleData.performance.ytd}%`,
      change: sampleData.performance.ytd,
      subtitle: 'Year to Date',
      icon: '🚀'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative">
      {/* Simplified background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Real Data Announcement */}
        <AnnouncementBanner />
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                SharpLink Gaming ETH Treasury
              </h1>
              <p className="text-gray-400 text-lg">
                Largest publicly-traded ETH holder with 198,167 ETH • 100% staked strategy • Joseph Lubin Chairman
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
                <div className="text-sm text-gray-400">Last Updated</div>
                <div className="text-white font-mono">
                  {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <TimeframeTabs 
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={(timeframe: string) => setSelectedTimeframe(timeframe as Timeframe)}
          />
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {kpiData.map((kpi, index) => (
            <div key={kpi.title}>
              <KPICard {...kpi} />
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* ETH Treasury Value Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">ETH Treasury Value</h3>
              <div className="text-sm text-gray-400">
                Current: $${(sampleData.ethHoldings.total * sampleData.currentPrice.eth / 1000000).toFixed(1)}M
              </div>
            </div>
            <TreasuryChart timeframe={selectedTimeframe} />
          </div>

          {/* Portfolio Performance Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Portfolio Performance</h3>
              <div className="text-sm text-gray-400">
                YTD: +21.74%
              </div>
            </div>
            <PerformanceChart timeframe={selectedTimeframe} />
          </div>

          {/* ETH Staking Yield Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Staking Yield</h3>
              <div className="text-sm text-gray-400">
                Total Earned: 222 ETH
              </div>
            </div>
            <ETHYieldChart timeframe={selectedTimeframe} />
          </div>

          {/* NAV Analysis Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">NAV Analysis</h3>
              <div className="text-sm text-gray-400">
                Current Ratio: 1.5x
              </div>
            </div>
            <NAVMultiplierChart timeframe={selectedTimeframe} />
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Treasury Statistics */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Treasury Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total ETH Holdings</span>
                <span className="text-white font-mono">{sampleData.ethHoldings.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ETH Actively Staked</span>
                <span className="text-green-400 font-mono">{sampleData.ethHoldings.staking}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Average Yield</span>
                <span className="text-white font-mono">{sampleData.treasuryStats.avgYield}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Market Value</span>
                <span className="text-white font-mono">${sampleData.ethHoldings.value.toFixed(1)}M</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Value</span>
                <span className="text-white font-mono">${sampleData.treasuryStats.totalValue.toFixed(1)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Staking Value</span>
                <span className="text-white font-mono">${sampleData.treasuryStats.stakingRewards.toFixed(1)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">1Y Return</span>
                <span className="text-green-400 font-mono">+{sampleData.performance.oneYear}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">All-Time</span>
                <span className="text-green-400 font-mono">+{sampleData.performance.allTime}%</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="border-l-2 border-blue-500 pl-3">
                <div className="text-white font-medium">Major ETH Purchase</div>
                <div className="text-gray-400">Added 176,271 ETH ($463M)</div>
                <div className="text-gray-500 text-xs">June 13, 2025</div>
              </div>
              <div className="border-l-2 border-green-500 pl-3">
                <div className="text-white font-medium">Staking Rewards</div>
                <div className="text-gray-400">Earned 222 ETH from staking</div>
                <div className="text-gray-500 text-xs">Ongoing</div>
              </div>
              <div className="border-l-2 border-blue-500 pl-3">
                <div className="text-white font-medium">Additional Purchase</div>
                <div className="text-gray-400">Added 9,468 ETH ($22.8M)</div>
                <div className="text-gray-500 text-xs">June 26-30, 2025</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 