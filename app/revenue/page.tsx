'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Gift, TrendingUp } from 'lucide-react'

interface MonthlyRevenue {
  id: string
  month: number
  year: number
  sachets_sold: number
  revenue: number
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']


export default function RevenuePage() {
  const [data, setData] = useState<MonthlyRevenue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: rows } = await supabase
      .from('monthly_revenue')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
    setData(rows || [])
    setLoading(false)
  }

  const totalRevenue = data.reduce((acc, r) => acc + r.revenue, 0)
  const totalSachets = data.reduce((acc, r) => acc + r.sachets_sold, 0)
  const maxRevenue = Math.max(...data.map(r => r.revenue), 1)

  return (
    <div className="min-h-screen">
      
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Chiffre d'affaires</h1>
          <div className="flex gap-3">
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-2 text-center">
              <div className="text-xl font-semibold text-green-600">{totalRevenue.toFixed(0)}€</div>
              <div className="text-xs text-gray-400">CA total</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-2 text-center">
              <div className="text-xl font-semibold">{totalSachets}</div>
              <div className="text-xs text-gray-400">Sachets vendus</div>
            </div>
          </div>
        </div>

        {loading ? <div className="text-gray-400 text-sm">Chargement...</div> : data.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune donnée pour l'instant.</p>
            <p className="text-xs mt-1">Les données s'enregistrent automatiquement quand vous marquez un réassort comme livré.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
              <h2 className="font-medium mb-4">Évolution mensuelle</h2>
              <div className="space-y-3">
                {[...data].reverse().map(r => (
                  <div key={r.id} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-500 flex-shrink-0">{MONTHS[r.month - 1]} {r.year}</div>
                    <div className="flex-1 h-6 bg-gray-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full transition-all flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(5, (r.revenue / maxRevenue) * 100)}%` }}
                      >
                        <span className="text-xs text-white font-medium">{r.revenue.toFixed(0)}€</span>
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm text-gray-400 flex-shrink-0">{r.sachets_sold} sachets</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3">Mois</th>
                    <th className="text-right px-4 py-3">Sachets vendus</th>
                    <th className="text-right px-4 py-3">CA</th>
                    <th className="text-right px-4 py-3">Évolution</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r, i) => {
                    const prev = data[i + 1]
                    const evolution = prev ? ((r.revenue - prev.revenue) / prev.revenue * 100) : null
                    return (
                      <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium">{MONTHS[r.month - 1]} {r.year}</td>
                        <td className="px-4 py-3 text-right">{r.sachets_sold}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">{r.revenue.toFixed(2)}€</td>
                        <td className="px-4 py-3 text-right">
                          {evolution !== null && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${evolution >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {evolution >= 0 ? '+' : ''}{evolution.toFixed(0)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
