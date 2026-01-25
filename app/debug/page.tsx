'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DebugPage() {
  const router = useRouter()
  const [session, setSession] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('baggplanning_session')
      setSession(stored)
      setLoaded(true)
    }
  }, [])

  const clearSession = () => {
    localStorage.removeItem('baggplanning_session')
    setSession(null)
  }

  const setTitulaireSession = () => {
    const s = {
      role: 'titulaire',
      employeeId: 'titulaire',
      employeeName: 'Isabelle MAURER (Titulaire)',
      loginTime: new Date().toISOString(),
    }
    localStorage.setItem('baggplanning_session', JSON.stringify(s))
    setSession(JSON.stringify(s))
  }

  const setEmployeSession = () => {
    const s = {
      role: 'employe',
      employeeId: 'emp-etudiant-1',
      employeeName: 'Anas',
      loginTime: new Date().toISOString(),
    }
    localStorage.setItem('baggplanning_session', JSON.stringify(s))
    setSession(JSON.stringify(s))
  }

  if (!loaded) return <div style={{ padding: '40px' }}>Chargement...</div>

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>🔧 Debug Session</h1>
      
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Session actuelle :</h2>
        {session ? (
          <pre style={{ backgroundColor: '#1e293b', color: '#10b981', padding: '16px', borderRadius: '8px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(JSON.parse(session), null, 2)}
          </pre>
        ) : (
          <p style={{ color: '#dc2626', fontWeight: '500' }}>❌ Aucune session</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button
          onClick={setTitulaireSession}
          style={{
            padding: '12px 24px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          👑 Créer session Titulaire
        </button>
        <button
          onClick={setEmployeSession}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          👤 Créer session Employé
        </button>
        <button
          onClick={clearSession}
          style={{
            padding: '12px 24px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          🗑️ Effacer session
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => router.push('/auth/login')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'white',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          → Page Login
        </button>
        <button
          onClick={() => router.push('/titulaire')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'white',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          → Espace Titulaire
        </button>
        <button
          onClick={() => router.push('/employe')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'white',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          → Espace Employé
        </button>
      </div>
    </div>
  )
}
