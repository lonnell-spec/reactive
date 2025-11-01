'use client'

import { useState, useEffect } from 'react'
import { getProfilePicUrl } from '@/lib/storage'

export function useProfilePicUrl(profilePath: string | null) {
  const [url, setUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!profilePath) {
      setUrl('')
      return
    }

    setLoading(true)
    
    // Call the server action to get the signed URL
    getProfilePicUrl(profilePath)
      .then(signedUrl => {
        setUrl(signedUrl)
      })
      .catch(error => {
        setUrl('')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [profilePath])

  return { url, loading }
}
