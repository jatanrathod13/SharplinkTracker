import React from 'react'

interface EthereumIconProps {
  className?: string
  size?: number
}

export default function EthereumIcon({ className = '', size = 24 }: EthereumIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Official Ethereum Diamond Logo */}
      <g>
        <path
          d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z"
          fill="currentColor"
          opacity="0.1"
        />
        <path
          d="M15.9943 4L15.7324 4.89453V20.0557L15.9943 20.3164L23.1885 16.3379L15.9943 4Z"
          fill="currentColor"
          opacity="0.602"
        />
        <path
          d="M15.9943 4L8.80078 16.3379L15.9943 20.3164V12.6523V4Z"
          fill="currentColor"
          opacity="0.8"
        />
        <path
          d="M15.9943 21.9043L15.8574 22.0693V27.3164L15.9943 27.6875L23.1943 17.9297L15.9943 21.9043Z"
          fill="currentColor"
          opacity="0.602"
        />
        <path
          d="M15.9943 27.6875V21.9043L8.80078 17.9297L15.9943 27.6875Z"
          fill="currentColor"
          opacity="0.8"
        />
        <path
          d="M15.9943 20.3164L23.1885 16.3379L15.9943 12.6523V20.3164Z"
          fill="currentColor"
          opacity="0.2"
        />
        <path
          d="M8.80078 16.3379L15.9943 20.3164V12.6523L8.80078 16.3379Z"
          fill="currentColor"
          opacity="0.602"
        />
      </g>
    </svg>
  )
} 