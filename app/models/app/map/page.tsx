'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, Store } from 'lucide-react'

interface Venue {
  id: string
  name: string
  address: string
  sachets_current: number
  sachets_target: number
  portecles_current: number
  portecles_target: number
  contact: string
}

interface GeoVenue extends Venue {
  lat: number
  lng: number
}

export default function MapPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [geoVenues, setGeoVenues] = useState<GeoVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [geocoding, setGeocoding] = useState(false)
  const [selected, setSelected] = useState<GeoVenue | null>(null)
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('venues').select('*').order('name')
    setVenues(data || [])
    setLoading(false)
    if (data && data.length > 0) {
      geocodeAll(data)
    }
  }

  async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`)
      const data = await res.json()
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      }
    } catch (e) {}
    return null
  }

  async function geocodeAll(venueList: Venue[]) {
    setGeocoding(true)
    const results: GeoVenue[] = []
    for (const v of venueList) {
      if (!v.address) continue
      const coords = await geocodeAddress(v.address)
      if (coords) {
        results.push({ ...v, ...coords })
      }
      await new Promise(r => setTimeout(r, 300))
    }
    setGeoVenues(results)
    setGeocoding(false)
    initMap(results)
  }

  function initMap(points: GeoVenue[]) {
    if (typeof window === 'undefined' || !mapContainerRef.current) return

    const L = (window as any).L
    if (!L) return

    if (mapRef.current) {
      mapRef.current.remove()
    }

    const center = points.length > 0
      ? [points.reduce((s, p) => s + p.lat, 0) / points.length, points.reduce((s, p) => s + p.lng, 0) / points.length]
      : [46.2, 2.2]

    const map = L.map(mapContainerRef.current).setView(center, points.length > 0 ? 10 : 6)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map)

    points.forEach(v => {
      const sachetLevel = v.sachets_target > 0 ? (v.sachets_current / v.sachets_target) : 1
      const color = sachetLevel < 0.25 ? '#ef4444' : sachetLevel < 0.5 ? '#f59e0b' : '#22c55e'

      const icon = L.divIcon({
        html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      })

      const marker = L.marker([v.lat, v.lng], { icon }).addTo(map)
      marker.bindPopup(`
        <div style="font-family:sans-serif;min-width:180px">
          <div style="font-weight:600;margin-bottom:4px">${v.name}</div>
          <div style="font-size:12px;color:#666;margin-bottom:6px">${v.address}</div>
          <div style="font-size:12px">🎁 Sachets : <b>${v.sachets_current}/${v.sachets_target}</b></div>
          ${(v.portecles_target || 0) > 0 ? `<div style="font-size:12px">🔑 Porte-clés : <b>${v.portecles_current || 0}/${v.portecles_target}</b></div>` : ''}
          ${v.contact ? `<div style="font-size:12px;color:#666;margin-top:4px">📞 ${v.contact}</div>` : ''}
        </div>
      `)
      marker.on('click', () => setSelected(v))
    })
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).L) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => {
        if (geoVenues.length > 0) initMap(geoVenues)
      }
      document.head.appendChild(script)
    } else if (geoVenues.length > 0) {
      initMap(geoVenues)
    }
  }, [geoVenues])

  function stockLevel(current: number, target: number) {
    if (target === 0) return 'ok'
    const ratio = current / target
    if (ratio < 0.25) return 'urgent'
    if (ratio < 0.5) return 'low'
    return 'ok'
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-2">Carte des points de vente</h1>
        <p className="text-sm text-gray-500 mb-6">
          {geocoding ? 'Localisation des adresses en cours...' : `${geoVenues.length} point(s) de vente localisé(s)`}
        </p>

        {loading ? (
          <div className="text-gray-400 text-sm">Chargement...</div>
        ) : venues.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <Store className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun point de vente. Ajoutez-en depuis la page Points de vente !</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4" style={{ height: '450px' }}>
              {venues.filter(v => !v.address).length > 0 && (
                <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 text-xs text-amber-700">
                  ⚠️ {venues.filter(v => !v.address).length} point(s) sans adresse ne s'affiche(nt) pas sur la carte
                </div>
              )}
              <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
            </div>

            <div className="flex gap-3 mb-4 text-xs text-gray-500 items-center">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Stock OK</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span> Stock bas</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span> Urgent</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {venues.map(v => {
                const level = stockLevel(v.sachets_current || 0, v.sachets_target || 0)
                const isLocated = geoVenues.find(g => g.id === v.id)
                return (
                  <div key={v.id} className={`bg-white rounded-xl border p-4 flex items-center justify-between ${selected?.id === v.id ? 'border-brand' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${level === 'urgent' ? 'bg-red-400' : level === 'low' ? 'bg-amber-400' : 'bg-green-400'}`} />
                      <div>
                        <p className="font-medium text-sm">{v.name}</p>
                        {v.address ? <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{v.address}</p> : <p className="text-xs text-red-400">Pas d'adresse</p>}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div>🎁 {v.sachets_current}/{v.sachets_target} sachets</div>
                      {(v.portecles_target || 0) > 0 && <div>🔑 {v.portecles_current || 0}/{v.portecles_target} porte-clés</div>}
                      {!isLocated && v.address && <div className="text-amber-500">Localisation...</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

