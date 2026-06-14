'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Gift, Plus, Trash2, Store, MapPin, Phone, RefreshCw } from 'lucide-react'

interface Venue {
  id: string
  name: string
  address: string
  contact: string
  sachets_current: number
  sachets_target: number
  last_reorder: string | null
  notes: string
}

function Nav() {
  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center"><Gift className="w-5 h-5 text-white" /></div>
        <span className="font-semibold text-lg">Articulix</span>
      </div>
      <div className="flex gap-1">
        {[['/', 'Dashboard'], ['/models', 'Stock'], ['/venues', 'Points de vente'], ['/reorders', 'Réassorts'], ['/sachets', 'Sachets']].map(([href, label]) => (
          <Link key={href} href={href} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">{label}</Link>
        ))}
      </div>
    </nav>
  )
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', contact: '', sachets_target: 80, notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('venues').select('*').order('name')
    setVenues(data || [])
    setLoading(false)
  }

  async function addVenue() {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('venues').insert({ ...form, sachets_current: 0 })
    setForm({ name: '', address: '', contact: '', sachets_target: 80, notes: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function updateSachets(id: string, delta: number) {
    const v = venues.find(v => v.id === id)!
    const val = Math.max(0, v.sachets_current + delta)
    await supabase.from('venues').update({ sachets_current: val }).eq('id', id)
    setVenues(prev => prev.map(v => v.id === id ? { ...v, sachets_current: val } : v))
  }

  async function deleteVenue(id: string) {
    if (!confirm('Supprimer ce point de vente ?')) return
    await supabase.from('venues').delete().eq('id', id)
    setVenues(prev => prev.filter(v => v.id !== id))
  }

  function stockLevel(v: Venue) {
    const ratio = v.sachets_current / v.sachets_target
    if (ratio < 0.25) return 'urgent'
    if (ratio < 0.5) return 'low'
    return 'ok'
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Points de vente</h1>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark flex items-center gap-1">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h2 className="font-medium mb-4">Nouveau point de vente</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Nom *</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex : Intermarché Châteauroux" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Adresse</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Adresse" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Contact</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Nom / téléphone" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Objectif sachets par réassort</label>
                <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.sachets_target} onChange={e => setForm(f => ({ ...f, sachets_target: +e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Notes</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Infos utiles..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Annuler</button>
              <button onClick={addVenue} disabled={saving || !form.name.trim()} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-gray-400 text-sm">Chargement...</div>
        ) : venues.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <Store className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun point de vente. Ajoutez votre premier Intermarché !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {venues.map(v => {
              const level = stockLevel(v)
              const pct = Math.min(100, Math.round((v.sachets_current / v.sachets_target) * 100))
              return (
                <div key={v.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="font-semibold text-base">{v.name}</h2>
                      {v.address && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{v.address}</p>}
                      {v.contact && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{v.contact}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/reorders?venue=${v.id}`} className="text-xs px-3 py-1.5 bg-brand-light text-brand-dark rounded-lg hover:bg-brand hover:text-white transition-colors flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Réassort
                      </Link>
                      <button onClick={() => deleteVenue(v.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Sachets en rayon</span>
                        <span className={level === 'urgent' ? 'text-red-600 font-medium' : level === 'low' ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'}>
                          {v.sachets_current} / {v.sachets_target}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${level === 'urgent' ? 'bg-red-400' : level === 'low' ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-1 items-center">
  <button onClick={() => updateSachets(v.id, -1)} className="w-7 h-7 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm">−</button>
  <input
    type="number"
    min="0"
    defaultValue={v.sachets_current}
    onBlur={async (e) => {
      const val = parseInt(e.target.value)
      if (!isNaN(val)) {
        await supabase.from('venues').update({ sachets_current: val }).eq('id', v.id)
        setVenues(prev => prev.map(venue => venue.id === v.id ? { ...venue, sachets_current: val } : venue))
      }
    }}
    className="w-14 text-center border border-gray-200 rounded-lg px-1 py-1 text-sm"
  />
  <button onClick={() => updateSachets(v.id, 1)} className="w-7 h-7 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm">+</button>
</div>
                  </div>
                  {v.last_reorder && <p className="text-xs text-gray-400 mt-2">Dernier réassort : {new Date(v.last_reorder).toLocaleDateString('fr-FR')}</p>}
                  {v.notes && <p className="text-xs text-gray-400 mt-1 italic">{v.notes}</p>}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
