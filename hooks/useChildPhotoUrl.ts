'use client'

import { useState, useEffect } from 'react'
import { getChildPhotoUrl } from '@/lib/storage'

export function useChildPhotoUrl(photoPath: string | null) {
  const [url, setUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!photoPath) {
      setUrl('')
      return
    }

    setLoading(true)
    
    // Call the server action to get the signed URL
    getChildPhotoUrl(photoPath)
      .then(signedUrl => {
        setUrl(signedUrl)
      })
      .catch(error => {
        setUrl('')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [photoPath])

  return { url, loading }
}
