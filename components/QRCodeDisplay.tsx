'use client'

import React, { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeDisplayProps {
  value: string
  size?: number
  className?: string
  guestInfo?: {
    firstName: string
    lastName: string
  }
  showDirections?: boolean
}

export function QRCodeDisplay({ value, size = 150, className = '', guestInfo, showDirections = false }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) {
          console.error('QR Code generation error:', error)
        }
      })
    }
  }, [value, size])

  if (!value) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500 text-sm">No QR Code</span>
      </div>
    )
  }

  return (
    <div className={className}>
      <canvas 
        ref={canvasRef}
        className="border border-gray-200"
      />
      
      {showDirections && guestInfo && (
        <div className="mt-6 bg-gray-50 border border-gray-200 p-6 rounded-lg text-left">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-black mb-2">
              Welcome {guestInfo.firstName} {guestInfo.lastName}!
            </h3>
          </div>
          
          <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
            <p>
              Welcome to 2819 Church! We're excited to have you join us for a transformative experience. 
              Please follow these quick steps for a smooth arrival:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-xs font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                <p>Head to the <strong>X Lot</strong> in front of our building at <strong>3350 Greenbriar Parkway, Atlanta, GA 30331</strong>.</p>
              </div>
              
              <div className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-xs font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                <p>Do <strong>NOT</strong> use the main gate. Instead, turn on your <strong>hazard lights</strong> as you approach X Lot to signal our team.</p>
              </div>
              
              <div className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-xs font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                <p>Have your <strong>QR code</strong> (above) ready for our Guest Relations team to ensure quick access to parking and entry.</p>
              </div>
            </div>
            
            <p>
              Once parked, we'll guide you through check-in and make you feel right at home. 
              Whether it's your first visit or a return, we're here to serve with excellence and help you have an unforgettable experience.
            </p>
            
            <div className="bg-white border border-gray-300 p-4 rounded-lg">
              <p className="font-bold text-black mb-1">Questions?</p>
              <p>Reach us at <strong>demetria@2819church.org</strong> or <strong>678-262-8386</strong></p>
            </div>
            
            <p className="text-center font-bold text-red-600">
              We can't wait to welcome you!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
