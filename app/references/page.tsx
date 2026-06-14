'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Gift, Plus, Trash2, Search, Tag } from 'lucide-react'

interface Reference {
  id: string
  title: string
  content: string
  category: string
  tags: string
  created_at: string
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

const CATEGORIES = ['Couleurs', 'Fournisseurs', 'Codes', 'Contacts', 'Procédures', 'Autre']

export default function ReferencesPage() {
  const [refs, setRefs] = useState<Reference[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [form, setForm] = useState({ title: '', content: '', category: 'Couleurs', tags: '' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('notes_references').select('*').order('category').order('title')
    setRefs(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    if (editId) {
      await supabase.from('notes_references').update(form).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('notes_references').insert(form)
    }
    setForm({ title: '', content: '', category: 'Couleurs', tags: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function deleteRef(id: string) {
    if (!confirm('Supprimer cette référence ?')) return
    await supabase.from('notes_references').delete().eq('id', id)
    setRefs(prev => prev.filter(r => r.id !== id))
  }

  function startEdit(r: Reference) {
    setForm({ title: r.title, content: r.content, category: r.category, tags: r.tags })
    setEditId(r.id)
    setShowForm(true)
  }

  const filtered = refs
    .filter(r => filterCat === 'all' || r.category === filterCat)
    .filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.content.toLowerCase().includes(search.toLowerCase()) || r.tags.toLowerCase().includes(search.toLowerCase()))

  const categories = Array.from(new Set(refs.map(r => r.category)))

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Références</h1>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ title: '', content: '', category: 'Couleurs', tags: '' }) }} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark flex items-center gap-1">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h2 className="font-medium mb-4">{editId ? 'Modifier' : 'Nouvelle référence'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Titre *</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex: Code couleur doré" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Catégorie</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Contenu</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-24 resize-none" placeholder="Notez votre référence ici..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Tags (séparés par des virgules)</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex: PLA, doré, bambu" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => { setShowForm(false); setEditId(null) }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Annuler</button>
              <button onClick={save} disabled={saving || !form.title.trim()} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setFilterCat('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterCat === 'all' ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>Tout</button>
            {categories.map(c => (
              <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterCat === c ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{c}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <p className="text-sm">Aucune référence trouvée.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:border-gray-200 transition-colors" onClick={() => startEdit(r)}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs text-brand-dark bg-brand-light px-2 py-0.5 rounded-full">{r.category}</span>
                    <h3 className="font-medium text-sm mt-1">{r.title}</h3>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteRef(r.id) }} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
                {r.content && <p className="text-xs text-gray-600 whitespace-pre-wrap">{r.content}</p>}
                {r.tags && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {r.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full flex items-center gap-1"><Tag className="w-2.5 h-2.5" />{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
