'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from './button'
import { 
  lockBodyScroll, 
  unlockBodyScroll, 
  handleEscapeKey, 
  handleBackdropClick,
  getOrCreateModalRoot 
} from '@/lib/modal-utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

/**
 * Reusable Modal component with overlay, backdrop click, and escape key handling
 * Uses portal to render above all other content
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showCloseButton = true
}: ModalProps) {
  // Handle escape key and body scroll lock
  useEffect(() => {
    if (!isOpen) return

    // Lock body scroll when modal opens
    lockBodyScroll()

    // Handle escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      handleEscapeKey(event, onClose)
    }

    document.addEventListener('keydown', handleKeyDown)

    // Cleanup function
    return () => {
      unlockBodyScroll()
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Don't render if not open
  if (!isOpen) return null

  // Don't render on server
  if (typeof document === 'undefined') return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-600/50"
      onClick={(e) => handleBackdropClick(e, onClose)}
    >
      <div 
        className={`
          relative bg-white rounded-lg shadow-xl w-full max-h-[95vh] sm:max-h-[90vh]
          max-w-full sm:max-w-4xl overflow-y-auto transform transition-all duration-200 ease-out
          ${className}
        `}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking modal content
      >
        {/* Header with title and close button */}
        {(title || showCloseButton) && (
          <div className="sticky top-0 bg-black text-white px-4 sm:px-6 py-4 flex justify-between items-center rounded-t-lg">
            {title && (
              <h2 className="text-lg sm:text-xl font-semibold truncate pr-4">{title}</h2>
            )}
            {showCloseButton && (
              <Button
                variant="outline"
                size="sm"
                className="border-white text-white hover:bg-gray-800 flex-shrink-0"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
        
        {/* Modal content */}
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  )

  // Render in portal
  try {
    const modalRoot = getOrCreateModalRoot()
    return createPortal(modalContent, modalRoot)
  } catch (error) {
    // Fallback to inline rendering if portal fails
    return modalContent
  }
}

export default Modal
