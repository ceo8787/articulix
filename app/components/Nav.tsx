'use client'
import Link from 'next/link'
import { Gift } from 'lucide-react'

export default function Nav() {
  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center"><Gift className="w-5 h-5 text-white" /></div>
        <span className="font-semibold text-lg">Articulix</span>
      </div>
      <div className="flex gap-1 flex-wrap">
{[['/', 'Dashboard'], ['/models', 'Stock'], ['/venues', 'Points de vente'],['/map', 'Carte'], ['/reorders', 'Réassorts'], ['/prospects', 'Prospects'], ['/history', 'Historique'], ['/sachets', 'Sachets'], ['/filaments', 'Filaments'], ['/invoices', 'Factures'], ['/tasks', 'Tâches'], ['/references', 'Références'], ['/revenue', 'CA']].map(([href, label]) => (
          <Link key={href} href={href} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">{label}</Link>
        ))}
      </div>
    </nav>
  )
}
