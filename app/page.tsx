'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Package, Store, RefreshCw, Gift, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react'

interface Stats {
  totalModels: number
  urgentModels: number
  lowModels: number
  totalVenues: number
  pendingReorders: number
  totalSachets: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalModels: 0, urgentModels: 0, lowModels: 0,
    totalVenues: 0, pendingReorders: 0, totalSachets: 0
  })
  const [recentReorders, setRecentReorders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const [{ data: models }, { data: venues }, { data: reorders }] = await Promise.all([
      supabase.from('models').select('*'),
      supabase.from('venues').select('*'),
      supabase.from('reorders').select('*, venues(name)').order('created_at', { ascending: false }).limit(5)
    ])

    const urgent = (models || []).filter(m => (m.stock_normal + m.stock_gold) < 10).length
    const low = (models || []).filter(m => {
      const t = m.stock_normal + m.stock_gold
      return t >= 10 && t < 20
    }).length
    const pending = (reorders || []).filter(r => r.status === 'planifié').length
    const sachets = (models || []).reduce((acc, m) => acc + m.stock_normal + m.stock_gold, 0)

    setStats({
      totalModels: (models || []).length,
      urgentModels: urgent,
      lowModels: low,
      totalVenues: (venues || []).length,
      pendingReorders: pending,
      totalSachets: sachets,
    })
    setRecentReorders(reorders || [])
    setLoading(false)
  }

  const statCards = [
    { label: 'Modèles', value: stats.totalModels, icon: Package, color: 'bg-brand-light text-brand-dark', href: '/models' },
    { label: 'Urgents', value: stats.urgentModels, icon: AlertTriangle, color: 'bg-red-50 text-red-700', href: '/models?filter=urgent' },
    { label: 'Stock bas', value: stats.lowModels, icon: TrendingDown, color: 'bg-amber-50 text-amber-700', href: '/models?filter=low' },
    { label: 'Points de vente', value: stats.totalVenues, icon: Store, color: 'bg-teal-50 text-teal-700', href: '/venues' },
    { label: 'Réassorts planifiés', value: stats.pendingReorders, icon: RefreshCw, color: 'bg-purple-50 text-purple-700', href: '/reorders' },
    { label: 'Figurines en stock', value: stats.totalSachets, icon: Gift, color: 'bg-green-50 text-green-700', href: '/models' },
  ]

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg">Articulix</span>
        </div>
        <div className="flex gap-1">
          {[['/', 'Dashboard'], ['/models', 'Stock'], ['/venues', 'Points de vente'], ['/reorders', 'Réassorts'], ['/sachets', 'Sachets']].map(([href, label]) => (
            <Link key={href} href={href} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-6">Tableau de bord</h1>

        {loading ? (
          <div className="text-gray-400 text-sm">Chargement...</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {statCards.map(({ label, value, icon: Icon, color, href }) => (
                <Link key={label} href={href} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 hover:border-gray-200 transition-colors">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{value}</div>
                    <div className="text-sm text-gray-500">{label}</div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-medium mb-4">Derniers réassorts</h2>
              {recentReorders.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun réassort enregistré. <Link href="/reorders" className="text-brand underline">Créer un réassort →</Link></p>
              ) : (
                <div className="space-y-2">
                  {recentReorders.map(r => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <span className="font-medium text-sm">{r.venues?.name}</span>
                        <span className="text-gray-400 text-sm ml-2">— {r.sachets_count} sachets</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          r.status === 'livré' ? 'bg-green-50 text-green-700' :
                          r.status === 'planifié' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-50 text-gray-600'
                        }`}>{r.status}</span>
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
