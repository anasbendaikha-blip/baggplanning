'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_EMPLOYEES } from '@/lib/mock-data'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'employe' | 'titulaire'>('employe')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [loading, setLoading] = useState(false)

  // Filtrer les employés selon le rôle
  const employees = role === 'titulaire' 
    ? MOCK_EMPLOYEES.filter(e => e.fonction === 'Pharmacien' && e.actif)
    : MOCK_EMPLOYEES.filter(e => e.actif)

  const handleLogin = () => {
    if (role === 'employe' && !selectedEmployee) {
      alert('Veuillez sélectionner un employé')
      return
    }

    setLoading(true)

    // Stocker la session dans localStorage
    const session = {
      role,
      employeeId: role === 'titulaire' ? 'titulaire' : selectedEmployee,
      employeeName: role === 'titulaire' 
        ? 'Isabelle MAURER (Titulaire)' 
        : MOCK_EMPLOYEES.find(e => e.id === selectedEmployee)?.prenom + ' ' + MOCK_EMPLOYEES.find(e => e.id === selectedEmployee)?.nom,
      loginTime: new Date().toISOString(),
    }

    localStorage.setItem('baggplanning_session', JSON.stringify(session))

    // Rediriger vers la bonne interface
    setTimeout(() => {
      if (role === 'titulaire') {
        router.push('/titulaire')
      } else {
        router.push('/employe')
      }
    }, 500)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            fontSize: '28px',
          }}>
            📅
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>
            BaggPlanning
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Connexion démo — Pharmacie Isabelle MAURER
          </p>
        </div>

        {/* Sélection du rôle */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
            Je suis...
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={() => { setRole('employe'); setSelectedEmployee('') }}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: role === 'employe' ? '2px solid #10b981' : '2px solid #e2e8f0',
                backgroundColor: role === 'employe' ? '#ecfdf5' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>👤</div>
              <div style={{ fontWeight: '600', color: role === 'employe' ? '#059669' : '#64748b', fontSize: '14px' }}>
                Employé
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                Consulter mon planning
              </div>
            </button>
            <button
              onClick={() => { setRole('titulaire'); setSelectedEmployee('') }}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: role === 'titulaire' ? '2px solid #8b5cf6' : '2px solid #e2e8f0',
                backgroundColor: role === 'titulaire' ? '#f5f3ff' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>👑</div>
              <div style={{ fontWeight: '600', color: role === 'titulaire' ? '#7c3aed' : '#64748b', fontSize: '14px' }}>
                Titulaire
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                Gérer les plannings
              </div>
            </button>
          </div>
        </div>

        {/* Sélection de l'employé (si rôle employé) */}
        {role === 'employe' && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
              Choisir mon profil
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '20px',
              }}
            >
              <option value="">— Sélectionner —</option>
              <optgroup label="💊 Pharmaciens">
                {employees.filter(e => e.fonction === 'Pharmacien').map(e => (
                  <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                ))}
              </optgroup>
              <optgroup label="💉 Préparateurs">
                {employees.filter(e => e.fonction === 'Preparateur').map(e => (
                  <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                ))}
              </optgroup>
              <optgroup label="🎓 Apprentis">
                {employees.filter(e => e.fonction === 'Apprenti').map(e => (
                  <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                ))}
              </optgroup>
              <optgroup label="🎓 Étudiants">
                {employees.filter(e => e.fonction === 'Etudiant').map(e => (
                  <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                ))}
              </optgroup>
              <optgroup label="📦 Conditionneurs">
                {employees.filter(e => e.fonction === 'Conditionneur').map(e => (
                  <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                ))}
              </optgroup>
            </select>
          </div>
        )}

        {/* Info titulaire */}
        {role === 'titulaire' && (
          <div style={{
            padding: '16px',
            backgroundColor: '#f5f3ff',
            borderRadius: '10px',
            marginBottom: '24px',
            border: '1px solid #e9d5ff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
              }}>
                IM
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Isabelle MAURER</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Pharmacien Titulaire</div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton connexion */}
        <button
          onClick={handleLogin}
          disabled={loading || (role === 'employe' && !selectedEmployee)}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: role === 'titulaire' ? '#8b5cf6' : '#10b981',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading || (role === 'employe' && !selectedEmployee) ? 'not-allowed' : 'pointer',
            opacity: loading || (role === 'employe' && !selectedEmployee) ? 0.6 : 1,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {loading ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
              Connexion...
            </>
          ) : (
            <>
              {role === 'titulaire' ? '👑' : '👤'} Se connecter
            </>
          )}
        </button>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#94a3b8',
          marginTop: '24px',
          marginBottom: 0,
        }}>
          🔒 Mode démo — Pas de mot de passe requis
        </p>
      </div>
    </div>
  )
}
