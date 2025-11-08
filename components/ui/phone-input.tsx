import React, { forwardRef, useRef, useImperativeHandle } from 'react'
import { Input } from './input'
import { formatPhoneNumber, getFormattedCursorPosition } from '@/lib/phone-utils'

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  name?: string
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)
    
    useImperativeHandle(ref, () => inputRef.current!, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target
      const newValue = input.value
      const cursorPosition = input.selectionStart || 0
      
      // Get just the digits from the new value
      const digits = newValue.replace(/\D/g, '')
      
      // Don't allow more than 10 digits
      if (digits.length > 10) {
        return
      }
      
      // Format the digits
      const formattedValue = formatPhoneNumber(digits)
      
      // Count how many digits were before the cursor
      const digitsBefore = newValue.slice(0, cursorPosition).replace(/\D/g, '').length
      
      // Update the value
      onChange(formattedValue)
      
      // Calculate new cursor position
      setTimeout(() => {
        if (inputRef.current) {
          let newCursorPos = 0
          let digitCount = 0
          
          for (let i = 0; i < formattedValue.length; i++) {
            if (/\d/.test(formattedValue[i])) {
              digitCount++
              if (digitCount === digitsBefore + 1) {
                newCursorPos = i + 1
                break
              }
            }
          }
          
          // If we haven't found the position yet, put cursor at end
          if (newCursorPos === 0) {
            newCursorPos = formattedValue.length
          }
          
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow control keys: backspace, delete, tab, escape, enter, arrows
      const controlKeys = [8, 9, 27, 13, 46, 37, 38, 39, 40]
      if (controlKeys.includes(e.keyCode)) {
        return
      }
      
      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
      if (e.ctrlKey && [65, 67, 86, 88, 90].includes(e.keyCode)) {
        return
      }
      
      // Only allow digits
      if (!/\d/.test(e.key)) {
        e.preventDefault()
      }
    }

    return (
      <Input
        {...props}
        ref={inputRef}
        type="tel"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="(555) 123-4567"
        maxLength={14} // (123) 456-7890 = 14 characters
      />
    )
  }
)

PhoneInput.displayName = 'PhoneInput'
