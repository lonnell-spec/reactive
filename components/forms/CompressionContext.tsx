'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface CompressionContextType {
  isAnyCompressing: boolean
  setProfileCompressing: (compressing: boolean) => void
  setChildCompressing: (index: number, compressing: boolean) => void
}

const CompressionContext = createContext<CompressionContextType | undefined>(undefined)

export function CompressionProvider({ children }: { children: ReactNode }) {
  const [profileCompressing, setProfileCompressing] = useState(false)
  const [childCompressions, setChildCompressions] = useState<Record<number, boolean>>({})

  const isAnyCompressing = profileCompressing || Object.values(childCompressions).some(Boolean)

  const setChildCompressing = (index: number, compressing: boolean) => {
    setChildCompressions(prev => ({
      ...prev,
      [index]: compressing
    }))
  }

  return (
    <CompressionContext.Provider value={{
      isAnyCompressing,
      setProfileCompressing,
      setChildCompressing
    }}>
      {children}
    </CompressionContext.Provider>
  )
}

export function useCompression() {
  const context = useContext(CompressionContext)
  if (context === undefined) {
    throw new Error('useCompression must be used within a CompressionProvider')
  }
  return context
}
