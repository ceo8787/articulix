'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Gift, Plus, Trash2 } from 'lucide-react'

interface Filament {
  id: string
  brand: string
  color: string
  material: string
  weight_total: number
  weight_remaining: number
  color_hex: string
  notes: string
}

function Nav() {
  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center"><Gift className="w-5 h-5 text-white" /></div>
        <span className="font-semibold text-lg">Articulix</span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {[['/', 'Dashboard'], ['/models', 'Stock'], ['/venues', 'Points de vente'], ['/reorders', 'Réassorts'], ['/sachets', 'Sachets'], ['/filaments', 'Filaments'], ['/invoices', 'Factures'], ['/tasks', 'Tâches'], ['/references', 'Références']].map(([href, label]) => (
          <Link key={href} href={href} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">{label}</Link>
        ))}
      </div>
    </nav>
  )
}

function status(f: Filament) {
  const pct = f.weight_remaining / f.weight_total
  if (pct < 0.15) return 'urgent'
  if (pct < 0.35) return 'low'
  return 'ok'
}

export default function FilamentsPage() {
  const [filaments, setFilaments] = useState<Filament[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ brand: '', color: '', material: 'PLA', weight_total: 1000, weight_remaining: 1000, color_hex: '#888888', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('filaments').select('*').order('brand')
    setFilaments(data || [])
    setLoading(false)
  }

  async function addFilament() {
    if (!form.brand.trim() || !form.color.trim()) return
    setSaving(true)
    await supabase.from('filaments').insert(form)
    setForm({ brand: '', color: '', material: 'PLA', weight_total: 1000, weight_remaining: 1000, color_hex: '#888888', notes: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function updateRemaining(id: string, delta: number) {
    const f = filaments.find(f => f.id === id)!
    const val = Math.max(0, Math.min(f.weight_total, f.weight_remaining + delta))
    await supabase.from('filaments').update({ weight_remaining: val }).eq('id', id)
    setFilaments(prev => prev.map(f => f.id === id ? { ...f, weight_remaining: val } : f))
  }

  async function deleteFilament(id: string) {
    if (!confirm('Supprimer cette bobine ?')) return
    await supabase.from('filaments').delete().eq('id', id)
    setFilaments(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Filaments</h1>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark flex items-center gap-1">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h2 className="font-medium mb-4">Nouvelle bobine</h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Marque *</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Bambu Lab..." value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Couleur *</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Blanc, Noir..." value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Matière</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))}>
                  <option>PLA</option><option>PETG</option><option>ABS</option><option>TPU</option><option>Autre</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Poids total (g)</label>
                <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.weight_total} onChange={e => setForm(f => ({ ...f, weight_total: +e.target.value, weight_remaining: +e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Poids restant (g)</label>
                <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.weight_remaining} onChange={e => setForm(f => ({ ...f, weight_remaining: +e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Couleur visuelle</label>
                <input type="color" className="w-full h-10 border border-gray-200 rounded-lg cursor-pointer" value={form.color_hex} onChange={e => setForm(f => ({ ...f, color_hex: e.target.value }))} />
              </div>
              <div className="col-span-3">
                <label className="text-xs text-gray-500 block mb-1">Notes</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Référence, lien..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Annuler</button>
              <button onClick={addFilament} disabled={saving || !form.brand.trim() || !form.color.trim()} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        )}

        {loading ? <div className="text-gray-400 text-sm">Chargement...</div> : filaments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <p className="text-sm">Aucune bobine. Ajoutez votre premier filament !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filaments.map(f => {
              const pct = Math.round((f.weight_remaining / f.weight_total) * 100)
              const s = status(f)
              return (
                <div key={f.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{ backgroundColor: f.color_hex }} />
                      <div>
                        <p className="font-medium text-sm">{f.brand} — {f.color}</p>
                        <p className="text-xs text-gray-400">{f.material}{f.notes && ` · ${f.notes}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s === 'urgent' ? 'bg-red-50 text-red-700' : s === 'low' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                        {s === 'urgent' ? '🔴 Vide' : s === 'low' ? '🟡 Bas' : '🟢 OK'}
                      </span>
                      <button onClick={() => deleteFilament(f.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Restant</span>
                        <span className="font-medium">{f.weight_remaining}g / {f.weight_total}g ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: f.color_hex }} />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => updateRemaining(f.id, -50)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">−50g</button>
                      <button onClick={() => updateRemaining(f.id, -100)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">−100g</button>
                      <button onClick={() => updateRemaining(f.id, 100)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">+100g</button>
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
