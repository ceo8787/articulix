'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Gift, Plus, CheckSquare, Square, Trash2, Flag } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  priority: 'haute' | 'moyenne' | 'basse'
  status: 'à faire' | 'en cours' | 'terminée'
  assignee: string
  due_date: string
  created_at: string
}


const priorityConfig = {
  haute: { color: 'text-red-500', bg: 'bg-red-50 text-red-700' },
  moyenne: { color: 'text-amber-500', bg: 'bg-amber-50 text-amber-700' },
  basse: { color: 'text-gray-400', bg: 'bg-gray-50 text-gray-600' },
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<Task['priority']>('moyenne')
  const [newAssignee, setNewAssignee] = useState('')
  const [newDue, setNewDue] = useState('')
  const [filter, setFilter] = useState('active')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  async function addTask() {
    if (!newTitle.trim()) return
    await supabase.from('tasks').insert({ title: newTitle.trim(), priority: newPriority, assignee: newAssignee, due_date: newDue || null, status: 'à faire', description: '' })
    setNewTitle(''); setNewAssignee(''); setNewDue('')
    load()
  }

  async function toggleStatus(task: Task) {
    const next = task.status === 'terminée' ? 'à faire' : task.status === 'à faire' ? 'en cours' : 'terminée'
    await supabase.from('tasks').update({ status: next }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const filtered = tasks.filter(t => {
    if (filter === 'active') return t.status !== 'terminée'
    if (filter === 'terminée') return t.status === 'terminée'
    return true
  }).sort((a, b) => {
    const o: Record<string, number> = { haute: 0, moyenne: 1, basse: 2 }
    return o[a.priority] - o[b.priority]
  })

  const done = tasks.filter(t => t.status === 'terminée').length

  return (
    <div className="min-h-screen">
      
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Tâches</h1>
            <p className="text-sm text-gray-400 mt-0.5">{done} / {tasks.length} terminées</p>
          </div>
          <div className="flex gap-2">
            {['active', 'all', 'terminée'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {f === 'active' ? 'En cours' : f === 'all' ? 'Toutes' : 'Terminées'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="flex gap-3 flex-wrap">
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-40" placeholder="Nouvelle tâche..." value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={newPriority} onChange={e => setNewPriority(e.target.value as any)}>
              <option value="haute">🔴 Haute</option>
              <option value="moyenne">🟡 Moyenne</option>
              <option value="basse">🟢 Basse</option>
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={newAssignee} onChange={e => setNewAssignee(e.target.value)}>
              <option value="">Assignée à...</option>
              <option value="Lou">Lou</option>
              <option value="Les deux">Les deux</option>
            </select>
            <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={newDue} onChange={e => setNewDue(e.target.value)} />
            <button onClick={addTask} disabled={!newTitle.trim()} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune tâche. Ajoutez votre première tâche !</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(t => (
              <div key={t.id} className={`bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 ${t.status === 'terminée' ? 'opacity-50' : ''}`}>
                <button onClick={() => toggleStatus(t)} className="flex-shrink-0">
                  {t.status === 'terminée' ? <CheckSquare className="w-5 h-5 text-green-500" /> : t.status === 'en cours' ? <CheckSquare className="w-5 h-5 text-brand" /> : <Square className="w-5 h-5 text-gray-300" />}
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${t.status === 'terminée' ? 'line-through text-gray-400' : ''}`}>{t.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig[t.priority].bg}`}>{t.priority}</span>
                    {t.assignee && <span className="text-xs text-gray-400">{t.assignee}</span>}
                    {t.due_date && <span className="text-xs text-gray-400">→ {new Date(t.due_date).toLocaleDateString('fr-FR')}</span>}
                    {t.status === 'en cours' && <span className="text-xs px-2 py-0.5 rounded-full bg-brand-light text-brand-dark">En cours</span>}
                  </div>
                </div>
                <button onClick={() => deleteTask(t.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
