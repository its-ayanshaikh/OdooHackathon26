import { useEffect, useRef, useState } from 'react'
import { MapPinned, TriangleAlert } from 'lucide-react'
import {
  loadGoogleMaps,
  hasMapsKey,
  MAP_STYLE_LIGHT,
  MAP_STYLE_DARK,
} from '../lib/googleMaps.js'

function RouteMap({ origin, destination, height = 320, onRoute }) {
  const mapRef = useRef(null)
  const [status, setStatus] = useState('loading') // loading | ok | error | no-key
  const [info, setInfo] = useState(null)

  // Keep the latest callback without re-running the map effect on every render.
  const onRouteRef = useRef(onRoute)
  onRouteRef.current = onRoute

  useEffect(() => {
    if (!hasMapsKey()) {
      setStatus('no-key')
      return
    }
    if (!origin || !destination) {
      setStatus('error')
      setInfo('Enter both a source and destination to preview the route.')
      return
    }

    let cancelled = false
    setStatus('loading')

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current) return
        const isDark = document.documentElement.classList.contains('dark')

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 20.5937, lng: 78.9629 }, // India
          zoom: 5,
          disableDefaultUI: true,
          zoomControl: true,
          styles: isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT,
        })

        const directionsService = new google.maps.DirectionsService()
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#f59e0b',
            strokeWeight: 5,
            strokeOpacity: 0.9,
          },
        })

        directionsService.route(
          {
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, dirStatus) => {
            if (cancelled) return
            if (dirStatus === 'OK') {
              directionsRenderer.setDirections(result)
              const leg = result.routes[0]?.legs[0]
              if (leg) {
                setInfo(`${leg.distance?.text} · ${leg.duration?.text}`)
                if (leg.distance?.value) {
                  onRouteRef.current?.({
                    km: Math.round(leg.distance.value / 1000),
                    distanceText: leg.distance.text,
                    durationText: leg.duration?.text,
                  })
                }
              }
              setStatus('ok')
            } else {
              setStatus('error')
              setInfo('Could not find a route between these locations.')
            }
          },
        )
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [origin, destination])

  if (status === 'no-key') {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50"
        style={{ height }}
      >
        <MapPinned size={26} className="text-slate-400" />
        <p className="font-medium">Google Maps key not configured</p>
        <p className="text-xs text-slate-400">
          Add <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">VITE_GOOGLE_MAPS_API_KEY</code> to
          <code className="ml-1 rounded bg-slate-200 px-1 dark:bg-slate-700">frontend/.env</code> and restart.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <div ref={mapRef} style={{ height, width: '100%' }} className="bg-slate-100 dark:bg-slate-800" />
      {info && (
        <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {status === 'error' ? (
            <TriangleAlert size={14} className="text-amber-500" />
          ) : (
            <MapPinned size={14} className="text-amber-500" />
          )}
          {info}
        </div>
      )}
    </div>
  )
}

export default RouteMap
