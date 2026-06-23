'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function login() {
    setLoading(true)
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    if (res.ok) {
      window.location.href = '/'
    } else {
      setError(true)
      setLoading(false)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div style={{ background: '#f9f9f8', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #eee', width: '320px' }}>
        <div style={{ width: '40px', height: '40px', background: '#7F77DD', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
          <span style={{ color: 'white', fontSize: '20px' }}>🎁</span>
        </div>
        <h1 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '0.5rem' }}>Articulix</h1>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.5rem' }}>Entrez le mot de passe pour accéder</p>
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{ width: '100%', border: `1px solid ${error ? '#fca5a5' : '#e5e7eb'}`, borderRadius: '8px', padding: '10px 12px', fontSize: '14px', marginBottom: '12px', outline: 'none', boxSizing: 'border-box' }}
        />
        {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '8px' }}>Mot de passe incorrect</p>}
        <button
          onClick={login}
          disabled={loading || !password}
          style={{ width: '100%', background: '#7F77DD', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Connexion...' : 'Accéder'}
        </button>
      </div>
    </div>
  )
}

