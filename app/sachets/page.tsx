'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Zap } from 'lucide-react'

interface Model { id: string; name: string; stock_normal: number }
interface Sachet { n1: string; n2: string; n3: string }

export default function SachetsPage() {
  const [models, setModels] = useState<Model[]>([])
  const [nb, setNb] = useState(80)
  const [sachets, setSachets] = useState<Sachet[]>([])
  const [loading, setLoading] = useState(true)
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    supabase.from('models').select('*').then(({ data }) => {
      setModels(data || [])
      setLoading(false)
    })
  }, [])

  function generate() {
    const available = models.filter(m => m.stock_normal > 0).map(m => ({ ...m, qty: m.stock_normal }))
    if (available.length < 3) return
    const result: Sachet[] = []
    for (let i = 0; i < nb; i++) {
      available.sort((a, b) => b.qty - a.qty)
      const avail = available.filter(m => m.qty > 0)
      if (avail.length < 3) break
      const n1 = avail[0]
      const n2 = avail[1]
      const n3 = avail[2]
      result.push({ n1: n1.name, n2: n2.name, n3: n3.name })
      n1.qty--; n2.qty--; n3.qty--
    }
    setSachets(result)
    setGenerated(true)
  }

  async function applyToStock() {
    const usage: Record<string, number> = {}
    sachets.forEach(s => {
      [s.n1, s.n2, s.n3].forEach(name => {
        usage[name] = (usage[name] || 0) + 1
      })
    })
    for (const model of models) {
      const used = usage[model.name]
      if (!used) continue
      await supabase.from('models').update({
        stock_normal: Math.max(0, model.stock_normal - used)
      }).eq('id', model.id)
    }
    alert(`${sachets.length} sachets appliqués au stock !`)
    const { data } = await supabase.from('models').select('*')
    setModels(data || [])
    setGenerated(false)
    setSachets([])
  }

  const available = models.filter(m => m.stock_normal > 0).length
  const canGenerate = available >= 3

  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-2">Générateur de sachets</h1>
        <p className="text-sm text-gray-500 mb-6">Compose des sachets de 3 figurines en piochant les modèles les plus stockés en priorité.</p>

        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <div className="text-xs text-gray-500 mb-1">Modèles disponibles</div>
              <div className="text-xl font-semibold">{available} <span className="text-sm text-gray-400 font-normal">modèles</span></div>
            </div>
            <div className="flex-1 flex items-end justify-end gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nombre de sachets</label>
                <input type="number" min="1" max="500" className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24" value={nb} onChange={e => setNb(+e.target.value)} />
              </div>
              <button onClick={generate} disabled={loading || !canGenerate} className="px-5 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Générer
              </button>
            </div>
          </div>
          {!canGenerate && !loading && (
            <p className="text-xs text-red-500 mt-3">Il faut au moins 3 modèles en stock pour générer des sachets.</p>
          )}
        </div>

        {generated && sachets.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600"><span className="font-medium">{sachets.length} sachets</span> générés</p>
              <button onClick={applyToStock} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Déduire du stock</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {sachets.map((s, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="text-xs text-gray-400 mb-2">Sachet {i + 1}</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-gray-700">{s.n1}</span>
                    <span className="text-xs px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-gray-700">{s.n2}</span>
                    <span className="text-xs px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-gray-700">{s.n3}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {generated && sachets.length === 0 && (
          <p className="text-sm text-red-500">Stock insuffisant pour générer des sachets.</p>
        )}
      </main>
    </div>
  )
}
