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
    .filter(r => filterCat ===
