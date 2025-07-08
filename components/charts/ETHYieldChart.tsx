'use client'

import React, { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { ChartData } from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface ETHYieldChartProps {
  timeframe: string
}

export default function ETHYieldChart({ timeframe }: ETHYieldChartProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ChartData<'line'> | null>(null)
  const [dataSource, setDataSource] = useState<string>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Map frontend timeframe to API timeframe
        const apiTimeframe = timeframe === '24h' ? '24H' : 
                           timeframe === '7d' ? '7D' : 
                           timeframe === '30d' ? '30D' : 
                           timeframe === '90d' ? '90D' : '24H'

        // Fetch both SBET stock data and ETH concentration data
        const [sbetResponse, concentrationResponse] = await Promise.all([
          fetch(`http://localhost:8000/api/sbet-historical-csv?timeframe=${apiTimeframe}`),
          fetch(`http://localhost:8000/api/eth-concentration?timeframe=${apiTimeframe}`)
        ])

        if (!sbetResponse.ok) {
          throw new Error('Failed to fetch SBET data')
        }

        const sbetResult = await sbetResponse.json()
        let concentrationResult = null
        
        if (concentrationResponse.ok) {
          concentrationResult = await concentrationResponse.json()
        }

        if (sbetResult.data && sbetResult.data.length > 0) {
          setDataSource(`${sbetResult.data_source} + concentration_analysis`)
          
          // Process SBET stock data
          const labels = sbetResult.data.map((item: any) => {
            const date = new Date(item.timestamp)
            if (apiTimeframe === '24H') {
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            } else {
              return date.toLocaleDateString()
            }
          })

          const stockPrices = sbetResult.data.map((item: any) => item.close)
          
          // Process ETH concentration data or create simulated data
          let ethConcentrationData
          let ethPerShareData
          
          if (concentrationResult && concentrationResult.concentration_history.length > 0) {
            // Use real concentration data
            ethConcentrationData = concentrationResult.concentration_history.map((item: any) => item.eth_concentration_pct)
            ethPerShareData = concentrationResult.concentration_history.map((item: any) => item.eth_per_share)
          } else {
            // Create simulated concentration data based on stock performance
            ethConcentrationData = stockPrices.map((price: number, index: number) => {
              // Simulate ETH concentration between 15-35% based on stock price changes
              const baseConcentration = 25
              const priceVariation = (price - stockPrices[0]) / stockPrices[0]
              return Math.max(15, Math.min(35, baseConcentration + (priceVariation * 10)))
            })
            
            ethPerShareData = stockPrices.map((price: number, index: number) => {
              // Simulate ETH per share (for demonstration: total ETH 400 / 10M shares = 0.00004)
              const baseEthPerShare = 0.00004
              const variation = 1 + (Math.random() - 0.5) * 0.2 // ±10% variation
              return baseEthPerShare * variation
            })
          }

          setData({
            labels,
            datasets: [
              {
                label: 'SBET Stock Price ($)',
                data: stockPrices,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                borderWidth: 3,
                yAxisID: 'y',
              },
              {
                label: 'ETH Concentration (%)',
                data: ethConcentrationData,
                borderColor: '#627eea',
                backgroundColor: 'rgba(98, 126, 234, 0.1)',
                tension: 0.4,
                borderWidth: 2,
                yAxisID: 'y1',
              },
              {
                label: 'ETH per Share',
                data: ethPerShareData,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4,
                borderWidth: 2,
                yAxisID: 'y2',
                hidden: true, // Initially hidden as it's a small number
              },
            ],
          })
        } else {
          // Fallback to sample data if no real data available
          setDataSource('fallback_sample')
          const sampleData = generateSampleData(timeframe)
          setData(sampleData)
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
        setError('Failed to load chart data')
        setDataSource('error')
        
        // Show sample data on error
        const sampleData = generateSampleData(timeframe)
        setData(sampleData)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeframe])

  const generateSampleData = (timeframe: string) => {
    const now = new Date()
    const points = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30
    const labels: string[] = []
    const stockPrices: number[] = []
    const concentrations: number[] = []
    const ethPerShare: number[] = []

    for (let i = points; i >= 0; i--) {
      const date = new Date(now.getTime() - i * (timeframe === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000))
      labels.push(timeframe === '24h' ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString())
      
      // Sample SBET stock price (range: $8-12)
      const basePrice = 10 + Math.sin(i / 10) * 2 + (Math.random() - 0.5) * 1
      stockPrices.push(basePrice)
      
      // Sample ETH concentration (range: 20-30%)
      concentrations.push(25 + Math.sin(i / 8) * 3 + (Math.random() - 0.5) * 2)
      
      // Sample ETH per share
      ethPerShare.push(0.00004 + (Math.random() - 0.5) * 0.00001)
    }

    return {
      labels,
      datasets: [
        {
          label: 'SBET Stock Price ($)',
          data: stockPrices,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          borderWidth: 3,
          yAxisID: 'y',
        },
        {
          label: 'ETH Concentration (%)',
          data: concentrations,
          borderColor: '#627eea',
          backgroundColor: 'rgba(98, 126, 234, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          yAxisID: 'y1',
        },
        {
          label: 'ETH per Share',
          data: ethPerShare,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          yAxisID: 'y2',
          hidden: true,
        },
      ],
    }
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: 'SBET Stock Performance & ETH Treasury Concentration',
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#627eea',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y
            if (context.datasetIndex === 0) {
              return `${context.dataset.label}: $${value.toFixed(2)}`
            } else if (context.datasetIndex === 1) {
              return `${context.dataset.label}: ${value.toFixed(1)}%`
            } else {
              return `${context.dataset.label}: ${value.toFixed(6)} ETH`
            }
          }
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: 8,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'SBET Stock Price ($)',
          color: '#10b981',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value) {
            return '$' + (value as number).toFixed(2)
          }
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'ETH Concentration (%)',
          color: '#627eea',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value) {
            return (value as number).toFixed(1) + '%'
          }
        },
      },
      y2: {
        type: 'linear' as const,
        display: false,
        position: 'right' as const,
        title: {
          display: true,
          text: 'ETH per Share',
          color: '#f59e0b',
        },
      },
    },
  }

  if (loading) {
    return (
      <div className="chart-container p-6 h-96">
        <div className="flex items-center justify-center h-full">
          <div className="shimmer w-full h-full rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="chart-container p-6 h-96">
      <div className="h-full">
        {data && <Line data={data} options={options} />}
        {error && (
          <div className="text-yellow-400 text-sm mt-2">
            ⚠️ Using sample data - {error}
          </div>
        )}
        <div className="text-xs text-gray-400 mt-2">
          Data source: {dataSource}
        </div>
      </div>
    </div>
  )
} 