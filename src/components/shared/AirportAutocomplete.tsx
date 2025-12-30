"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Plane, ChevronDown } from "lucide-react"
import { searchAirports, findAirportByIATA, formatAirport, type Airport } from "@/lib/flights/airports"

interface AirportAutocompleteProps {
  value: string // IATA code
  onChange: (iata: string, airport?: Airport) => void
  placeholder?: string
  className?: string
  id?: string
  required?: boolean
  label?: string
  allowManualEntry?: boolean // Allow any 3-letter code even if not in dataset
}

export function AirportAutocomplete({
  value,
  onChange,
  placeholder = "Buscar aeropuerto...",
  className = "",
  id,
  required,
  allowManualEntry = true,
}: AirportAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get suggestions based on input
  const suggestions = useMemo(() => {
    if (inputValue.length < 2) return []
    return searchAirports(inputValue, 8)
  }, [inputValue])

  // Initialize input value from IATA code prop
  useEffect(() => {
    if (value) {
      const airport = findAirportByIATA(value)
      if (airport) {
        setInputValue(formatAirport(airport))
      } else if (value.length === 3) {
        // Manual entry - show just the code
        setInputValue(value.toUpperCase())
      }
    } else {
      setInputValue("")
    }
  }, [value])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setHighlightedIndex(0)

    if (newValue.length >= 2) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }

    // If user clears the input, clear the value
    if (newValue === "") {
      onChange("")
    }
  }, [onChange])

  // Handle selecting an airport
  const handleSelect = useCallback((airport: Airport) => {
    onChange(airport.iata, airport)
    setInputValue(formatAirport(airport))
    setIsOpen(false)
    setHighlightedIndex(0)
  }, [onChange])

  // Handle blur - validate manual entry
  const handleBlur = useCallback(() => {
    // Delay to allow click on dropdown items
    setTimeout(() => {
      if (!isOpen) return

      // Check if the input is a valid IATA code (3 uppercase letters)
      const trimmed = inputValue.trim().toUpperCase()

      if (allowManualEntry && /^[A-Z]{3}$/.test(trimmed)) {
        // Check if it matches a known airport
        const airport = findAirportByIATA(trimmed)
        if (airport) {
          onChange(airport.iata, airport)
          setInputValue(formatAirport(airport))
        } else {
          // Accept as manual entry
          onChange(trimmed)
          setInputValue(trimmed)
        }
      }

      setIsOpen(false)
    }, 200)
  }, [isOpen, inputValue, allowManualEntry, onChange])

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

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" && inputValue.length >= 2) {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0))
        break
      case "Enter":
        e.preventDefault()
        if (suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex])
        } else if (allowManualEntry) {
          // Try to use as manual entry
          const trimmed = inputValue.trim().toUpperCase()
          if (/^[A-Z]{3}$/.test(trimmed)) {
            const airport = findAirportByIATA(trimmed)
            if (airport) {
              onChange(airport.iata, airport)
              setInputValue(formatAirport(airport))
            } else {
              onChange(trimmed)
              setInputValue(trimmed)
            }
            setIsOpen(false)
          }
        }
        break
      case "Escape":
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }, [isOpen, suggestions, highlightedIndex, handleSelect, inputValue, allowManualEntry, onChange])

  const showResults = isOpen && inputValue.length >= 2

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= 2 && setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="w-full h-10 pl-10 pr-8 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Dropdown */}
      {showResults && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[280px] overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((airport, index) => (
                <button
                  key={airport.iata}
                  type="button"
                  onClick={() => handleSelect(airport)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full px-3 py-2.5 flex items-center gap-3 transition-colors text-left ${
                    index === highlightedIndex ? "bg-accent" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="w-10 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{airport.iata}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{airport.city}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {airport.name} · {airport.country}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-4 px-3 text-center">
              <div className="text-sm text-muted-foreground">
                No se encontraron aeropuertos para "{inputValue}"
              </div>
              {allowManualEntry && (
                <div className="text-xs text-muted-foreground mt-1">
                  Puedes escribir un código IATA de 3 letras directamente
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
