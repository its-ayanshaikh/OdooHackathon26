// Loads the Google Maps JS API (Places + Directions) once and caches the promise.

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
let loadPromise = null

export const hasMapsKey = () => Boolean(KEY)

export function loadGoogleMaps() {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google)
  }
  if (!KEY) {
    return Promise.reject(new Error('missing-key'))
  }
  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places&loading=async`
      script.async = true
      script.defer = true
      script.onload = () => resolve(window.google)
      script.onerror = () => {
        loadPromise = null
        reject(new Error('load-failed'))
      }
      document.head.appendChild(script)
    })
  }
  return loadPromise
}

// ---- Themed map styles (subtle, matches the SaaS UI) ----
export const MAP_STYLE_LIGHT = [
  { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f8fafc' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#cbd5e1' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] },
]

export const MAP_STYLE_DARK = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c1a33' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#111c31' }] },
]
