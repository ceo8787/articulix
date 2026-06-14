'use client'
import type { Metadata } from 'next'
import './globals.css'
import { useState, useEffect } from 'react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const PASSWORD = 'cacaMot87347803'

  useEffect(() => {
    if (localStorage.getItem('articulix-auth') === PASSWORD) setAuth(true)
  }, [])

  function login() {
    if (input === PASSWORD) {
      localStorage.setItem('articulix-auth', PASSWORD)
      setAuth(true)
    } else {
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  if (!auth) return (
    <html lang="fr">
      <body style={{ background: '#f9f9f8', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #eee', width: '320px' }}>
          <div style={{ width: '40px', height: '40px', background: '#7F77DD', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'white', fontSize: '20px' }}>🎁</span>
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '0.5rem' }}>Articulix</h1>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.5rem' }}>Entrez le mot de passe pour accéder</p>
          <input
            type="password"
            placeholder="Mot de passe"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{ width: '100%', border: `1px solid ${error ? '#fca5a5' : '#e5e7eb'}`, borderRadius: '8px', padding: '10px 12px', fontSize: '14px', marginBottom: '12px', outline: 'none', boxSizing: 'border-box' }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '8px' }}>Mot de passe incorrect</p>}
          <button
            onClick={login}
            style={{ width: '100%', background: '#7F77DD', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
          >
            Accéder
          </button>
        </div>
      </body>
    </html>
  )

  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
