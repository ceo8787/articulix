'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2 } from 'lucide-react'

interface Model {
  id: string
  name: string
  stock_normal: number
}

function status(m: Model) {
  if (m.stock_normal < 10) return 'urgent'
  if (m.stock_normal < 20) return 'low'
  return 'ok'
}

function StatusBadge({ s }: { s: string }) {
  if (s === 'urgent') return <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">🔴 Urgent</span>
  if (s === 'low') return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">🟡 Stock bas</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">🟢 OK</span>
}

function ModelsContent() {
  const searchParams = useSearchParams()
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all')
  const [sort, setSort] = useState('priority')
  const [newName, setNewName] = useState('')
  const [newNormal, setNewNormal] = useState(30)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('models').select('*').order('name')
    setModels(data || [])
    setLoading(false)
  }

  async function addModel() {
    if (!newName.trim()) return
    setSaving(true)
    await supabase.from('models').insert({ name: newName.trim(), stock_normal: newNormal, stock_gold: 0 })
    setNewName(''); setNewNormal(30)
    setSaving(false)
    load()
  }

  async function setStockDirect(id: string, val: number) {
    if (isNaN(val) || val < 0) return
    await supabase.from('models').update({ stock_normal: val }).eq('id', id)
    setModels(prev => prev.map(m => m.id === id ? { ...m, stock_normal: val } : m))
  }

  async function deleteModel(id: string) {
    if (!confirm('Supprimer ce modèle ?')) return
    await supabase.from('models').delete().eq('id', id)
    setModels(prev => prev.filter(m => m.id !== id))
  }

  let list = models
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    .filter(m => filter === 'all' || status(m) === filter)

  if (sort === 'priority') list = [...list].sort((a, b) => {
    const o: Record<string, number> = { urgent: 0, low: 1, ok: 2 }
    return o[status(a)] - o[status(b)] || a.stock_normal - b.stock_normal
  })
  else if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
  else if (sort === 'stock-asc') list = [...list].sort((a, b) => a.stock_normal - b.stock_normal)
  else if (sort === 'stock-desc') list = [...list].sort((a, b) => b.stock_normal - a.stock_normal)

  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Stock des modèles</h1>
          <div className="flex gap-2 text-sm">
            <span className="px-2 py-1 bg-red-50 text-red-700 rounded-lg">{models.filter(m => status(m) === 'urgent').length} urgents</span>
            <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg">{models.filter(m => status(m) === 'low').length} bas</span>
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg">{models.filter(m => status(m) === 'ok').length} OK</span>
          </div>
        </div>

        <div className="flex gap-3 mb-4 flex-wrap">
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-40" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">Tous</option>
            <option value="urgent">🔴 Urgents</option>
            <option value="low">🟡 Stock bas</option>
            <option value="ok">🟢 OK</option>
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="priority">Par priorité</option>
            <option value="name">Par nom</option>
            <option value="stock-asc">Stock croissant</option>
            <option value="stock-desc">Stock décroissant</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Modèle</th>
                <th className="text-center px-4 py-3">Stock</th>
                <th className="text-center px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">Chargement...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">Aucun modèle.</td></tr>
              ) : list.map(m => (
                <tr key={m.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="text"
                      defaultValue={m.stock_normal}
                      key={m.stock_normal}
                      onBlur={e => setStockDirect(m.id, parseInt(e.target.value))}
                      onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                      className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold focus:border-brand focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 text-center"><StatusBadge s={status(m)} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deleteModel(m.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Ajouter un modèle</h2>
          <div className="flex gap-3 flex-wrap">
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-40" placeholder="Nom du modèle" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addModel()} />
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-500">Stock</label>
              <input type="number" min="0" className="border border-gray-200 rounded-lg px-3 py-2 w-20 text-sm" value={newNormal} onChange={e => setNewNormal(+e.target.value)} />
            </div>
            <button onClick={addModel} disabled={saving || !newName.trim()} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ModelsPage() {
  return <Suspense fallback={<div className="p-8 text-gray-400">Chargement...</div>}><ModelsContent /></Suspense>
}
