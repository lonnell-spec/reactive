'use client'

/**
 * Pure utility functions for modal behavior
 * Following 80/20 testing principles - these are easily testable
 */

/**
 * Prevents body scroll when modal is open
 */
export function lockBodyScroll(): void {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden'
  }
}

/**
 * Restores body scroll when modal is closed
 */
export function unlockBodyScroll(): void {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
}

/**
 * Handles escape key press for modal closing
 */
export function handleEscapeKey(
  event: KeyboardEvent, 
  onClose: () => void
): void {
  if (event.key === 'Escape') {
    onClose()
  }
}

/**
 * Handles backdrop click for modal closing
 */
export function handleBackdropClick(
  event: React.MouseEvent<HTMLDivElement>,
  onClose: () => void
): void {
  // Only close if clicking the backdrop itself, not child elements
  if (event.target === event.currentTarget) {
    onClose()
  }
}

/**
 * Creates modal portal container if it doesn't exist
 */
export function getOrCreateModalRoot(): HTMLElement {
  if (typeof document === 'undefined') {
    throw new Error('Modal can only be used in browser environment')
  }
  
  let modalRoot = document.getElementById('modal-root')
  
  if (!modalRoot) {
    modalRoot = document.createElement('div')
    modalRoot.id = 'modal-root'
    document.body.appendChild(modalRoot)
  }
  
  return modalRoot
}
