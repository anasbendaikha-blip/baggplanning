'use client'

import { useState } from 'react'
import {
  MOCK_DEMANDES,
  MOCK_EMPLOYEES,
  MockDemande,
} from '@/lib/mock-data'

// ============================================================
// 📁 app/titulaire/demandes/page.tsx
// ============================================================
// Page de gestion des demandes (congés, échanges, maladies)
// ============================================================

type FilterType = 'all' | 'conge' | 'echange' | 'maladie'
type FilterStatus = 'all' | 'pending' | 'approved' | 'refused'

const TYPE_CONFIG = {
  conge: { icon: '🏖️', color: '#3b82f6', label: 'Congé' },
  echange: { icon: '🔄', color: '#8b5cf6', label: 'Échange' },
  maladie: { icon: '🏥', color: '#ef4444', label: 'Maladie' },
}

const STATUS_CONFIG = {
  pending: { color: '#f59e0b', label: 'En attente', bg: '#fef3c7' },
  approved: { color: '#10b981', label: 'Approuvée', bg: '#dcfce7' },
  refused: { color: '#ef4444', label: 'Refusée', bg: '#fee2e2' },
}

export default function DemandesPage() {
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending')
  const [demandes, setDemandes] = useState(MOCK_DEMANDES)

  // Filtrer les demandes
  const filteredDemandes = demandes.filter(d => {
    const matchesType = filterType === 'all' || d.type === filterType
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus
    return matchesType && matchesStatus
  })

  // Actions
  const handleApprove = (id: string) => {
    setDemandes(prev => prev.map(d => 
      d.id === id ? { ...d, status: 'approved' as const } : d
    ))
  }

  const handleRefuse = (id: string) => {
    setDemandes(prev => prev.map(d => 
      d.id === id ? { ...d, status: 'refused' as const } : d
    ))
  }

  const pendingCount = demandes.filter(d => d.status === 'pending').length
  const urgentCount = demandes.filter(d => d.status === 'pending' && d.urgent).length

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
            Gestion des demandes
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
            {pendingCount} demande(s) en attente
            {urgentCount > 0 && (
              <span style={{ color: '#ef4444', fontWeight: '600' }}>
                {' '}• {urgentCount} urgente(s)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div style={{
        display: 'flex',
        gap: '24px',
        marginBottom: '24px',
      }}>
        {/* Filtre par type */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Type :</span>
          <FilterButton
            active={filterType === 'all'}
            onClick={() => setFilterType('all')}
            label="Tous"
          />
          {Object.entries(TYPE_CONFIG).map(([type, config]) => (
            <FilterButton
              key={type}
              active={filterType === type}
              onClick={() => setFilterType(type as FilterType)}
              label={config.label}
              icon={config.icon}
              color={config.color}
            />
          ))}
        </div>

        {/* Filtre par statut */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Statut :</span>
          <FilterButton
            active={filterStatus === 'all'}
            onClick={() => setFilterStatus('all')}
            label="Tous"
          />
          <FilterButton
            active={filterStatus === 'pending'}
            onClick={() => setFilterStatus('pending')}
            label="En attente"
            color="#f59e0b"
          />
          <FilterButton
            active={filterStatus === 'approved'}
            onClick={() => setFilterStatus('approved')}
            label="Approuvées"
            color="#10b981"
          />
          <FilterButton
            active={filterStatus === 'refused'}
            onClick={() => setFilterStatus('refused')}
            label="Refusées"
            color="#ef4444"
          />
        </div>
      </div>

      {/* Liste des demandes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredDemandes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}>
            <span style={{ fontSize: '48px' }}>📋</span>
            <p style={{ color: '#64748b', marginTop: '16px' }}>
              Aucune demande pour ces filtres
            </p>
          </div>
        ) : (
          filteredDemandes.map(demande => (
            <DemandeCard
              key={demande.id}
              demande={demande}
              onApprove={() => handleApprove(demande.id)}
              onRefuse={() => handleRefuse(demande.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ============================================================
// COMPOSANTS
// ============================================================

function FilterButton({ 
  active, 
  onClick, 
  label, 
  icon,
  color,
}: { 
  active: boolean
  onClick: () => void
  label: string
  icon?: string
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: '6px',
        border: active ? 'none' : '1px solid #e2e8f0',
        backgroundColor: active ? (color || '#1e293b') : 'white',
        color: active ? 'white' : '#64748b',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        transition: 'all 0.2s',
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  )
}

function DemandeCard({ 
  demande, 
  onApprove, 
  onRefuse 
}: { 
  demande: MockDemande
  onApprove: () => void
  onRefuse: () => void
}) {
  const typeConfig = TYPE_CONFIG[demande.type]
  const statusConfig = STATUS_CONFIG[demande.status]
  const isPending = demande.status === 'pending'

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      border: demande.urgent && isPending ? '2px solid #ef4444' : '1px solid #e2e8f0',
      overflow: 'hidden',
    }}>
      {/* Header urgent */}
      {demande.urgent && isPending && (
        <div style={{
          backgroundColor: '#fef2f2',
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #fecaca',
        }}>
          <span>⚠️</span>
          <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '13px' }}>
            Demande urgente
          </span>
        </div>
      )}

      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Infos principales */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Avatar */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: typeConfig.color + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>
              {typeConfig.icon}
            </div>

            {/* Détails */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#1e293b',
                  margin: 0,
                }}>
                  {demande.employee_name}
                </h3>
                <span style={{
                  padding: '4px 10px',
                  backgroundColor: typeConfig.color + '20',
                  color: typeConfig.color,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}>
                  {typeConfig.label}
                </span>
                <span style={{
                  padding: '4px 10px',
                  backgroundColor: statusConfig.bg,
                  color: statusConfig.color,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}>
                  {statusConfig.label}
                </span>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, auto)',
                gap: '24px',
                marginTop: '12px',
              }}>
                <InfoItem label="Date" value={formatDate(demande.date)} />
                <InfoItem label="Créneau" value={demande.creneau} />
                <InfoItem label="Demandé le" value={formatDate(demande.created_at)} />
              </div>

              {demande.motif && (
                <p style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#64748b',
                  margin: '12px 0 0 0',
                }}>
                  💬 {demande.motif}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {isPending && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onApprove}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                }}
              >
                ✓ Approuver
              </button>
              <button
                onClick={onRefuse}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                }}
              >
                ✕ Refuser
              </button>
              {demande.type !== 'maladie' && (
                <button
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f8fafc',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                  }}
                >
                  🔍 Trouver remplaçant
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{label}</p>
      <p style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500', margin: '2px 0 0 0' }}>
        {value}
      </p>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
