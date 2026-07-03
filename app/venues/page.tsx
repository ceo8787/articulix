'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Store, MapPin, Phone, RefreshCw, Pencil, X, Check, ShoppingBag } from 'lucide-react'

interface Venue {
  id: string
  name: string
  address: string
  contact: string
  sachets_current: number
  sachets_target: number
  portecles_current: number
  portecles_target: number
  last_reorder: string | null
  notes: string
  reorder_day: number
}

function daysUntilReorder(day: number) {
  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), day)
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, day)
  const target = thisMonth >= today ? thisMonth : nextMonth
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

async function enregistrerCAPortecles(venueId: string, qty: number) {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const revenue = qty * 2.5
  const { data: existing } = await supabase
    .from('monthly_revenue')
    .select('*')
    .eq('month', month)
    .eq('year', year)
    .single()
  if (existing) {
    await supabase.from('monthly_revenue').update({
      sachets_sold: existing.sachets_sold,
      revenue: existing.revenue + revenue
    }).eq('id', existing.id)
  } else {
    await supabase.from('monthly_revenue').insert({ month, year, sachets_sold: 0, revenue })
  }
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', address: '', contact: '', sachets_target: 80, portecles_target: 0, notes: '', reorder_day: 1 })
  const [saving, setSaving] = useState(false)
  const [venteModal, setVenteModal] = useState<string | null>(null)
  const [venteQty, setVenteQty] = useState(0)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('venues').select('*').order('name')
    setVenues(data || [])
    setLoading(false)
  }

  function startEdit(v: Venue) {
    setEditId(v.id)
    setForm({ name: v.name, address: v.address, contact: v.contact, sachets_target: v.sachets_target, portecles_target: v.portecles_target || 0, notes: v.notes, reorder_day: v.reorder_day || 1 })
    setShowForm(true)
  }

  function cancelEdit() {
    setEditId(null)
    setShowForm(false)
    setForm({ name: '', address: '', contact: '', sachets_target: 80, portecles_target: 0, notes: '', reorder_day: 1 })
  }

  async function saveVenue() {
    if (!form.name.trim()) return
    setSaving(true)
    if (editId) {
      await supabase.from('venues').update(form).eq('id', editId)
    } else {
      await supabase.from('venues').insert({ ...form, sachets_current: 0, portecles_current: 0 })
    }
    cancelEdit()
    setSaving(false)
    load()
  }

  async function updateStock(id: string, field: 'sachets_current' | 'portecles_current', delta: number) {
    const v = venues.find(v => v.id === id)!
    const val = Math.max(0, (v[field] || 0) + delta)
    await supabase.from('venues').update({ [field]: val }).eq('id', id)
    setVenues(prev => prev.map(v => v.id === id ? { ...v, [field]: val } : v))
  }

  async function setStockDirect(id: string, field: 'sachets_current' | 'portecles_current', val: number) {
    if (isNaN(val)) return
    await supabase.from('venues').update({ [field]: val }).eq('id', id)
    setVenues(prev => prev.map(v => v.id === id ? { ...v, [field]: val } : v))
  }

  async function declarerVente(venueId: string) {
    if (venteQty <= 0) return
    const v = venues.find(v => v.id === venueId)!
    const newStock = Math.max(0, (v.portecles_current || 0) - venteQty)
    await supabase.from('venues').update({ portecles_current: newStock }).eq('id', venueId)
    await enregistrerCAPortecles(venueId, venteQty)
    setVenues(prev => prev.map(v => v.id === venueId ? { ...v, portecles_current: newStock } : v))
    alert(`${venteQty} porte-clés vendus enregistrés ! CA : ${(venteQty * 2.5).toFixed(2)}€`)
    setVenteModal(null)
    setVenteQty(0)
  }

  async function deleteVenue(id: string) {
    if (!confirm('Supprimer ce point de vente ?')) return
    await supabase.from('venues').delete().eq('id', id)
    setVenues(prev => prev.filter(v => v.id !== id))
  }

  async function planifierReassort(v: Venue) {
    const day = v.reorder_day || 1
    const today = new Date()
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), day)
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, day)
    const target = thisMonth >= today ? thisMonth : nextMonth
    const dateStr = target.toISOString().split('T')[0]
    await supabase.from('reorders').insert({ venue_id: v.id, sachets_count: v.sachets_target, status: 'planifié', planned_date: dateStr, notes: 'Réassort mensuel automatique' })
    alert(`Réassort planifié pour le ${target.toLocaleDateString('fr-FR')} !`)
  }

  function stockLevel(current: number, target: number) {
    if (target === 0) return 'ok'
    const ratio = current / target
    if (ratio < 0.25) return 'urgent'
    if (ratio < 0.5) return 'low'
    return 'ok'
  }

  return (
    <div className="min-h-screen">
      {venteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
            <h2 className="font-semibold text-lg mb-1">Déclarer une vente</h2>
            <p className="text-sm text-gray-500 mb-4">Combien de porte-clés ont été vendus ?</p>
            <input
              type="number"
              min="1"
              value={venteQty}
              onChange={e => setVenteQty(+e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-lg text-center font-semibold mb-2"
              autoFocus
            />
            <p className="text-xs text-gray-400 text-center mb-4">= {(venteQty * 2.5).toFixed(2)}€ de CA</p>
            <div className="flex gap-2">
              <button onClick={() => { setVenteModal(null); setVenteQty(0) }} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">Annuler</button>
              <button onClick={() => declarerVente(venteModal)} disabled={venteQty <= 0} className="flex-1 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Points de vente</h1>
          <button onClick={() => { cancelEdit(); setShowForm(true) }} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark flex items-center gap-1">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h2 className="font-medium mb-4">{editId ? 'Modifier le point de vente' : 'Nouveau point de vente'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-xs text-gray-500 block mb-1">Nom *</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex : Tabac de la Gare" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Adresse</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Contact</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Objectif sachets</label><input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.sachets_target} onChange={e => setForm(f => ({ ...f, sachets_target: +e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Porte-clés déposés</label><input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.portecles_target} onChange={e => setForm(f => ({ ...f, portecles_target: +e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Jour du réassort mensuel</label><input type="number" min="1" max="28" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.reorder_day} onChange={e => setForm(f => ({ ...f, reorder_day: +e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Notes</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={cancelEdit} className="px-4 py-2 border border-gray-200 rounded-lg text-sm flex items-center gap-1"><X className="w-4 h-4" /> Annuler</button>
              <button onClick={saveVenue} disabled={saving || !form.name.trim()} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"><Check className="w-4 h-4" /> {editId ? 'Enregistrer' : 'Ajouter'}</button>
            </div>
          </div>
        )}

        {loading ? <div className="text-gray-400 text-sm">Chargement...</div> : venues.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400"><Store className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">Aucun point de vente.</p></div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {venues.map(v => {
              const days = v.reorder_day ? daysUntilReorder(v.reorder_day) : null
              const sachetLevel = stockLevel(v.sachets_current || 0, v.sachets_target || 0)
              const sachetPct = v.sachets_target > 0 ? Math.min(100, Math.round(((v.sachets_current || 0) / v.sachets_target) * 100)) : 100
              return (
                <div key={v.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-semibold text-base">{v.name}</h2>
                      {v.address && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{v.address}</p>}
                      {v.contact && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{v.contact}</p>}
                      {days !== null && <p className={`text-xs mt-1 flex items-center gap-1 ${days <= 7 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}><RefreshCw className="w-3 h-3" />Réassort le {v.reorder_day} du mois — {days === 0 ? "aujourd'hui !" : `dans ${days} jour(s)`}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <button onClick={() => planifierReassort(v)} className="text-xs px-3 py-1.5 bg-brand-light text-brand-dark rounded-lg hover:bg-brand hover:text-white transition-colors flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Planifier</button>
                      <button onClick={() => startEdit(v)} className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"><Pencil className="w-3 h-3" /> Modifier</button>
                      <button onClick={() => deleteVenue(v.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Sachets */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Sachets en rayon</span>
                          <span className={sachetLevel === 'urgent' ? 'text-red-600 font-medium' : sachetLevel === 'low' ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'}>{v.sachets_current || 0} / {v.sachets_target || 0}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${sachetLevel === 'urgent' ? 'bg-red-400' : sachetLevel === 'low' ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${sachetPct}%` }} />
                        </div>
                      </div>
                      <div className="flex gap-1 items-center">
                        <button onClick={() => updateStock(v.id, 'sachets_current', -1)} className="w-7 h-7 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm">−</button>
                        <input type="number" min="0" defaultValue={v.sachets_current || 0} key={v.sachets_current} onBlur={e => setStockDirect(v.id, 'sachets_current', parseInt(e.target.value))} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="w-14 text-center border border-gray-200 rounded-lg px-1 py-1 text-sm" />
                        <button onClick={() => updateStock(v.id, 'sachets_current', 1)} className="w-7 h-7 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm">+</button>
                      </div>
                    </div>

                    {/* Porte-clés */}
                    {(v.portecles_target || 0) > 0 && (
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Porte-clés en dépôt</span>
                            <span className="text-amber-600 font-medium">{v.portecles_current || 0} / {v.portecles_target || 0}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${Math.min(100, Math.round(((v.portecles_current || 0) / (v.portecles_target || 1)) * 100))}%` }} />
                          </div>
                        </div>
                        <div className="flex gap-1 items-center">
                          <input type="number" min="0" defaultValue={v.portecles_current || 0} key={v.portecles_current} onBlur={e => setStockDirect(v.id, 'portecles_current', parseInt(e.target.value))} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="w-14 text-center border border-gray-200 rounded-lg px-1 py-1 text-sm" />
                          <button onClick={() => { setVenteModal(v.id); setVenteQty(0) }} className="text-xs px-2 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 flex items-center gap-1 whitespace-nowrap">
                            <ShoppingBag className="w-3 h-3" /> Vente
                          </button>
                        </div>
                      </div>
                    )}
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
