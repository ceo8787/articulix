'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Gift, Plus, FileText, Upload, ExternalLink, Trash2, CheckCircle, Clock } from 'lucide-react'

interface Invoice {
  id: string
  title: string
  supplier: string
  amount: number
  date: string
  status: 'payée' | 'en attente' | 'en retard'
  file_url: string | null
  notes: string
  created_at: string
}


export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', supplier: '', amount: '', date: '', status: 'en attente' as const, notes: '' })
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('invoices').select('*').order('date', { ascending: false })
    setInvoices(data || [])
    setLoading(false)
  }

  async function addInvoice() {
    if (!form.title.trim()) return
    setSaving(true)
    let file_url = null

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `invoices/${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage.from('articulix-files').upload(path, file)
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('articulix-files').getPublicUrl(path)
        file_url = urlData.publicUrl
      }
    }

    await supabase.from('invoices').insert({
      ...form,
      amount: parseFloat(form.amount) || 0,
      file_url
    })

    setForm({ title: '', supplier: '', amount: '', date: '', status: 'en attente', notes: '' })
    setFile(null)
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function updateStatus(id: string, status: Invoice['status']) {
    await supabase.from('invoices').update({ status }).eq('id', id)
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Supprimer cette facture ?')) return
    await supabase.from('invoices').delete().eq('id', id)
    setInvoices(prev => prev.filter(i => i.id !== id))
  }

  const filtered = invoices.filter(i => filterStatus === 'all' || i.status === filterStatus)
  const total = filtered.reduce((acc, i) => acc + i.amount, 0)
  const unpaid = invoices.filter(i => i.status === 'en attente').reduce((acc, i) => acc + i.amount, 0)

  const statusConfig = {
    'payée': 'bg-green-50 text-green-700',
    'en attente': 'bg-amber-50 text-amber-700',
    'en retard': 'bg-red-50 text-red-700',
  }

  return (
    <div className="min-h-screen">
      
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Factures</h1>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark flex items-center gap-1">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-500 mb-1">Total affiché</div>
            <div className="text-2xl font-semibold">{total.toFixed(2)} €</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-500 mb-1">En attente de paiement</div>
            <div className="text-2xl font-semibold text-amber-600">{unpaid.toFixed(2)} €</div>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h2 className="font-medium mb-4">Nouvelle facture</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Titre *</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex: Bobines PLA Bambu Lab" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Fournisseur</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Amazon, Bambu Lab..." value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Montant (€)</label>
                <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Statut</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                  <option value="en attente">En attente</option>
                  <option value="payée">Payée</option>
                  <option value="en retard">En retard</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Fichier PDF</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-brand transition-colors" onClick={() => fileRef.current?.click()}>
                  {file ? (
                    <p className="text-sm text-brand font-medium">{file.name}</p>
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Cliquez pour uploader un PDF</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Notes</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Annuler</button>
              <button onClick={addInvoice} disabled={saving || !form.title.trim()} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          {['all', 'en attente', 'payée', 'en retard'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s === 'all' ? 'Toutes' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune facture. Ajoutez votre première facture !</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Facture</th>
                  <th className="text-left px-4 py-3">Fournisseur</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-right px-4 py-3">Montant</th>
                  <th className="text-center px-4 py-3">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{inv.title}</div>
                      {inv.notes && <div className="text-xs text-gray-400">{inv.notes}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{inv.supplier}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.date ? new Date(inv.date).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold">{inv.amount.toFixed(2)} €</td>
                    <td className="px-4 py-3 text-center">
                      <select value={inv.status} onChange={e => updateStatus(inv.id, e.target.value as any)} className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${statusConfig[inv.status]}`}>
                        <option value="en attente">En attente</option>
                        <option value="payée">Payée</option>
                        <option value="en retard">En retard</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {inv.file_url && (
                          <a href={inv.file_url} target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-dark">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => deleteInvoice(inv.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
