"use client"

import { useState, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Multi-select dropdown component that stores selections as comma-separated string
 * 
 * This component manages multiple selections and stores them as a single string
 * with comma-space separation (e.g., "08:00 AM, 10:30 AM, 01:00 PM").
 * 
 * This approach avoids database schema changes while supporting multi-selection,
 * as the value can be stored directly in a text column.
 */
interface MultiSelectCommaSeparatedDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  error?: boolean;
  placeholder?: string;
  className?: string;
}

export const MultiSelectCommaSeparatedDropdown = ({ 
  value, 
  onChange, 
  options, 
  error,
  placeholder = 'Select option(s)',
  className = ''
}: MultiSelectCommaSeparatedDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  /**
   * Parse comma-separated string into array of selected items
   * @param val - Comma-separated string (e.g., "option1, option2")
   * @returns Array of selected items
   */
  const parseToArray = (val: string): string[] => {
    if (!val) return [];
    return val.split(', ').filter(Boolean);
  };
  
  const selectedItems = parseToArray(value);
  
  /**
   * Toggle selection of an item
   * Converts between comma-separated string and array for manipulation
   * @param item - The item to toggle in the selection
   */
  const handleItemToggle = useCallback((item: string) => {
    const currentSelected = parseToArray(value);
    const newSelected = currentSelected.includes(item)
      ? currentSelected.filter(i => i !== item)
      : [...currentSelected, item];
    
    // Join back to comma-separated string
    const joinedValue = newSelected.join(', ');
    onChange(joinedValue);
  }, [value, onChange]);
  
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border-2 rounded-md px-3 py-2 text-base bg-white ${
          error 
            ? 'border-red-500 focus:border-red-600' 
            : 'border-gray-300 focus:border-red-600'
        } focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2`}
      >
        <span className={selectedItems.length === 0 ? 'text-gray-500' : 'text-black'}>
          {selectedItems.length === 0 
            ? placeholder
            : selectedItems.join(', ')
          }
        </span>
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="py-1">
              {options.map((item) => {
                const isSelected = selectedItems.includes(item);
                
                return (
                  <div 
                    key={item} 
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemToggle(item);
                    }}
                  >
                    {/* Visual checkbox - not interactive, just for display */}
                    <div 
                      className={`h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center ${
                        isSelected 
                          ? 'bg-red-600 border-red-600' 
                          : 'border-gray-400'
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-base flex-1">
                      {item}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

