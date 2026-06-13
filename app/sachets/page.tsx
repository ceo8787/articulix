'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Gift, Zap, Star } from 'lucide-react'

interface Model { id: string; name: string; stock_normal: number; stock_gold: number }
interface Sachet { n1: string; n2: string; gold: string }

function Nav() {
  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center"><Gift className="w-5 h-5 text-white" /></div>
        <span className="font-semibold text-lg">Articulix</span>
      </div>
      <div className="flex gap-1">
        {[['/', 'Dashboard'], ['/models', 'Stock'], ['/venues', 'Points de vente'], ['/reorders', 'Réassorts'], ['/sachets', 'Sachets']].map(([href, label]) => (
          <Link key={href} href={href} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">{label}</Link>
        ))}
      </div>
    </nav>
  )
}

export default function SachetsPage() {
  const [models, setModels] = useState<Model[]>([])
  const [nb, setNb] = useState(80)
  const [sachets, setSachets] = useState<Sachet[]>([])
  const [loading, setLoading] = useState(true)
  const [generated, setGenerated] = useState(false)
  const [applyStock, setApplyStock] = useState(false)

  useEffect(() => {
    supabase.from('models').select('*').then(({ data }) => {
      setModels(data || [])
      setLoading(false)
    })
  }, [])

  function generate() {
    const normals = models.filter(m => m.stock_normal > 0).map(m => ({ ...m, qty: m.stock_normal }))
    const golds = models.filter(m => m.stock_gold > 0).map(m => ({ ...m, qty: m.stock_gold }))
    if (normals.length < 2 || golds.length < 1) return
    const result: Sachet[] = []
    for (let i = 0; i < nb; i++) {
      normals.sort((a, b) => b.qty - a.qty)
      golds.sort((a, b) => b.qty - a.qty)
      const avail = normals.filter(m => m.qty > 0)
      const availG = golds.filter(m => m.qty > 0)
      if (avail.length < 2 || availG.length < 1) break
      const g = availG[0]
      const n1 = avail[0]
      const n2 = avail.find(m => m.name !== g.name && m.name !== n1.name)
      if (!n2) break
      result.push({ n1: n1.name, n2: n2.name, gold: g.name })
      n1.qty--; n2.qty--; g.qty--
    }
    setSachets(result)
    setGenerated(true)
  }

  async function applyToStock() {
    const usage: Record<string, { normal: number; gold: number }> = {}
    sachets.forEach(s => {
      ;[s.n1, s.n2].forEach(name => {
        if (!usage[name]) usage[name] = { normal: 0, gold: 0 }
        usage[name].normal++
      })
      if (!usage[s.gold]) usage[s.gold] = { normal: 0, gold: 0 }
      usage[s.gold].gold++
    })
    for (const model of models) {
      const u = usage[model.name]
      if (!u) continue
      await supabase.from('models').update({
        stock_normal: Math.max(0, model.stock_normal - u.normal),
        stock_gold: Math.max(0, model.stock_gold - u.gold)
      }).eq('id', model.id)
    }
    alert(`${sachets.length} sachets appliqués au stock !`)
    const { data } = await supabase.from('models').select('*')
    setModels(data || [])
    setGenerated(false)
    setSachets([])
  }

  const normals = models.filter(m => m.stock_normal > 0).length
  const golds = models.filter(m => m.stock_gold > 0).length
  const canGenerate = normals >= 2 && golds >= 1

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-2">Générateur de sachets</h1>
        <p className="text-sm text-gray-500 mb-6">Compose des sachets en piochant les modèles les plus stockés en priorité pour rééquilibrer votre stock.</p>

        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <div className="text-xs text-gray-500 mb-1">Modèles normaux disponibles</div>
              <div className="text-xl font-semibold">{normals} <span className="text-sm text-gray-400 font-normal">modèles</span></div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Modèles dorés disponibles</div>
              <div className="text-xl font-semibold text-amber-600">{golds} <span className="text-sm text-amber-400 font-normal">modèles</span></div>
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
            <p className="text-xs text-red-500 mt-3">Il faut au moins 2 modèles normaux et 1 modèle doré en stock. <Link href="/models" className="underline">Ajouter des modèles →</Link></p>
          )}
        </div>

        {generated && sachets.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600"><span className="font-medium">{sachets.length} sachets</span> générés</p>
              <button onClick={applyToStock} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2">
                Déduire du stock
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {sachets.map((s, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="text-xs text-gray-400 mb-2">Sachet {i + 1}</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-gray-700">{s.n1}</span>
                    <span className="text-xs px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-gray-700">{s.n2}</span>
                    <span className="text-xs px-2 py-1 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 flex items-center gap-1">
                      <Star className="w-3 h-3" />{s.gold}
                    </span>
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
