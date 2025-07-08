'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  ChartData,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface NAVMultiplierChartProps {
  timeframe: string
}

export default function NAVMultiplierChart({ timeframe }: NAVMultiplierChartProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ChartData<'line'> | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Generate sample data based on timeframe
        const now = new Date()
        const days = getTimeframeDays(timeframe)
        const labels: string[] = []
        const navData: number[] = []
        const ethData: number[] = []

        for (let i = days; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          labels.push(date.toLocaleDateString())
          
          // Sample NAV multiplier data (1.0 to 1.5x)
          navData.push(1.0 + Math.random() * 0.5 + Math.sin(i / 10) * 0.1)
          
          // Sample ETH price data ($2000 to $3500)
          ethData.push(2500 + Math.random() * 1000 + Math.sin(i / 15) * 500)
        }

        setData({
          labels,
          datasets: [
            {
              label: 'NAV Multiplier',
              data: navData,
              borderColor: '#627eea',
              backgroundColor: 'rgba(98, 126, 234, 0.1)',
              yAxisID: 'y',
              tension: 0.4,
            },
            {
              label: 'ETH Price ($)',
              data: ethData,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              yAxisID: 'y1',
              tension: 0.4,
            },
          ],
        })
      } catch (error) {
        console.error('Error fetching NAV data:', error)
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
        text: 'NAV Multiplier vs ETH Price',
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
          text: 'NAV Multiplier',
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
          text: 'ETH Price ($)',
          color: '#10b981',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#9ca3af',
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