'use client'

import React from 'react'
import Image from 'next/image'
import { useChildPhotoUrl } from '@/hooks/useChildPhotoUrl'

interface ChildPhotoProps {
  photoPath: string | null
  alt: string
  width: number
  height: number
  className?: string
}

export function ChildPhoto({ 
  photoPath,
  alt, 
  width, 
  height, 
  className = "object-cover" 
}: ChildPhotoProps) {
  const { url, loading } = useChildPhotoUrl(photoPath)

  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 text-gray-500 text-xs animate-pulse ${className}`}
        style={{ width, height }}
      >
        Loading...
      </div>
    )
  }

  if (!url || !photoPath) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 text-gray-500 text-xs ${className}`}
        style={{ width, height }}
      >
        <svg 
          width={width * 0.6} 
          height={height * 0.6} 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className="text-gray-400"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
    )
  }

  return (
    <Image 
      src={url}
      alt={alt}
      width={width}
      height={height}
      className={className}
      quality={95}
      priority={false}
      sizes={`${width}px`}
      style={{
        objectFit: 'cover',
        objectPosition: 'center'
      }}
    />
  )
}
