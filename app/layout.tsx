import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Articulix — Gestion de stock',
  description: 'Gestion des stocks, points de vente et réassorts Articulix',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
