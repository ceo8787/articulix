'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Package, Store, RefreshCw, AlertTriangle, TrendingDown, Euro, Flag } from 'lucide-react'

function daysUntilReorder(day: number) {
  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), day)
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, day)
  const target = thisMonth >= today ? thisMonth : nextMonth
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function Dashboard() {
  const [models, setModels] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [reorders, setReorders] = useState<any[]>([])
  const [filaments, setFilaments] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [sachetsStock, setSachetsStock] = useState(0)
  const [currentMonthCA, setCurrentMonthCA] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    const [{ data: m }, { data: v }, { data: r }, { data: f }, { data: t }, { data: s }, { data: ca }] = await Promise.all([
      supabase.from('models').select('*'),
      supabase.from('venues').select('*'),
      supabase.from('reorders').select('*, venues(name)').order('created_at', { ascending: false }).limit(5),
      supabase.from('filaments').select('*'),
      supabase.from('tasks').select('*').eq('status', 'à faire').eq('priority', 'haute'),
      supabase.from('settings').select('*').eq('key', 'sachets_stock').single(),
      supabase.from('monthly_revenue').select('*').eq('month', month).eq('year', year).single(),
    ])
    setModels(m || [])
    setVenues(v || [])
    setReorders(r || [])
    setFilaments(f || [])
    setTasks(t || [])
    setSachetsStock(s?.value || 0)
    setCurrentMonthCA(ca?.revenue || 0)
    setLoading(false)
  }

  async function updateSachetsStock(delta: number) {
    const newVal = Math.max(0, sachetsStock + delta)
    await supabase.from('settings').update({ value: newVal }).eq('key', 'sachets_stock')
    setSachetsStock(newVal)
  }

  async function setSachetsStockDirect(val: number) {
    if (isNaN(val)) return
    await supabase.from('settings').update({ value: val }).eq('key', 'sachets_stock')
    setSachetsStock(val)
  }

  const urgent = models.filter(m => m.stock_normal < 10).length
  const low = models.filter(m => m.stock_normal >= 10 && m.stock_normal < 20).length
  const pending = reorders.filter(r => r.status === 'planifié').length
  const criticalFilaments = filaments.filter(f => f.weight_remaining < 1000)
  const lowFilaments = filaments.filter(f => f.weight_remaining >= 1000 && f.weight_remaining < 2000)
  const venuesWithReorder = venues.filter(v => v.reorder_day).map(v => ({ ...v, days: daysUntilReorder(v.reorder_day) })).sort((a, b) => a.days - b.days)
  const urgentReorders = venuesWithReorder.filter(v => v.days <= 7)

  // CA sachets et porte-clés vendus estimé (stock initial - stock actuel)
  const caSachets = venues.reduce((acc, v) => acc + Math.max(0, (v.sachets_target || 0) - (v.sachets_current || 0)) * 5, 0)
  const caPortecles = venues.reduce((acc, v) => acc + Math.max(0, (v.portecles_target || 0) - (v.portecles_current || 0)) * 2.5, 0)
  const caTotal = caSachets + caPortecles

  // Stock total porte-clés
  const totalPortecles = models.find(m => m.name.toLowerCase() === 'portecle')?.stock_normal || 0

  const statCards = [
    { label: 'Modèles', value: models.length, icon: Package, color: 'bg-brand-light text-brand-dark', href: '/models' },
    { label: 'Urgents', value: urgent, icon: AlertTriangle, color: 'bg-red-50 text-red-700', href: '/models?filter=urgent' },
    { label: 'Stock bas', value: low, icon: TrendingDown, color: 'bg-amber-50 text-amber-700', href: '/models?filter=low' },
    { label: 'Points de vente', value: venues.length, icon: Store, color: 'bg-teal-50 text-teal-700', href: '/venues' },
    { label: 'Réassorts planifiés', value: pending, icon: RefreshCw, color: 'bg-purple-50 text-purple-700', href: '/reorders' },
    { label: 'CA ce mois', value: currentMonthCA + '€', icon: Euro, color: 'bg-green-50 text-green-700', href: '/revenue' },
  ]

  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-6">Tableau de bord</h1>
        {loading ? <div className="text-gray-400 text-sm">Chargement...</div> : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {statCards.map(({ label, value, icon: Icon, color, href }) => (
                <Link key={label} href={href} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 hover:border-gray-200 transition-colors">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
                  <div><div className="text-2xl font-semibold">{value}</div><div className="text-sm text-gray-500">{label}</div></div>
                </Link>
              ))}
            </div>

            {/* CA estimé détaillé */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-xs text-gray-500 mb-1">CA estimé sachets</div>
                <div className="text-2xl font-semibold text-green-600">{caSachets.toFixed(0)}€</div>
                <div className="text-xs text-gray-400 mt-1">à 5€/sachet</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-xs text-gray-500 mb-1">CA estimé porte-clés</div>
                <div className="text-2xl font-semibold text-amber-600">{caPortecles.toFixed(0)}€</div>
                <div className="text-xs text-gray-400 mt-1">à 2.50€/pièce</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-xs text-gray-500 mb-1">CA total estimé</div>
                <div className="text-2xl font-semibold text-brand">{caTotal.toFixed(0)}€</div>
                <div className="text-xs text-gray-400 mt-1">sachets + porte-clés</div>
              </div>
            </div>

            {/* Stock sachets vides + porte-clés */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`rounded-xl border p-5 ${sachetsStock <= 160 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-medium text-base">Stock sachets vides</h2>
                    {sachetsStock <= 160 && <p className="text-xs text-red-600 font-medium mt-0.5">⚠️ Stock bas !</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateSachetsStock(-10)} className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-xs font-medium">−10</button>
                    <input type="number" min="0" value={sachetsStock} onChange={e => setSachetsStockDirect(parseInt(e.target.value))} className={`w-16 text-center border rounded-lg px-1 py-1 text-base font-semibold ${sachetsStock <= 160 ? 'border-red-200 text-red-700' : 'border-gray-200'}`} />
                    <button onClick={() => updateSachetsStock(10)} className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-xs font-medium">+10</button>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-medium text-base">Stock porte-clés</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Modèle "portecle" dans Stock</p>
                  </div>
                  <div className="text-2xl font-semibold text-amber-600">{totalPortecles}</div>
                </div>
              </div>
            </div>

            {urgentReorders.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
                <h2 className="font-medium text-amber-800 mb-2 flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Réassorts à venir</h2>
                <div className="space-y-1">
                  {urgentReorders.map(v => (
                    <div key={v.id} className="flex items-center justify-between">
                      <span className="text-sm text-amber-700">{v.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.days === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {v.days === 0 ? "Aujourd'hui !" : `Dans ${v.days} jour(s)`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(criticalFilaments.length > 0 || lowFilaments.length > 0) && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
                <h2 className="font-medium text-red-800 mb-2">Filaments à commander</h2>
                <div className="space-y-1">
                  {criticalFilaments.map(f => (
                    <div key={f.id} className="flex items-center justify-between">
                      <span className="text-sm text-red-700">{f.brand} — {f.color}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Urgent — {f.weight_remaining}g</span>
                    </div>
                  ))}
                  {lowFilaments.map(f => (
                    <div key={f.id} className="flex items-center justify-between">
                      <span className="text-sm text-amber-700">{f.brand} — {f.color}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Stock bas — {f.weight_remaining}g</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tasks.length > 0 && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4">
                <h2 className="font-medium text-purple-800 mb-2 flex items-center gap-2"><Flag className="w-4 h-4" /> Tâches urgentes</h2>
                <div className="space-y-1">
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between">
                      <span className="text-sm text-purple-700">{t.title}</span>
                      {t.assignee && <span className="text-xs text-purple-400">{t.assignee}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-3 mb-6">
              {[['Filaments', '/filaments'], ['Factures', '/invoices'], ['Tâches', '/tasks'], ['Références', '/references']].map(([label, href]) => (
                <Link key={href} href={href} className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:border-brand hover:text-brand transition-colors text-sm font-medium text-gray-600">{label}</Link>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-medium mb-4">Derniers réassorts</h2>
              {reorders.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun réassort. <Link href="/reorders" className="text-brand underline">Créer un réassort →</Link></p>
              ) : (
                <div className="space-y-2">
                  {reorders.map(r => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div><span className="font-medium text-sm">{r.venues?.name}</span><span className="text-gray-400 text-sm ml-2">— {r.sachets_count} sachets</span></div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'livré' ? 'bg-green-50 text-green-700' : r.status === 'planifié' ? 'bg-amber-50 text-amber-700' : r.status === 'annulé' ? 'bg-gray-50 text-gray-500' : 'bg-blue-50 text-blue-700'}`}>{r.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
