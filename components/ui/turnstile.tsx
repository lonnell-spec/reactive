'use client'

import { useEffect, useRef } from 'react'

// Extend Window interface to include turnstile
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileOptions) => string
      remove: (widgetId: string) => void
      reset: (widgetId: string) => void
      getResponse: (widgetId: string) => string | undefined
    }
    onTurnstileLoad?: () => void
  }
}

interface TurnstileOptions {
  sitekey: string
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'flexible' | 'compact'
  callback?: (token: string) => void
  'error-callback'?: (errorCode: string) => void
  'expired-callback'?: () => void
}

interface TurnstileProps {
  siteKey: string
  onSuccess: (token: string) => void
  onError?: (errorCode: string) => void
  onExpire?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'flexible' | 'compact'
}

export function Turnstile({
  siteKey,
  onSuccess,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal'
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const scriptLoadedRef = useRef(false)
  
  // Use refs for callbacks to avoid re-renders when they change
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const onExpireRef = useRef(onExpire)
  
  // Update refs when callbacks change
  useEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
    onExpireRef.current = onExpire
  }, [onSuccess, onError, onExpire])

  useEffect(() => {
    // Don't render if no site key provided
    if (!siteKey || siteKey === 'your-site-key-here' || !siteKey.trim()) {
      console.warn('Turnstile: No valid site key provided. Site key value:', siteKey)
      console.warn('NEXT_PUBLIC_CLOUDFLARE_SITE_KEY env var:', process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY)
      return
    }

    const loadTurnstileScript = () => {
      // Check if script already exists
      if (document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) {
        scriptLoadedRef.current = true
        renderWidget()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      
      script.onload = () => {
        scriptLoadedRef.current = true
        renderWidget()
      }

      script.onerror = () => {
        console.error('Turnstile: Failed to load script')
        onErrorRef.current?.('script-load-error')
      }

      document.head.appendChild(script)
    }

    const renderWidget = () => {
      // Wait for turnstile to be available
      if (!window.turnstile) {
        setTimeout(renderWidget, 100)
        return
      }

      // Only render if container exists and widget not already rendered
      if (containerRef.current && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            size,
            callback: (token: string) => onSuccessRef.current(token),
            'error-callback': (errorCode: string) => {
              console.error('Turnstile error:', errorCode)
              onErrorRef.current?.(errorCode)
            },
            'expired-callback': () => {
              console.warn('Turnstile token expired')
              onExpireRef.current?.()
            }
          })
        } catch (error) {
          console.error('Turnstile: Failed to render widget', error)
          onErrorRef.current?.('render-error')
        }
      }
    }

    loadTurnstileScript()

    // Cleanup on unmount
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        } catch (error) {
          console.error('Turnstile: Failed to remove widget', error)
        }
      }
    }
  }, [siteKey, theme, size]) // Only depend on stable props, not callbacks

  // Expose reset method via ref (could be extended if needed)
  useEffect(() => {
    // Store reset function for parent component access if needed
    const resetWidget = () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
      }
    }
    
    // Can be accessed by parent if we export this
    return () => {}
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="flex justify-center my-4"
      data-testid="turnstile-widget"
    />
  )
}
