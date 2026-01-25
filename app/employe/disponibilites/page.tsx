'use client'

import { useState, useEffect } from 'react'
import { MOCK_EMPLOYEES, MOCK_DISPONIBILITES, SEMAINE_REFERENCE, JOURS_SEMAINE } from '@/lib/mock-data'

interface Session {
  role: string
  employeeId: string
  employeeName: string
}

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export default function EmployeDisponibilites() {
  const [session, setSession] = useState<Session | null>(null)
  const [disponibilites, setDisponibilites] = useState<Record<string, string | null>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('baggplanning_session')
    if (stored) {
      const parsed = JSON.parse(stored)
      setSession(parsed)
      
      // Charger les dispos existantes
      const dispo = MOCK_DISPONIBILITES.find(d => d.employee_id === parsed.employeeId)
      if (dispo) {
        const initial: Record<string, string | null> = {}
        JOURS_SEMAINE.forEach(j => {
          initial[j] = dispo[j as keyof typeof dispo] as string | null
        })
        setDisponibilites(initial)
      }
    }
  }, [])

  if (!session) return null

  const employee = MOCK_EMPLOYEES.find(e => e.id === session.employeeId)
  const isVariable = employee?.typeEDT === 'variable'

  const updateDispo = (jour: string, value: string | null) => {
    setDisponibilites(prev => ({ ...prev, [jour]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    // Simuler la sauvegarde
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!isVariable) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>📋 Mes Disponibilités</h1>
        <p style={{ color: '#64748b', margin: '0 0 24px 0' }}>{SEMAINE_REFERENCE.jours[0]} - {SEMAINE_REFERENCE.jours[5]} {SEMAINE_REFERENCE.mois}</p>
        
        <div style={{
          padding: '40px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '48px' }}>📌</span>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '16px 0 8px 0' }}>Planning fixe</h2>
          <p style={{ color: '#64748b', margin: 0 }}>
            Vous avez un planning fixe. Vos horaires sont définis par le titulaire.<br/>
            Consultez "Mon Planning" pour voir vos horaires.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>📋 Mes Disponibilités</h1>
          <p style={{ color: '#64748b', margin: 0 }}>{SEMAINE_REFERENCE.jours[0]} - {SEMAINE_REFERENCE.jours[5]} {SEMAINE_REFERENCE.mois}</p>
        </div>
        <button
          onClick={handleSave}
          style={{
            padding: '12px 24px',
            backgroundColor: saved ? '#10b981' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {saved ? '✓ Enregistré !' : '💾 Enregistrer'}
        </button>
      </div>

      <div style={{
        padding: '16px',
        backgroundColor: '#eff6ff',
        borderRadius: '10px',
        border: '1px solid #bfdbfe',
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
      }}>
        <span style={{ fontSize: '24px' }}>💡</span>
        <div>
          <p style={{ fontWeight: '600', color: '#1e40af', margin: '0 0 4px 0', fontSize: '14px' }}>Comment ça marche ?</p>
          <p style={{ color: '#3b82f6', margin: 0, fontSize: '13px' }}>
            Indiquez vos disponibilités pour chaque jour. Le titulaire utilisera ces informations pour créer votre planning.
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        {JOURS_SEMAINE.map((jour, i) => {
          const dispo = disponibilites[jour]
          const isAvailable = dispo !== null && dispo !== undefined

          return (
            <div key={jour} style={{
              padding: '20px',
              borderBottom: i < 5 ? '1px solid #e2e8f0' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}>
              <div style={{ width: '140px' }}>
                <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' }}>{SEMAINE_REFERENCE.jours[i]}</p>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{DAYS_SHORT[i]}</p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => updateDispo(jour, dispo || '08:00-18:00')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: isAvailable ? '#dcfce7' : 'white',
                    border: isAvailable ? '2px solid #10b981' : '2px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    color: isAvailable ? '#16a34a' : '#64748b',
                    fontSize: '13px',
                  }}
                >
                  ✓ Disponible
                </button>
                <button
                  onClick={() => updateDispo(jour, null)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: !isAvailable ? '#fee2e2' : 'white',
                    border: !isAvailable ? '2px solid #ef4444' : '2px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    color: !isAvailable ? '#dc2626' : '#64748b',
                    fontSize: '13px',
                  }}
                >
                  ✕ Indisponible
                </button>
              </div>

              {isAvailable && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Horaires :</span>
                  <input
                    type="text"
                    value={dispo || ''}
                    onChange={(e) => updateDispo(jour, e.target.value)}
                    placeholder="ex: 8h-14h ou 14h-20h"
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '13px',
                      width: '150px',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Résumé */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', margin: '0 0 12px 0' }}>📊 Résumé</h3>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              {JOURS_SEMAINE.filter(j => disponibilites[j]).length}
            </span>
            <span style={{ fontSize: '14px', color: '#64748b', marginLeft: '8px' }}>jours disponibles</span>
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
              {JOURS_SEMAINE.filter(j => !disponibilites[j]).length}
            </span>
            <span style={{ fontSize: '14px', color: '#64748b', marginLeft: '8px' }}>jours indisponibles</span>
          </div>
        </div>
      </div>
    </div>
  )
}
