'use client'

import {
  MOCK_DISPONIBILITES,
  MOCK_STATS,
  SEMAINE_REFERENCE,
  JOURS_SEMAINE,
  getRoleColor,
} from '@/lib/mock-data'

// ============================================================
// 📁 app/titulaire/disponibilites/page.tsx
// ============================================================
// Page de visualisation des disponibilités
// Matrice des employés à planning variable
// ============================================================

export default function DisponibilitesPage() {
  const repondus = MOCK_DISPONIBILITES.filter(d => d.has_submitted)
  const nonRepondus = MOCK_DISPONIBILITES.filter(d => !d.has_submitted)

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            Disponibilités
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
            Semaine du {SEMAINE_REFERENCE.jours[0]} au {SEMAINE_REFERENCE.jours[5]}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            📧 Envoyer rappel ({nonRepondus.length})
          </button>
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <StatCard
          label="Total employés variables"
          value={MOCK_STATS.disponibilites.total}
          color="#64748b"
        />
        <StatCard
          label="Ont répondu"
          value={MOCK_STATS.disponibilites.repondu}
          color="#10b981"
        />
        <StatCard
          label="En attente"
          value={MOCK_STATS.disponibilites.en_attente}
          color="#f59e0b"
        />
        <StatCard
          label="Taux de réponse"
          value={`${MOCK_STATS.disponibilites.taux}%`}
          color="#3b82f6"
        />
      </div>

      {/* Matrice des disponibilités */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}>
        {/* Header du tableau */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px repeat(6, 1fr)',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <div style={{
            padding: '16px',
            fontWeight: '600',
            color: '#64748b',
            fontSize: '13px',
          }}>
            Employé
          </div>
          {SEMAINE_REFERENCE.jours.map((jour, index) => (
            <div
              key={index}
              style={{
                padding: '16px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#1e293b',
                fontSize: '13px',
                borderLeft: '1px solid #e2e8f0',
              }}
            >
              {jour.split(' ')[0]}
              <span style={{ 
                display: 'block', 
                fontSize: '11px', 
                color: '#94a3b8',
                fontWeight: '400',
              }}>
                {jour.split(' ')[1]}
              </span>
            </div>
          ))}
        </div>

        {/* Lignes des employés */}
        {MOCK_DISPONIBILITES.map((dispo, rowIndex) => (
          <div
            key={dispo.employee_id}
            style={{
              display: 'grid',
              gridTemplateColumns: '200px repeat(6, 1fr)',
              borderBottom: rowIndex < MOCK_DISPONIBILITES.length - 1 ? '1px solid #f1f5f9' : 'none',
              backgroundColor: dispo.has_submitted ? 'white' : '#fffbeb',
            }}
          >
            {/* Nom de l'employé */}
            <div style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: dispo.has_submitted ? '#10b981' : '#f59e0b',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '12px',
              }}>
                {dispo.initiales}
              </div>
              <div>
                <p style={{ 
                  fontWeight: '500', 
                  color: '#1e293b', 
                  margin: 0,
                  fontSize: '14px',
                }}>
                  {dispo.employee_name}
                </p>
                <p style={{ 
                  fontSize: '11px', 
                  color: dispo.has_submitted ? '#10b981' : '#f59e0b',
                  margin: 0,
                }}>
                  {dispo.has_submitted ? '✓ Répondu' : '⏳ En attente'}
                </p>
              </div>
            </div>

            {/* Cellules par jour */}
            {JOURS_SEMAINE.map((jour, colIndex) => {
              const horaire = dispo[jour]
              const isAvailable = horaire !== null

              return (
                <div
                  key={colIndex}
                  style={{
                    padding: '8px',
                    borderLeft: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!dispo.has_submitted ? (
                    <span style={{
                      padding: '6px 12px',
                      backgroundColor: '#fef3c7',
                      color: '#d97706',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}>
                      ?
                    </span>
                  ) : isAvailable ? (
                    <span style={{
                      padding: '6px 12px',
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}>
                      {horaire}
                    </span>
                  ) : (
                    <span style={{
                      padding: '6px 12px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}>
                      Indispo
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Résumé par jour */}
      <div style={{
        marginTop: '24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e2e8f0',
      }}>
        <h2 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#1e293b',
          marginBottom: '16px',
        }}>
          📊 Résumé par jour
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '12px',
        }}>
          {JOURS_SEMAINE.map((jour, index) => {
            const disponibles = MOCK_DISPONIBILITES.filter(d => 
              d.has_submitted && d[jour] !== null
            ).length
            const total = MOCK_DISPONIBILITES.filter(d => d.has_submitted).length

            return (
              <div
                key={jour}
                style={{
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <p style={{ 
                  fontWeight: '600', 
                  color: '#1e293b',
                  margin: 0,
                  fontSize: '14px',
                }}>
                  {SEMAINE_REFERENCE.joursShort[index]}
                </p>
                <p style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  color: disponibles > 0 ? '#10b981' : '#ef4444',
                  margin: '8px 0 4px 0',
                }}>
                  {disponibles}
                </p>
                <p style={{ 
                  fontSize: '11px', 
                  color: '#64748b',
                  margin: 0,
                }}>
                  disponibles
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COMPOSANTS
// ============================================================

function StatCard({ 
  label, 
  value, 
  color 
}: { 
  label: string
  value: string | number
  color: string
}) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e2e8f0',
    }}>
      <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{label}</p>
      <p style={{ 
        fontSize: '32px', 
        fontWeight: 'bold', 
        color: color, 
        margin: '8px 0 0 0' 
      }}>
        {value}
      </p>
    </div>
  )
}
