'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, RefreshCw, CheckCircle, Clock, Truck } from 'lucide-react'

interface Reorder {
  id: string
  venue_id: string
  sachets_count: number
  status: 'planifié' | 'préparé' | 'livré'
  notes: string
  created_at: string
  planned_date: string
  venues?: { name: string }
}

interface Venue {
  id: string
  name: string
}

const statusConfig = {
  'planifié': { icon: Clock, color: 'bg-amber-50 text-amber-700', label: 'Planifié' },
  'préparé': { icon: Truck, color: 'bg-blue-50 text-blue-700', label: 'Préparé' },
  'livré': { icon: CheckCircle, color: 'bg-green-50 text-green-700', label: 'Livré' },
}

async function enregistrerCA(sachetsCount: number) {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const revenue = sachetsCount * 5
  const { data: existing } = await supabase
    .from('monthly_revenue')
    .select('*')
    .eq('month', month)
    .eq('year', year)
    .single()
  if (existing) {
    await supabase.from('monthly_revenue').update({
      sachets_sold: existing.sachets_sold + sachetsCount,
      revenue: existing.revenue + revenue
    }).eq('id', existing.id)
  } else {
    await supabase.from('monthly_revenue').insert({ month, year, sachets_sold: sachetsCount, revenue })
  }
}

function ReordersContent() {
  const searchParams = useSearchParams()
  const [reorders, setReorders] = useState<Reorder[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    venue_id: searchParams.get('venue') || '',
    sachets_count: 80,
    planned_date: '',
    notes: '',
    status: 'planifié' as const
  })
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    load()
    if (searchParams.get('venue')) setShowForm(true)
  }, [])

  async function load() {
    const [{ data: r }, { data: v }] = await Promise.all([
      supabase.from('reorders').select('*, venues(name)').order('created_at', { ascending: false }),
      supabase.from('venues').select('id, name').order('name')
    ])
    setReorders(r || [])
    setVenues(v || [])
    setLoading(false)
  }

  async function addReorder() {
    if (!form.venue_id) return
    setSaving(true)
    await supabase.from('reorders').insert(form)
    setForm({ venue_id: '', sachets_count: 80, planned_date: '', notes: '', status: 'planifié' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function updateStatus(id: string, status: Reorder['status']) {
    const r = reorders.find(r => r.id === id)!
    await supabase.from('reorders').update({ status }).eq('id', id)
    if (status === 'livré') {
      await supabase.from('venues').update({
        last_reorder: new Date().toISOString(),
        sachets_current: r.sachets_count
      }).eq('id', r.venue_id)
      await enregistrerCA(r.sachets_count)
    }
    setReorders(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const filtered = reorders.filter(r => filterStatus === 'all' || r.status === filterStatus)

  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Réassorts</h1>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark flex items-center gap-1">
            <Plus className="w-4 h-4" /> Planifier
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h2 className="font-medium mb-4">Nouveau réassort</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Point de vente *</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.venue_id} onChange={e => setForm(f => ({ ...f, venue_id: e.target.value }))}>
                  <option value="">Choisir...</option>
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nombre de sachets</label>
                <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.sachets_count} onChange={e => setForm(f => ({ ...f, sachets_count: +e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date prévue</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.planned_date} onChange={e => setForm(f => ({ ...f, planned_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Notes</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Annuler</button>
              <button onClick={addReorder} disabled={saving || !form.venue_id} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          {['all', 'planifié', 'préparé', 'livré'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s === 'all' ? 'Tous' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun réassort.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => {
              const cfg = statusConfig[r.status]
              const Icon = cfg.icon
              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold">{r.venues?.name}</h2>
                      <p className="text-sm text-gray-500 mt-0.5">{r.sachets_count} sachets
                        {r.planned_date && <span> — prévu le {new Date(r.planned_date).toLocaleDateString('fr-FR')}</span>}
                      </p>
                      {r.notes && <p className="text-xs text-gray-400 mt-1 italic">{r.notes}</p>}
                      <p className="text-xs text-gray-300 mt-1">{new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${cfg.color}`}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </span>
                      <div className="flex gap-1">
                        {r.status === 'planifié' && (
                          <button onClick={() => updateStatus(r.id, 'préparé')} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">Marquer préparé</button>
                        )}
                        {r.status === 'préparé' && (
                          <button onClick={() => updateStatus(r.id, 'livré')} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">Marquer livré ✓</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default function ReordersPage() {
  return <Suspense fallback={<div className="p-8 text-gray-400">Chargement...</div>}><ReordersContent /></Suspense>
}
