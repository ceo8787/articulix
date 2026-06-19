'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface Venue {
  id: string
  name: string
}

interface Reorder {
  id: string
  venue_id: string
  sachets_count: number
  status: string
  planned_date: string
  created_at: string
  notes: string
}

const statusColors: Record<string, string> = {
  'planifié': 'bg-amber-50 text-amber-700',
  'préparé': 'bg-blue-50 text-blue-700',
  'livré': 'bg-green-50 text-green-700',
  'annulé': 'bg-gray-50 text-gray-500',
}

export default function HistoryPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [reorders, setReorders] = useState<Reorder[]>([])
  const [selectedVenue, setSelectedVenue] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: v }, { data: r }] = await Promise.all([
      supabase.from('venues').select('id, name').order('name'),
      supabase.from('reorders').select('*').order('created_at', { ascending: false })
    ])
    setVenues(v || [])
    setReorders(r || [])
    setLoading(false)
  }

  const filtered = reorders.filter(r => selectedVenue === 'all' || r.venue_id === selectedVenue)

  const byVenue = venues.reduce((acc, v) => {
    acc[v.id] = reorders.filter(r => r.venue_id === v.id)
    return acc
  }, {} as Record<string, Reorder[]>)

  const totalLivre = filtered.filter(r => r.status === 'livré').reduce((acc, r) => acc + r.sachets_count, 0)
  const totalCA = totalLivre * 5

  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-6">Historique des réassorts</h1>

        <div className="flex gap-3 mb-6 flex-wrap">
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={selectedVenue} onChange={e => setSelectedVenue(e.target.value)}>
            <option value="all">Tous les points de vente</option>
            {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <div className="flex gap-3">
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-2 text-center">
              <div className="text-lg font-semibold text-green-600">{totalCA}€</div>
              <div className="text-xs text-gray-400">CA total livré</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-2 text-center">
              <div className="text-lg font-semibold">{totalLivre}</div>
              <div className="text-xs text-gray-400">Sachets livrés</div>
            </div>
          </div>
        </div>

        {loading ? <div className="text-gray-400 text-sm">Chargement...</div> : selectedVenue === 'all' ? (
          <div className="space-y-4">
            {venues.map(v => {
              const vReorders = byVenue[v.id] || []
              const isExpanded = expanded[v.id]
              const livres = vReorders.filter(r => r.status === 'livré').reduce((acc, r) => acc + r.sachets_count, 0)
              return (
                <div key={v.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors" onClick={() => setExpanded(prev => ({ ...prev, [v.id]: !prev[v.id] }))}>
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{v.name}</span>
                      <span className="text-xs text-gray-400">{vReorders.length} réassort(s)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-green-600">{livres * 5}€</span>
                      <span className="text-xs text-gray-400">{livres} sachets livrés</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-gray-50">
                      {vReorders.length === 0 ? (
                        <p className="text-sm text-gray-400 p-4">Aucun réassort pour ce point de vente.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-gray-500 text-xs">
                            <tr>
                              <th className="text-left px-4 py-2">Date</th>
                              <th className="text-right px-4 py-2">Sachets</th>
                              <th className="text-right px-4 py-2">CA</th>
                              <th className="text-center px-4 py-2">Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vReorders.map(r => (
                              <tr key={r.id} className="border-t border-gray-50">
                                <td className="px-4 py-2 text-gray-600">{new Date(r.created_at).toLocaleDateString('fr-FR')}{r.planned_date && ` → prévu ${new Date(r.planned_date).toLocaleDateString('fr-FR')}`}</td>
                                <td className="px-4 py-2 text-right font-medium">{r.sachets_count}</td>
                                <td className="px-4 py-2 text-right text-green-600 font-medium">{r.status === 'livré' ? `${r.sachets_count * 5}€` : '—'}</td>
                                <td className="px-4 py-2 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[r.status] || 'bg-gray-50 text-gray-500'}`}>{r.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 p-8 text-center">Aucun réassort pour ce point de vente.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3">Date création</th>
                    <th className="text-left px-4 py-3">Date prévue</th>
                    <th className="text-right px-4 py-3">Sachets</th>
                    <th className="text-right px-4 py-3">CA</th>
                    <th className="text-center px-4 py-3">Statut</th>
                    <th className="text-left px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-600">{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3 text-gray-600">{r.planned_date ? new Date(r.planned_date).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold">{r.sachets_count}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-semibold">{r.status === 'livré' ? `${r.sachets_count * 5}€` : '—'}</td>
                      <td className="px-4 py-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[r.status] || 'bg-gray-50 text-gray-500'}`}>{r.status}</span></td>
                      <td className="px-4 py-3 text-gray-400 text-xs italic">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
