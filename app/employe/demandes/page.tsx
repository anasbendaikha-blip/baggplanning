'use client'

import { useState, useEffect } from 'react'
import { MOCK_EMPLOYEES, MOCK_DEMANDES, SEMAINE_REFERENCE } from '@/lib/mock-data'

interface Session {
  role: string
  employeeId: string
  employeeName: string
}

const TYPE_CONFIG = {
  conge: { icon: '🏖️', label: 'Congé', color: '#8b5cf6', bg: '#f5f3ff' },
  echange: { icon: '🔄', label: 'Échange', color: '#3b82f6', bg: '#eff6ff' },
  maladie: { icon: '🏥', label: 'Maladie', color: '#ef4444', bg: '#fef2f2' },
}

export default function EmployeDemandes() {
  const [session, setSession] = useState<Session | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newDemande, setNewDemande] = useState({
    type: 'conge' as keyof typeof TYPE_CONFIG,
    date: '',
    creneau: '',
    motif: '',
  })

  useEffect(() => {
    const stored = localStorage.getItem('baggplanning_session')
    if (stored) {
      setSession(JSON.parse(stored))
    }
  }, [])

  if (!session) return null

  // Filtrer les demandes de l'employé connecté
  const mesDemandes = MOCK_DEMANDES.filter(d => d.employee_id === session.employeeId)

  const handleSubmit = () => {
    if (!newDemande.date || !newDemande.motif) {
      alert('Veuillez remplir tous les champs')
      return
    }
    // Simuler l'ajout
    alert('Demande envoyée avec succès !')
    setShowModal(false)
    setNewDemande({ type: 'conge', date: '', creneau: '', motif: '' })
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>📝 Mes Demandes</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Congés, échanges et absences</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ➕ Nouvelle demande
        </button>
      </div>

      {/* Liste des demandes */}
      {mesDemandes.length === 0 ? (
        <div style={{
          padding: '60px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '48px' }}>📭</span>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '16px 0 8px 0' }}>Aucune demande</h2>
          <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>
            Vous n'avez pas encore fait de demande de congé ou d'échange.
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ➕ Faire une demande
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mesDemandes.map(demande => {
            const config = TYPE_CONFIG[demande.type as keyof typeof TYPE_CONFIG]
            return (
              <div
                key={demande.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: demande.urgente ? '2px solid #ef4444' : '1px solid #e2e8f0',
                  overflow: 'hidden',
                }}
              >
                {demande.urgente && (
                  <div style={{
                    padding: '8px 16px',
                    backgroundColor: '#fef2f2',
                    borderBottom: '1px solid #fecaca',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span>🚨</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#dc2626' }}>URGENT</span>
                  </div>
                )}
                <div style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: config.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}>
                    {config.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: config.bg,
                        color: config.color,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}>
                        {config.label}
                      </span>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: demande.status === 'approuvee' ? '#dcfce7' : demande.status === 'refusee' ? '#fee2e2' : '#fef3c7',
                        color: demande.status === 'approuvee' ? '#16a34a' : demande.status === 'refusee' ? '#dc2626' : '#d97706',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}>
                        {demande.status === 'approuvee' ? '✓ Approuvée' : demande.status === 'refusee' ? '✕ Refusée' : '⏳ En attente'}
                      </span>
                    </div>
                    <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>{demande.date} — {demande.creneau}</p>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>{demande.motif}</p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#94a3b8' }}>
                    Demandé le<br/>{demande.demande_le}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal nouvelle demande */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowModal(false)}>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '450px',
              maxWidth: '90vw',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 20px 0' }}>
              ➕ Nouvelle demande
            </h2>

            {/* Type */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Type de demande
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setNewDemande(prev => ({ ...prev, type: key as keyof typeof TYPE_CONFIG }))}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: newDemande.type === key ? `2px solid ${config.color}` : '2px solid #e2e8f0',
                      backgroundColor: newDemande.type === key ? config.bg : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{config.icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: newDemande.type === key ? config.color : '#64748b' }}>
                      {config.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Date
              </label>
              <input
                type="date"
                value={newDemande.date}
                onChange={e => setNewDemande(prev => ({ ...prev, date: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Créneau */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Créneau concerné
              </label>
              <input
                type="text"
                value={newDemande.creneau}
                onChange={e => setNewDemande(prev => ({ ...prev, creneau: e.target.value }))}
                placeholder="ex: Journée complète, 8h-14h..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Motif */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Motif
              </label>
              <textarea
                value={newDemande.motif}
                onChange={e => setNewDemande(prev => ({ ...prev, motif: e.target.value }))}
                placeholder="Expliquez votre demande..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
