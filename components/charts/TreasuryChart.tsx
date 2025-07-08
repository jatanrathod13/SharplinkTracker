'use client'

import React, { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface TreasuryChartProps {
  timeframe: string
}

export default function TreasuryChart({ timeframe }: TreasuryChartProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ChartData<'line'> | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Generate sample treasury data based on timeframe
        const now = new Date()
        const days = getTimeframeDays(timeframe)
        const labels: string[] = []
        const ethHoldingsData: number[] = []
        const treasuryValueData: number[] = []

        for (let i = days; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          labels.push(date.toLocaleDateString())
          
          // Sample ETH holdings (relatively stable, 1000-1200 ETH)
          const baseETH = 1100 + Math.sin(i / 30) * 50 + (Math.random() - 0.5) * 20
          ethHoldingsData.push(baseETH)
          
          // Sample treasury value (fluctuates with ETH price)
          const ethPrice = 2500 + Math.random() * 1000 + Math.sin(i / 15) * 500
          treasuryValueData.push(baseETH * ethPrice)
        }

        setData({
          labels,
          datasets: [
            {
              label: 'ETH Holdings',
              data: ethHoldingsData,
              borderColor: '#627eea',
              backgroundColor: 'rgba(98, 126, 234, 0.1)',
              yAxisID: 'y',
              tension: 0.4,
              borderWidth: 2,
            },
            {
              label: 'Treasury Value ($)',
              data: treasuryValueData,
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              yAxisID: 'y1',
              tension: 0.4,
              borderWidth: 3,
            },
          ],
        })
      } catch (error) {
        console.error('Error fetching treasury data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeframe])

  const getTimeframeDays = (timeframe: string): number => {
    switch (timeframe) {
      case '1D': return 1
      case '1W': return 7
      case '1M': return 30
      case '3M': return 90
      case '1Y': return 365
      default: return 30
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
        text: 'ETH Treasury Holdings & Value',
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
              return `${context.dataset.label}: ${value.toFixed(2)} ETH`
            } else {
              return `${context.dataset.label}: $${value.toLocaleString()}`
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
          text: 'ETH Holdings',
          color: '#627eea',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Treasury Value ($)',
          color: '#f59e0b',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value) {
            return '$' + (value as number).toLocaleString()
          }
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
      </div>
    </div>
  )
} 