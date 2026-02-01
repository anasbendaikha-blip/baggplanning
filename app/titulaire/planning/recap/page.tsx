'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  MOCK_EMPLOYEES,
  MOCK_DISPONIBILITES,
  MOCK_DEMANDES,
  MOCK_GARDES,
  MOCK_PLANNING_BY_DAY,
  JOURS_SEMAINE,
  SEMAINE_REFERENCE,
  getRoleColor,
  getRoleLabel,
  getRoleIcon,
  EmployeeRole,
  MockEmployee,
} from '@/lib/mock-data'
import { calculateHours, formatHours, parseHoraire } from '@/lib/planning'
import { getWeekStart, formatWeekRange, getWeekDates, addWeeks } from '@/lib/date-utils'

// ============================================================
// 📁 app/titulaire/planning/recap/page.tsx
// ============================================================
// Page Récapitulatif de la semaine
// KPIs + Couverture par jour + Heures par employé
// ============================================================

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const TXT = { primary: '#111827', secondary: '#374151', muted: '#6b7280' }

export default function RecapPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date(2026, 0, 26)))
  const weekLabel = formatWeekRange(weekStart)

  // ============================================================
  // CALCULS KPIs
  // ============================================================

  // Étudiants avec disponibilités
  const studentStats = useMemo(() => {
    const students = MOCK_DISPONIBILITES.filter(d => {
      const emp = MOCK_EMPLOYEES.find(e => e.id === d.employee_id)
      return emp?.fonction === 'Etudiant'
    })
    const total = students.length
    const withResponse = students.filter(s => s.has_submitted).length
    return { total, withResponse, pending: total - withResponse }
  }, [])

  // Demandes en attente
  const pendingDemandes = useMemo(() => {
    return MOCK_DEMANDES.filter(d => d.status === 'pending')
  }, [])

  // Couverture par jour (alertes)
  const getDayCoverage = (dayIndex: number): { status: 'ok' | 'warning'; note: string } => {
    const dayKey = JOURS_SEMAINE[dayIndex]
    const daySlots = MOCK_PLANNING_BY_DAY[dayKey] || []
    
    if (daySlots.length === 0) {
      return { status: 'warning', note: 'Aucun créneau' }
    }

    // Vérifier s'il y a assez de monde aux heures de pointe (16h-18h)
    const peakHourSlots = daySlots.filter(slot => {
      if (slot.is_conge) return false
      const startH = parseInt(slot.start_time.split(':')[0])
      const endH = parseInt(slot.end_time.split(':')[0])
      return startH <= 16 && endH >= 18
    })

    if (peakHourSlots.length < 3) {
      return { status: 'warning', note: 'Sous-effectif 16h-18h' }
    }

    // Vérifier s'il y a un pharmacien
    const hasPharmacist = daySlots.some(s => !s.is_conge && s.role === 'Pharmacien')
    if (!hasPharmacist) {
      return { status: 'warning', note: 'Aucun pharmacien' }
    }

    return { status: 'ok', note: 'Couverture OK' }
  }

  const alertsCount = useMemo(() => {
    return DAYS.map((_, i) => getDayCoverage(i)).filter(c => c.status === 'warning').length
  }, [])

  // Gardes
  const guardsCount = MOCK_GARDES.length

  // ============================================================
  // CALCUL HEURES PAR EMPLOYÉ
  // ============================================================

  const employeeHours = useMemo(() => {
    const result: Array<{
      id: string
      prenom: string
      nom: string
      initiales: string
      fonction: EmployeeRole
      hours: number
    }> = []

    MOCK_EMPLOYEES.filter(e => e.actif).forEach(emp => {
      let total = 0

      // Calculer depuis les horaires de la semaine
      JOURS_SEMAINE.forEach(jour => {
        const horaire = emp.horaires[jour]
        const parsed = parseHoraire(horaire)
        if (parsed) {
          // Pause de 30 min si journée > 6h
          const rawHours = calculateHours(parsed.start, parsed.end, 0)
          const pauseMin = rawHours > 6 ? 30 : 0
          total += calculateHours(parsed.start, parsed.end, pauseMin)
        }
      })

      // Ajouter les gardes si pharmacien
      if (emp.fonction === 'Pharmacien') {
        MOCK_GARDES.forEach(garde => {
          if (garde.pharmacien_name.toLowerCase() === emp.prenom.toLowerCase()) {
            // Garde soir: 4h, nuit: 8h, dimanche: 10h
            switch (garde.type) {
              case 'soir': total += 4; break
              case 'nuit': total += 8; break
              case 'dimanche': total += 10; break
            }
          }
        })
      }

      if (total > 0) {
        result.push({
          id: emp.id,
          prenom: emp.prenom,
          nom: emp.nom || '',
          initiales: emp.initiales,
          fonction: emp.fonction,
          hours: total,
        })
      }
    })

    // Trier par heures décroissantes
    return result.sort((a, b) => b.hours - a.hours)
  }, [])

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* HEADER */}
      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: TXT.primary, margin: '0 0 8px 0' }}>
              📊 Récapitulatif de la semaine
            </h1>
            <p style={{ fontSize: '16px', color: TXT.secondary, margin: 0 }}>
              Semaine du {weekLabel}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              href="/titulaire/planning"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: TXT.primary,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              ← Retour planning
            </Link>
            <Link
              href="/titulaire/gardes"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#7c3aed',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              🌙 Gardes
            </Link>
          </div>
        </div>

        {/* Navigation semaine */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, -1))}
            style={{
              width: '36px',
              height: '36px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              color: TXT.primary,
              fontSize: '16px',
            }}
          >
            ←
          </button>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            style={{
              width: '36px',
              height: '36px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              color: TXT.primary,
              fontSize: '16px',
            }}
          >
            →
          </button>
          <button
            onClick={() => setWeekStart(getWeekStart(new Date(2026, 0, 26)))}
            style={{
              padding: '8px 12px',
              background: '#dbeafe',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: '#2563eb',
            }}
          >
            Semaine actuelle
          </button>
        </div>
      </header>

      {/* KPIs - 4 CARTES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {/* Réponses dispo */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '13px', color: '#166534', fontWeight: '500', marginBottom: '8px' }}>
            🎓 Réponses dispo
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#166534', marginBottom: '4px' }}>
            {studentStats.withResponse}/{studentStats.total}
          </div>
          <div style={{ fontSize: '13px', color: '#15803d' }}>
            {studentStats.pending} en attente
          </div>
          <Link
            href="/titulaire/disponibilites"
            style={{
              display: 'inline-block',
              marginTop: '12px',
              padding: '6px 12px',
              background: 'white',
              border: '1px solid #86efac',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              color: '#166534',
              textDecoration: 'none',
            }}
          >
            Voir les disponibilités
          </Link>
        </div>

        {/* Demandes */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '1px solid #fcd34d',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '13px', color: '#92400e', fontWeight: '500', marginBottom: '8px' }}>
            📝 Demandes
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>
            {pendingDemandes.length}
          </div>
          <div style={{ fontSize: '13px', color: '#b45309' }}>
            à traiter
          </div>
          <Link
            href="/titulaire/demandes"
            style={{
              display: 'inline-block',
              marginTop: '12px',
              padding: '6px 12px',
              background: 'white',
              border: '1px solid #fbbf24',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              color: '#92400e',
              textDecoration: 'none',
            }}
          >
            Voir les demandes
          </Link>
        </div>

        {/* Alertes planning */}
        <div style={{
          background: alertsCount > 0
            ? 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)'
            : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: `1px solid ${alertsCount > 0 ? '#fca5a5' : '#bbf7d0'}`,
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '13px', color: alertsCount > 0 ? '#991b1b' : '#166534', fontWeight: '500', marginBottom: '8px' }}>
            ⚠️ Alertes planning
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: alertsCount > 0 ? '#991b1b' : '#166534', marginBottom: '4px' }}>
            {alertsCount}
          </div>
          <div style={{ fontSize: '13px', color: alertsCount > 0 ? '#b91c1c' : '#15803d' }}>
            {alertsCount > 0 ? 'à vérifier' : 'tout OK'}
          </div>
          <Link
            href="/titulaire/planning"
            style={{
              display: 'inline-block',
              marginTop: '12px',
              padding: '6px 12px',
              background: 'white',
              border: `1px solid ${alertsCount > 0 ? '#f87171' : '#86efac'}`,
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              color: alertsCount > 0 ? '#991b1b' : '#166534',
              textDecoration: 'none',
            }}
          >
            Voir le planning
          </Link>
        </div>

        {/* Gardes */}
        <div style={{
          background: 'linear-gradient(135deg, #f5f3ff 0%, #e9d5ff 100%)',
          border: '1px solid #c4b5fd',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '13px', color: '#5b21b6', fontWeight: '500', marginBottom: '8px' }}>
            🌙 Gardes
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#5b21b6', marginBottom: '4px' }}>
            {guardsCount}
          </div>
          <div style={{ fontSize: '13px', color: '#6d28d9' }}>
            planifiées
          </div>
          <Link
            href="/titulaire/gardes"
            style={{
              display: 'inline-block',
              marginTop: '12px',
              padding: '6px 12px',
              background: 'white',
              border: '1px solid #a78bfa',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              color: '#5b21b6',
              textDecoration: 'none',
            }}
          >
            Ouvrir Gardes
          </Link>
        </div>
      </div>

      {/* PANELS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        
        {/* Couverture par jour */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <header style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: TXT.primary, margin: 0 }}>
              📌 Couverture par jour
            </h3>
            <span style={{
              padding: '4px 10px',
              background: '#f1f5f9',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              color: TXT.muted,
            }}>
              Semaine
            </span>
          </header>
          <div style={{ padding: '16px 20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', fontWeight: '600', color: TXT.secondary }}>Jour</th>
                  <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', fontWeight: '600', color: TXT.secondary }}>Statut</th>
                  <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', fontWeight: '600', color: TXT.secondary }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, index) => {
                  const coverage = getDayCoverage(index)
                  return (
                    <tr key={day} style={{ borderBottom: index < 5 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '12px 0', fontSize: '14px', color: TXT.primary, fontWeight: '500' }}>{day}</td>
                      <td style={{ padding: '12px 0' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: coverage.status === 'ok' ? '#dcfce7' : '#fef3c7',
                          color: coverage.status === 'ok' ? '#166534' : '#92400e',
                        }}>
                          {coverage.status === 'ok' ? '✓ OK' : '⚠️ À vérifier'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 0', fontSize: '13px', color: TXT.muted }}>{coverage.note}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dernières actions */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <header style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: TXT.primary, margin: 0 }}>
              📝 Dernières actions
            </h3>
            <span style={{
              padding: '4px 10px',
              background: '#f1f5f9',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              color: TXT.muted,
            }}>
              Journal
            </span>
          </header>
          <div style={{ padding: '16px 20px' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '14px', color: TXT.secondary }}>
                  Planning sauvegardé (Samedi 31 janvier)
                </span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ fontSize: '14px', color: TXT.secondary }}>
                  {studentStats.pending} disponibilités en attente
                </span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                <span style={{ fontSize: '14px', color: TXT.secondary }}>
                  {pendingDemandes.length} demandes à traiter
                </span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} />
                <span style={{ fontSize: '14px', color: TXT.secondary }}>
                  {guardsCount} gardes planifiées ce mois
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* HEURES PAR EMPLOYÉ */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <header style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: TXT.primary, margin: 0 }}>
              ⏱ Heures par employé (semaine)
            </h3>
            <span style={{
              padding: '4px 10px',
              background: '#dbeafe',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              color: '#1d4ed8',
            }}>
              {employeeHours.length} employés
            </span>
          </div>
          <span style={{
            padding: '4px 10px',
            background: '#f1f5f9',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            color: TXT.muted,
          }}>
            {weekLabel}
          </span>
        </header>
        <div style={{ padding: '16px 20px' }}>
          {employeeHours.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: TXT.muted }}>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Aucune heure enregistrée cette semaine.
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
                Les heures apparaîtront une fois les créneaux assignés.
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '13px', fontWeight: '600', color: TXT.secondary }}>Employé</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '13px', fontWeight: '600', color: TXT.secondary }}>Fonction</th>
                  <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '13px', fontWeight: '600', color: TXT.secondary }}>Heures</th>
                </tr>
              </thead>
              <tbody>
                {employeeHours.map((emp, idx) => (
                  <tr key={emp.id} style={{ borderBottom: idx < employeeHours.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '14px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: getRoleColor(emp.fonction),
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '12px',
                        }}>
                          {emp.initiales}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: TXT.primary, fontSize: '14px' }}>
                            {emp.prenom} {emp.nom}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 0' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        background: `${getRoleColor(emp.fonction)}15`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: getRoleColor(emp.fonction),
                      }}>
                        {getRoleIcon(emp.fonction)} {getRoleLabel(emp.fonction)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 0', textAlign: 'right' }}>
                      <span style={{
                        fontWeight: '700',
                        fontSize: '15px',
                        color: emp.hours > 44 ? '#dc2626' : emp.hours > 39 ? '#f59e0b' : TXT.primary,
                      }}>
                        {formatHours(emp.hours)}
                      </span>
                      {emp.hours > 44 && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#dc2626' }}>⚠️</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* TOTAL */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        background: '#f8fafc',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '14px', color: TXT.muted, marginBottom: '4px' }}>Total heures équipe</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: TXT.primary }}>
            {formatHours(employeeHours.reduce((sum, e) => sum + e.hours, 0))}
          </div>
        </div>
        <Link
          href="/titulaire/planning"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: '#2563eb',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          📅 Voir le planning complet
        </Link>
      </div>
    </div>
  )
}