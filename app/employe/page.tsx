'use client'

import { useState, useEffect } from 'react'
import { MOCK_EMPLOYEES, MOCK_DISPONIBILITES, SEMAINE_REFERENCE, JOURS_SEMAINE, getRoleColor, getRoleLabel } from '@/lib/mock-data'

interface Session {
  role: string
  employeeId: string
  employeeName: string
}

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8)

export default function EmployeDashboard() {
  const [session, setSession] = useState<Session | null>(null)
  const [selectedDay, setSelectedDay] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem('baggplanning_session')
    if (stored) {
      setSession(JSON.parse(stored))
    }
  }, [])

  if (!session) return null

  const employee = MOCK_EMPLOYEES.find(e => e.id === session.employeeId)
  if (!employee) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#dc2626' }}>Employé non trouvé</p>
      </div>
    )
  }

  // Récupérer les horaires de l'employé
  const getHoraireForDay = (day: string) => {
    return employee.horaires[day as keyof typeof employee.horaires] || 'non'
  }

  // Calculer les heures de la semaine
  const calculateWeekHours = () => {
    let total = 0
    JOURS_SEMAINE.forEach(jour => {
      const horaire = getHoraireForDay(jour)
      if (horaire && horaire !== 'non' && horaire !== 'variable' && horaire !== 'congé') {
        const parts = horaire.replace(/h/g, ':').split('-')
        if (parts.length === 2) {
          const [sh, sm] = parts[0].split(':').map(Number)
          const [eh, em] = parts[1].split(':').map(Number)
          total += (eh * 60 + (em || 0) - sh * 60 - (sm || 0)) / 60
        }
      }
    })
    return total
  }

  const weekHours = calculateWeekHours()
  const currentDayHoraire = getHoraireForDay(JOURS_SEMAINE[selectedDay])

  // Convertir horaire en position %
  const timeToPercent = (time: string) => {
    const normalized = time.replace('h', ':')
    const [h, m] = normalized.split(':').map(Number)
    return ((h + (m || 0) / 60 - 8) / 13) * 100
  }

  const parseHoraire = (h: string) => {
    if (!h || h === 'non' || h === 'variable' || h === 'congé') return null
    const parts = h.replace(/h/g, ':').split('-')
    if (parts.length !== 2) return null
    return { start: parts[0], end: parts[1] }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>
          Bonjour {employee.prenom} 👋
        </h1>
        <p style={{ color: '#64748b', margin: 0 }}>
          Voici votre planning pour la semaine du {SEMAINE_REFERENCE.jours[0]} au {SEMAINE_REFERENCE.jours[5]} {SEMAINE_REFERENCE.mois}
        </p>
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px 0' }}>Mon rôle</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              padding: '4px 10px',
              backgroundColor: getRoleColor(employee.fonction) + '20',
              color: getRoleColor(employee.fonction),
              borderRadius: '6px',
              fontSize: '14px',
            }}>
              {getRoleLabel(employee.fonction)}
            </span>
          </p>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px 0' }}>Heures cette semaine</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: weekHours > 35 ? '#dc2626' : '#1e293b', margin: 0 }}>
            {weekHours.toFixed(1)}h
          </p>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px 0' }}>Jours travaillés</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            {JOURS_SEMAINE.filter(j => {
              const h = getHoraireForDay(j)
              return h && h !== 'non' && h !== 'congé'
            }).length}/6
          </p>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px 0' }}>Type contrat</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            {employee.typeEDT === 'variable' ? '📊 Variable' : '📌 Fixe'}
          </p>
        </div>
      </div>

      {/* Planning de la semaine */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>📅 Mon planning de la semaine</h2>
        </div>

        {/* Onglets jours */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          {SEMAINE_REFERENCE.jours.map((jour, index) => {
            const isActive = selectedDay === index
            const horaire = getHoraireForDay(JOURS_SEMAINE[index])
            const isWorking = horaire && horaire !== 'non' && horaire !== 'congé'
            const isConge = horaire === 'congé'
            const [dayName, dayNum] = jour.split(' ')

            return (
              <button
                key={index}
                onClick={() => setSelectedDay(index)}
                style={{
                  flex: 1,
                  padding: '16px',
                  backgroundColor: isActive ? '#f8fafc' : 'transparent',
                  borderBottom: isActive ? '2px solid #10b981' : '2px solid transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ fontWeight: '600', color: isActive ? '#10b981' : '#64748b', fontSize: '14px' }}>{dayName}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{dayNum}</span>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: isConge ? '#fee2e2' : isWorking ? '#dcfce7' : '#f1f5f9',
                  color: isConge ? '#dc2626' : isWorking ? '#16a34a' : '#94a3b8',
                  fontWeight: '500',
                }}>
                  {isConge ? 'Congé' : isWorking ? horaire : 'Repos'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Vue du jour sélectionné */}
        <div style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
            {SEMAINE_REFERENCE.jours[selectedDay]} {SEMAINE_REFERENCE.mois}
          </h3>

          {currentDayHoraire === 'congé' ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#fef2f2',
              borderRadius: '12px',
              border: '2px dashed #fca5a5',
            }}>
              <span style={{ fontSize: '48px' }}>🏖️</span>
              <p style={{ color: '#dc2626', fontWeight: '600', margin: '16px 0 0 0', fontSize: '18px' }}>Congé</p>
            </div>
          ) : currentDayHoraire === 'non' || !currentDayHoraire ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}>
              <span style={{ fontSize: '48px' }}>😴</span>
              <p style={{ color: '#64748b', fontWeight: '500', margin: '16px 0 0 0', fontSize: '16px' }}>Jour de repos</p>
            </div>
          ) : currentDayHoraire === 'variable' ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#fef3c7',
              borderRadius: '12px',
              border: '1px solid #fde68a',
            }}>
              <span style={{ fontSize: '48px' }}>📋</span>
              <p style={{ color: '#d97706', fontWeight: '600', margin: '16px 0 0 0', fontSize: '16px' }}>Horaire variable</p>
              <p style={{ color: '#92400e', margin: '8px 0 0 0', fontSize: '14px' }}>Consultez vos disponibilités</p>
            </div>
          ) : (
            <>
              {/* Timeline */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', backgroundColor: '#f8fafc' }}>
                  {HOURS.map(h => (
                    <div key={h} style={{
                      flex: 1,
                      padding: '10px 0',
                      textAlign: 'center',
                      fontSize: '11px',
                      color: '#64748b',
                      borderRight: '1px solid #f1f5f9',
                      backgroundColor: h === 13 ? '#fef3c7' : 'transparent',
                    }}>
                      {h}h
                    </div>
                  ))}
                </div>
                <div style={{ position: 'relative', height: '60px', backgroundColor: 'white' }}>
                  {/* Grille */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                    {HOURS.map(h => (
                      <div key={h} style={{
                        flex: 1,
                        borderRight: '1px solid #f1f5f9',
                        backgroundColor: h === 13 ? 'rgba(254,243,199,0.3)' : 'transparent',
                      }} />
                    ))}
                  </div>
                  {/* Barre */}
                  {(() => {
                    const parsed = parseHoraire(currentDayHoraire)
                    if (!parsed) return null
                    const left = timeToPercent(parsed.start)
                    const width = timeToPercent(parsed.end) - left
                    return (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        height: '36px',
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: getRoleColor(employee.fonction),
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}>
                        {currentDayHoraire}
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Détails */}
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Début</p>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                    {parseHoraire(currentDayHoraire)?.start.replace(':', 'h')}
                  </p>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Fin</p>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                    {parseHoraire(currentDayHoraire)?.end.replace(':', 'h')}
                  </p>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Durée</p>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                    {(() => {
                      const parsed = parseHoraire(currentDayHoraire)
                      if (!parsed) return '—'
                      const [sh, sm] = parsed.start.split(':').map(Number)
                      const [eh, em] = parsed.end.split(':').map(Number)
                      const hours = (eh * 60 + (em || 0) - sh * 60 - (sm || 0)) / 60
                      return `${hours.toFixed(1)}h`
                    })()}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Récap semaine */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>📊 Récapitulatif de la semaine</h2>
        </div>
        <div style={{ padding: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b', fontWeight: '500', fontSize: '13px' }}>Jour</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b', fontWeight: '500', fontSize: '13px' }}>Horaire</th>
                <th style={{ textAlign: 'right', padding: '12px 8px', color: '#64748b', fontWeight: '500', fontSize: '13px' }}>Durée</th>
              </tr>
            </thead>
            <tbody>
              {JOURS_SEMAINE.map((jour, i) => {
                const horaire = getHoraireForDay(jour)
                const isWorking = horaire && horaire !== 'non' && horaire !== 'congé' && horaire !== 'variable'
                let hours = 0
                if (isWorking) {
                  const parsed = parseHoraire(horaire)
                  if (parsed) {
                    const [sh, sm] = parsed.start.split(':').map(Number)
                    const [eh, em] = parsed.end.split(':').map(Number)
                    hours = (eh * 60 + (em || 0) - sh * 60 - (sm || 0)) / 60
                  }
                }
                return (
                  <tr key={jour} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 8px', fontWeight: '500' }}>{SEMAINE_REFERENCE.jours[i]}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {horaire === 'congé' ? (
                        <span style={{ padding: '4px 10px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '12px' }}>Congé</span>
                      ) : horaire === 'non' || !horaire ? (
                        <span style={{ color: '#94a3b8' }}>Repos</span>
                      ) : horaire === 'variable' ? (
                        <span style={{ padding: '4px 10px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '6px', fontSize: '12px' }}>Variable</span>
                      ) : (
                        <span style={{ padding: '4px 10px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '6px', fontSize: '12px' }}>{horaire}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                      {hours > 0 ? `${hours.toFixed(1)}h` : '—'}
                    </td>
                  </tr>
                )
              })}
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <td colSpan={2} style={{ padding: '12px 8px', fontWeight: 'bold' }}>Total semaine</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px', color: weekHours > 35 ? '#dc2626' : '#10b981' }}>
                  {weekHours.toFixed(1)}h
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
