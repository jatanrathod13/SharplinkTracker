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

interface PerformanceChartProps {
  timeframe: string
}

export default function PerformanceChart({ timeframe }: PerformanceChartProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ChartData<'line'> | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Generate sample performance data based on timeframe
        const now = new Date()
        const days = getTimeframeDays(timeframe)
        const labels: string[] = []
        const sharplinkData: number[] = []
        const ethData: number[] = []

        let sharplinkBase = 100
        let ethBase = 100

        for (let i = days; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          labels.push(date.toLocaleDateString())
          
          // Sample Sharplink Gaming performance (more volatile)
          sharplinkBase *= (1 + (Math.random() - 0.5) * 0.05 + Math.sin(i / 20) * 0.02)
          sharplinkData.push(sharplinkBase)
          
          // Sample ETH performance (less volatile)
          ethBase *= (1 + (Math.random() - 0.5) * 0.03 + Math.sin(i / 15) * 0.015)
          ethData.push(ethBase)
        }

        setData({
          labels,
          datasets: [
            {
              label: 'Sharplink Gaming',
              data: sharplinkData,
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              tension: 0.4,
              borderWidth: 3,
            },
            {
              label: 'Direct ETH Investment',
              data: ethData,
              borderColor: '#627eea',
              backgroundColor: 'rgba(98, 126, 234, 0.1)',
              tension: 0.4,
              borderWidth: 2,
              borderDash: [5, 5],
            },
          ],
        })
      } catch (error) {
        console.error('Error fetching performance data:', error)
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
        text: 'Performance Comparison (Normalized to 100)',
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
        borderColor: '#8b5cf6',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y.toFixed(2)
            const change = ((context.parsed.y - 100) / 100 * 100).toFixed(1)
            const changeNum = parseFloat(change)
            return `${context.dataset.label}: ${value} (${changeNum > 0 ? '+' : ''}${change}%)`
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
        display: true,
        title: {
          display: true,
          text: 'Performance Index',
          color: '#ffffff',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value) {
            return value + ''
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