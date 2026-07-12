import { useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'
import { loadGoogleMaps } from '../lib/googleMaps.js'

// A text input enhanced with Google Places autocomplete.
// Degrades gracefully to a plain input if the Maps key is missing.
function PlacesAutocomplete({ value, onChange, placeholder }) {
  const inputRef = useRef(null)

  useEffect(() => {
    let autocomplete
    let cancelled = false

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !inputRef.current) return
        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'name', 'geometry'],
        })
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          const text = place?.formatted_address || place?.name || inputRef.current.value
          onChange(text)
        })
      })
      .catch(() => {
        // No key / load failed -> plain input still works.
      })

    return () => {
      cancelled = true
      if (autocomplete && window.google) {
        window.google.maps.event.clearInstanceListeners(autocomplete)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative">
      <MapPin
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
    </div>
  )
}

export default PlacesAutocomplete
