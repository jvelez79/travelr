"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, MapPin, Loader2 } from "lucide-react"
import { useDestinationSearch } from "@/lib/explore/hooks"
import type { Coordinates } from "@/types/explore"

interface PlaceAutocompleteProps {
  value: string
  onChange: (value: string, coords?: Coordinates) => void
  placeholder?: string
  className?: string
  id?: string
  required?: boolean
}

export function PlaceAutocomplete({
  value,
  onChange,
  placeholder = "Buscar lugar...",
  className = "",
  id,
  required,
}: PlaceAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { suggestions, isLoading, search } = useDestinationSearch()

  // Sync input value with prop
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue) // Update parent with typed value

    if (newValue.length >= 2) {
      search(newValue)
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [onChange, search])

  // Handle selecting a suggestion
  const handleSelect = useCallback((suggestion: { mainText: string; description: string; placeId: string }) => {
    onChange(suggestion.mainText)
    setInputValue(suggestion.mainText)
    setIsOpen(false)
  }, [onChange])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [])

  const showResults = isOpen && inputValue.length >= 2

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="w-full h-12 pl-10 pr-10 bg-card border border-border rounded-md text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showResults && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.placeId}
                  type="button"
                  onClick={() => handleSelect(suggestion)}
                  className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{suggestion.mainText}</div>
                    <div className="text-xs text-muted-foreground truncate">{suggestion.description}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : !isLoading ? (
            <div className="py-6 text-center">
              <div className="text-sm text-muted-foreground">No se encontraron resultados para "{inputValue}"</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
