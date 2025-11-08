'use client'

import React from 'react'
import Image from 'next/image'

interface QRCodeDisplayProps {
  value: string // Base64 data URL of the QR code
  size?: number
  className?: string
  guestInfo?: {
    firstName: string
    lastName: string
  }
  showDirections?: boolean
}

/**
 * Component for displaying QR codes
 * Handles base64 data URLs from the qrcode package
 */
export function QRCodeDisplay({
  value,
  size = 200,
  className = '',
  guestInfo,
  showDirections = false
}: QRCodeDisplayProps) {
  if (!value) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 border-2 border-gray-300 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500 text-sm">No QR Code</span>
      </div>
    )
  }

  return (
    <div className={`text-center ${className}`}>
      <div 
        className="inline-block border-2 border-gray-300 rounded-lg p-2 bg-white"
        style={{ width: size + 16, height: size + 16 }}
      >
        <Image
          src={value}
          alt={`QR Code${guestInfo ? ` for ${guestInfo.firstName} ${guestInfo.lastName}` : ''}`}
          width={size}
          height={size}
          className="rounded"
          style={{ width: size, height: size }}
        />
      </div>
    </div>
  )
}