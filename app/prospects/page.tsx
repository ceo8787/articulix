'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Target, MapPin, Phone, Mail, Pencil, X, Check, AlertTriangle, Store } from 'lucide-react'

interface Prospect {
  id: string
  name: string
  type: string
  city: string
  contact_name: string
  contact_phone: string
  contact_email: string
  status: 'a_contacter' | 'contacte' | 'en_discussion' | 'client_actif' | 'refuse' | 'a_relancer'
  priority: 'haute' | 'moyenne' | 'basse'
  last_contact_date: string | null
  notes: string
  created_at: string
}

const statusConfig: Record<Prospect['status'], { label: string; bg: string; dot: string }> = {
  a_contacter: { label: 'À contacter', bg: 'bg-gray-50 text-gray-600', dot: 'bg-gray-300' },
  contacte: { label: 'Contacté', bg: 'bg-blue-50 text-blue-700', dot: 'bg-blue-400' },
  en_discussion: { label: 'En discussion', bg: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
  client_actif: { label: 'Client actif', bg: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
  refuse: { label: 'Refusé', bg: 'bg-red-50 text-red-600', dot: 'bg-red-400' },
  a_relancer: { label: 'À relancer', bg: 'bg-purple-50 text-purple-700', dot: 'bg-purple-400' },
}

const typeOptions = ['GMS', 'Buraliste', 'Animalerie / Zoo', 'Boutique jouets', 'Autre']
const priorityConfig = {
  haute: { color: 'text-red-500', bg: 'bg-red-50 text-red-700', label: '🔴 Haute' },
  moyenne: { color: 'text-amber-500', bg: 'bg-amber-50 text-amber-700', label: '🟡 Moyenne' },
  basse: { color: 'text-gray-400', bg: 'bg-gray-50 text-gray-600', label: '🟢 Basse' },
}

const emptyForm = {
  name: '', type: 'GMS', city: '', contact_name: '', contact_phone: '', contact_email: '',
  status: 'a_contacter' as Prospect['status'], priority: 'moyenne' as Prospect['priority'],
  last_contact_date: '', notes: '',
}

function daysSince(dateStr: string | null) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('prospects').select('*').order('created_at', { ascending: false })
    setProspects(data || [])
    setLoading(false)
  }

  function startEdit(p: Prospect) {
    setEditId(p.id)
    setForm({
      name: p.name, type: p.type || 'GMS', city: p.city || '',
      contact_name: p.contact_name || '', contact_phone: p.contact_phone || '', contact_email: p.contact_email || '',
      status: p.status || 'a_contacter', priority: p.priority || 'moyenne',
      last_contact_date: p.last_contact_date ? p.last_contact_date.split('T')[0] : '', notes: p.notes || '',
    })
    setShowForm(true)
  }

  function cancelEdit() {
    setEditId(null)
    setShowForm(false)
    setForm(emptyForm)
  }

  async function saveProspect() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = { ...form, last_contact_date: form.last_contact_date || null }
    if (editId) {
      await supabase.from('prospects').update(payload).eq('id', editId)
    } else {
      await supabase.from('prospects').insert(payload)
    }
    cancelEdit()
    setSaving(false)
    load()
  }

  async function updateStatus(p: Prospect, status: Prospect['status']) {
    await supabase.from('prospects').update({ status }).eq('id', p.id)
    setProspects(prev => prev.map(x => x.id === p.id ? { ...x, status } : x))
  }

  async function markContactedToday(p: Prospect) {
    const today = new Date().toISOString().split('T')[0]
    const nextStatus = p.status === 'a_contacter' ? 'contacte' : p.status
    await supabase.from('prospects').update({ last_contact_date: today, status: nextStatus }).eq('id', p.id)
    setProspects(prev => prev.map(x => x.id === p.id ? { ...x, last_contact_date: today, status: nextStatus } : x))
  }

  async function deleteProspect(id: string) {
    if (!confirm('Supprimer ce prospect ?')) return
    await supabase.from('prospects').delete().eq('id', id)
    setProspects(prev => prev.filter(p => p.id !== id))
  }

  const filtered = prospects.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (typeFilter !== 'all' && p.type !== typeFilter) return false
    return true
  }).sort((a, b) => {
    const o: Record<string, number> = { haute: 0, moyenne: 1, basse: 2 }
    return (o[a.priority] ?? 1) - (o[b.priority] ?? 1)
  })

  const stats = {
    total: prospects.length,
    a_contacter: prospects.filter(p => p.status === 'a_contacter').length,
    en_discussion: prospects.filter(p => p.status === 'en_discussion').length,
    client_actif: prospects.filter(p => p.status === 'client_actif').length,
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Prospects</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {stats.total} au total · {stats.a_contacter} à contacter · {stats.en_discussion} en discussion · {stats.client_actif} clients actifs
            </p>
          </div>
          <button onClick={() => { cancelEdit(); setShowForm(true) }} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark flex items-center gap-1">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Tous les statuts</option>
            {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">Tous les types</option>
            {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h2 className="font-medium mb-4">{editId ? 'Modifier le prospect' : 'Nouveau prospect'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-xs text-gray-500 block mb-1">Nom *</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex : Intermarché Limoges Nord" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Type</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-500 block mb-1">Ville</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Nom du contact</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Téléphone</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} /></div>
              <div className="col-span-2"><label className="text-xs text-gray-500 block mb-1">Email</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} /></div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Statut</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Prospect['status'] }))}>
                  {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Priorité</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Prospect['priority'] }))}>
                  <option value="haute">🔴 Haute</option>
                  <option value="moyenne">🟡 Moyenne</option>
                  <option value="basse">🟢 Basse</option>
                </select>
              </div>
              <div><label className="text-xs text-gray-500 block mb-1">Dernier contact</label><input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.last_contact_date} onChange={e => setForm(f => ({ ...f, last_contact_date: e.target.value }))} /></div>
              <div className="col-span-2"><label className="text-xs text-gray-500 block mb-1">Notes</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex : veut voir le display avant de valider" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={cancelEdit} className="px-4 py-2 border border-gray-200 rounded-lg text-sm flex items-center gap-1"><X className="w-4 h-4" /> Annuler</button>
              <button onClick={saveProspect} disabled={saving || !form.name.trim()} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"><Check className="w-4 h-4" /> {editId ? 'Enregistrer' : 'Ajouter'}</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-gray-400 text-sm">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun prospect. Ajoutez votre première cible !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map(p => {
              const since = daysSince(p.last_contact_date)
              const needsFollowUp = since !== null && since >= 14 && p.status !== 'client_actif' && p.status !== 'refuse'
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-base">{p.name}</h2>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 flex items-center gap-1"><Store className="w-3 h-3" />{p.type}</span>
                        {needsFollowUp && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> À relancer
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {p.city && <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city}</span>}
                        {p.contact_name && <span className="text-xs text-gray-400">{p.contact_name}</span>}
                        {p.contact_phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{p.contact_phone}</span>}
                        {p.contact_email && <span className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{p.contact_email}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <button onClick={() => startEdit(p)} className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"><Pencil className="w-3 h-3" /> Modifier</button>
                      <button onClick={() => deleteProspect(p.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={p.status}
                      onChange={e => updateStatus(p, e.target.value as Prospect['status'])}
                      className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${statusConfig[p.status]?.bg}`}
                    >
                      {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig[p.priority]?.bg}`}>{priorityConfig[p.priority]?.label}</span>
                    {p.last_contact_date ? (
                      <span className="text-xs text-gray-400">Dernier contact : {new Date(p.last_contact_date).toLocaleDateString('fr-FR')} ({since === 0 ? "aujourd'hui" : `il y a ${since} j`})</span>
                    ) : (
                      <span className="text-xs text-gray-300">Jamais contacté</span>
                    )}
                    <button onClick={() => markContactedToday(p)} className="text-xs px-2 py-1 bg-brand-light text-brand-dark rounded-lg hover:bg-brand hover:text-white transition-colors">
                      Marquer contacté aujourd'hui
                    </button>
                  </div>

                  {p.notes && <p className="text-xs text-gray-400 mt-2 italic">{p.notes}</p>}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

