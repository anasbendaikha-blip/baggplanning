'use client'

import Link from 'next/link'
import {
  MOCK_STATS,
  MOCK_DEMANDES,
  MOCK_DISPONIBILITES,
  SEMAINE_REFERENCE,
  getUrgentDemandes,
  getRoleColor,
  getRoleIcon,
} from '@/lib/mock-data'

// ============================================================
// 📁 app/titulaire/page.tsx
// ============================================================
// Dashboard principal du titulaire
// Vue d'ensemble avec KPIs et alertes
// ============================================================

export default function TitulaireDashboardPage() {
  const urgentDemandes = getUrgentDemandes()
  const nonRepondus = MOCK_DISPONIBILITES.filter(d => !d.has_submitted)

  return (
    <div>
      {/* Titre de page */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
          Tableau de bord
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
          Semaine du {SEMAINE_REFERENCE.jours[0]} au {SEMAINE_REFERENCE.jours[5]} {SEMAINE_REFERENCE.mois}
        </p>
      </div>

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* KPI Disponibilités */}
        <Link href="/titulaire/disponibilites" style={{ textDecoration: 'none' }}>
          <KPICard
            icon="📅"
            title="Disponibilités"
            value={`${MOCK_STATS.disponibilites.repondu}/${MOCK_STATS.disponibilites.total}`}
            subtitle={`${MOCK_STATS.disponibilites.taux}% de réponses`}
            color="#10b981"
            alert={MOCK_STATS.disponibilites.en_attente > 0}
          />
        </Link>

        {/* KPI Demandes */}
        <Link href="/titulaire/demandes" style={{ textDecoration: 'none' }}>
          <KPICard
            icon="📋"
            title="Demandes"
            value={String(MOCK_STATS.demandes.en_attente)}
            subtitle={`${MOCK_STATS.demandes.urgentes} urgente(s)`}
            color="#f59e0b"
            alert={MOCK_STATS.demandes.urgentes > 0}
          />
        </Link>

        {/* KPI Planning */}
        <Link href="/titulaire/planning" style={{ textDecoration: 'none' }}>
          <KPICard
            icon="📆"
            title="Planning"
            value={MOCK_STATS.planning.semaine_complete ? 'Complet' : 'Incomplet'}
            subtitle={`${MOCK_STATS.planning.jours_complets}/6 jours`}
            color={MOCK_STATS.planning.semaine_complete ? '#10b981' : '#ef4444'}
            alert={!MOCK_STATS.planning.semaine_complete}
          />
        </Link>

        {/* KPI Équipe */}
        <Link href="/titulaire/equipe" style={{ textDecoration: 'none' }}>
          <KPICard
            icon="👥"
            title="Équipe"
            value={String(MOCK_STATS.equipe.total)}
            subtitle="employés actifs"
            color="#3b82f6"
          />
        </Link>
      </div>

      {/* Grille principale */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
      }}>
        {/* Alertes urgentes */}
        <div style={{
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
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            🚨 Alertes urgentes
            {(urgentDemandes.length > 0 || nonRepondus.length > 0) && (
              <span style={{
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '12px',
              }}>
                {urgentDemandes.length + nonRepondus.length}
              </span>
            )}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Demandes urgentes */}
            {urgentDemandes.map(demande => (
              <AlertItem
                key={demande.id}
                type="danger"
                icon={demande.type === 'maladie' ? '🏥' : '🏖️'}
                title={`${demande.employee_name} - ${demande.type === 'maladie' ? 'Maladie' : 'Congé urgent'}`}
                subtitle={`${demande.date} • ${demande.creneau}`}
              />
            ))}

            {/* Non répondus */}
            {nonRepondus.map(dispo => (
              <AlertItem
                key={dispo.employee_id}
                type="warning"
                icon="⏳"
                title={`${dispo.employee_name} n'a pas répondu`}
                subtitle="Disponibilités en attente"
              />
            ))}

            {urgentDemandes.length === 0 && nonRepondus.length === 0 && (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                ✅ Aucune alerte urgente
              </p>
            )}
          </div>
        </div>

        {/* Demandes en attente */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px',
          }}>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#1e293b',
              margin: 0,
            }}>
              📋 Demandes en attente
            </h2>
            <Link 
              href="/titulaire/demandes"
              style={{
                fontSize: '13px',
                color: '#3b82f6',
                textDecoration: 'none',
              }}
            >
              Voir tout →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {MOCK_DEMANDES.filter(d => d.status === 'pending').slice(0, 3).map(demande => (
              <DemandeItem key={demande.id} demande={demande} />
            ))}

            {MOCK_DEMANDES.filter(d => d.status === 'pending').length === 0 && (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                ✅ Aucune demande en attente
              </p>
            )}
          </div>
        </div>

        {/* Récap équipe */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          gridColumn: 'span 2',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px',
          }}>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#1e293b',
              margin: 0,
            }}>
              👥 Récapitulatif équipe
            </h2>
            <Link 
              href="/titulaire/equipe"
              style={{
                fontSize: '13px',
                color: '#3b82f6',
                textDecoration: 'none',
              }}
            >
              Gérer l'équipe →
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '16px',
          }}>
            <EquipeStatCard
              icon={getRoleIcon('Pharmacien')}
              label="Pharmaciens"
              count={MOCK_STATS.equipe.pharmaciens}
              color={getRoleColor('Pharmacien')}
            />
            <EquipeStatCard
              icon={getRoleIcon('Preparateur')}
              label="Préparateurs"
              count={MOCK_STATS.equipe.preparateurs}
              color={getRoleColor('Preparateur')}
            />
            <EquipeStatCard
              icon={getRoleIcon('Apprenti')}
              label="Apprentis"
              count={MOCK_STATS.equipe.apprentis}
              color={getRoleColor('Apprenti')}
            />
            <EquipeStatCard
              icon={getRoleIcon('Etudiant')}
              label="Étudiants"
              count={MOCK_STATS.equipe.etudiants}
              color={getRoleColor('Etudiant')}
            />
            <EquipeStatCard
              icon={getRoleIcon('Conditionneur')}
              label="Conditionneurs"
              count={MOCK_STATS.equipe.conditionneurs}
              color={getRoleColor('Conditionneur')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COMPOSANTS
// ============================================================

function KPICard({ 
  icon, 
  title, 
  value, 
  subtitle, 
  color, 
  alert 
}: { 
  icon: string
  title: string
  value: string
  subtitle: string
  color: string
  alert?: boolean
}) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: alert ? `2px solid ${color}` : '1px solid #e2e8f0',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '24px' }}>{icon}</span>
        {alert && (
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: color,
            animation: 'pulse 2s infinite',
          }} />
        )}
      </div>
      <p style={{ fontSize: '13px', color: '#64748b', margin: '12px 0 4px 0' }}>{title}</p>
      <p style={{ fontSize: '28px', fontWeight: 'bold', color: color, margin: 0 }}>{value}</p>
      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>{subtitle}</p>
    </div>
  )
}

