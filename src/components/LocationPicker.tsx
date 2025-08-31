'use client'
import { useState, useEffect } from 'react'
import { MapPin, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface LocationPickerProps {
  value: string
  onChange: (location: string) => void
  placeholder?: string
}

export default function LocationPicker({ value, onChange, placeholder = "Enter location" }: LocationPickerProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)

  // Predefined common locations for demo purposes
  const commonLocations = [
    "Central Park, New York, NY",
    "Times Square, New York, NY", 
    "Golden Gate Park, San Francisco, CA",
    "Venice Beach, Los Angeles, CA",
    "Lincoln Park, Chicago, IL",
    "Boston Common, Boston, MA",
    "Millennium Park, Chicago, IL",
    "Balboa Park, San Diego, CA",
    "Discovery Green, Houston, TX",
    "Piedmont Park, Atlanta, GA"
  ]

  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      // For demo purposes, filter common locations
      // In production, you could use a geocoding service like Nominatim (free OpenStreetMap service)
      const filtered = commonLocations.filter(location =>
        location.toLowerCase().includes(query.toLowerCase())
      )
      
      // Add the current input as an option if it's not empty
      if (query.trim() && !filtered.some(loc => loc.toLowerCase() === query.toLowerCase())) {
        filtered.unshift(query.trim())
      }
      
      setSuggestions(filtered.slice(0, 5))
    } catch (error) {
      console.error('Error searching locations:', error)
      setSuggestions([query.trim()]) // Fallback to user input
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    searchLocations(newValue)
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          onChange(locationString)
          setShowSuggestions(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Unable to get your current location. Please enter manually.')
        }
      )
    } else {
      alert('Geolocation is not supported by this browser.')
    }
  }

  return (
    <div className="relative">
      <div className="flex">
        <div className="relative flex-1">
          <Input
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => value && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className="pr-10"
          />
          <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        </div>
        <Button
          type="button"
          onClick={handleCurrentLocation}
          variant="outline"
          className="ml-2 px-3"
          title="Use current location"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}