function AlertItem({ 
  type, 
  icon, 
  title, 
  subtitle 
}: { 
  type: 'danger' | 'warning'
  icon: string
  title: string
  subtitle: string
}) {
  const bgColor = type === 'danger' ? '#fef2f2' : '#fffbeb'
  const borderColor = type === 'danger' ? '#fecaca' : '#fde68a'
  
  return (
    <div style={{
      padding: '12px',
      backgroundColor: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <div>
        <p style={{ fontWeight: '500', color: '#1e293b', margin: 0, fontSize: '14px' }}>{title}</p>
        <p style={{ color: '#64748b', margin: 0, fontSize: '12px' }}>{subtitle}</p>
      </div>
    </div>
  )
}

function DemandeItem({ demande }: { demande: typeof MOCK_DEMANDES[0] }) {
  const typeConfig = {
    conge: { icon: '🏖️', color: '#3b82f6', label: 'Congé' },
    echange: { icon: '🔄', color: '#8b5cf6', label: 'Échange' },
    maladie: { icon: '🏥', color: '#ef4444', label: 'Maladie' },
  }
  
  const config = typeConfig[demande.type]
  
  return (
    <div style={{
      padding: '12px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: config.color + '20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
        }}>
          {config.icon}
        </div>
        <div>
          <p style={{ fontWeight: '500', color: '#1e293b', margin: 0, fontSize: '14px' }}>
            {demande.employee_name}
            {demande.urgent && <span style={{ marginLeft: '8px', color: '#ef4444' }}>⚠️</span>}
          </p>
          <p style={{ color: '#64748b', margin: 0, fontSize: '12px' }}>
            {config.label} • {demande.date}
          </p>
        </div>
      </div>
      <span style={{
        padding: '4px 10px',
        backgroundColor: config.color + '20',
        color: config.color,
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500',
      }}>
        {config.label}
      </span>
    </div>
  )
}

function EquipeStatCard({ 
  icon, 
  label, 
  count, 
  color 
}: { 
  icon: string
  label: string
  count: number
  color: string
}) {
  return (
    <div style={{
      padding: '16px',
      backgroundColor: color + '10',
      borderRadius: '10px',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <p style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        color: color, 
        margin: '8px 0 4px 0' 
      }}>
        {count}
      </p>
      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{label}</p>
    </div>
  )
}
