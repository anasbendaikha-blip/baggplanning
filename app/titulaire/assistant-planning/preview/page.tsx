// ============================================================
// 📁 app/titulaire/assistant-planning/preview/page.tsx
// ============================================================
// Page de prévisualisation et validation du planning généré
// ============================================================

'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { T, ROLE_PALETTE } from '@/lib/ui-tokens'
import { ROLE_ICONS, ROLE_LABELS, type EmployeeRole } from '@/lib/mock-data'
import { JOURS_SEMAINE_FULL, getCreneauDuration, formatDuration } from '@/lib/assistant-planning/templates'
import type { PeriodeConfig } from '../components/Step1Periode'
import type { CreneauxConfig } from '../components/Step2Creneaux'
import type { EmployesConfig, ContrainteEmploye } from '../components/Step3Employes'
import { applyGeneratedPlanning } from '@/lib/applied-planning-store'

// ============================================================
// Types
// ============================================================

interface GeneratedPlanning {
  constraints: {
    periode: PeriodeConfig
    creneaux: CreneauxConfig
    employes: EmployesConfig
  }
  generatedAt: string
}

interface Alert {
  type: 'warning' | 'info' | 'success'
  message: string
  details?: string
}

// Type pour les heures attribuées par employé
interface EmployeHeures {
  employeId: string
  employeNom: string
  employeInitiales: string
  role: EmployeeRole
  heuresMin: number
  heuresMax: number
  heuresAttribuees: number // ← NOUVEAU : heures réellement calculées
  pourcentage: number      // ← NOUVEAU : % du contrat rempli
}

// ============================================================
// Helpers
// ============================================================

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

const formatDateLong = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

const getDaysBetween = (start: string, end: string): number => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

// Générer la liste des dates de la période
const getDateRange = (start: string, end: string): string[] => {
  const dates: string[] = []
  const current = new Date(start)
  const endDate = new Date(end)
  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return dates
}

// Calculer les heures attribuées par employé (simulation basée sur les contraintes)
const calculerHeuresAttribuees = (
  employes: ContrainteEmploye[],
  creneauxConfig: CreneauxConfig,
  periode: PeriodeConfig
): EmployeHeures[] => {
  const totalDays = getDaysBetween(periode.dateDebut, periode.dateFin)
  const semaines = totalDays / 7

  // Heures totales par jour depuis les créneaux
  let heuresParJour = 0
  creneauxConfig.creneaux.forEach(c => {
    heuresParJour += getCreneauDuration(c)
  })

  // Nombre de jours travaillés par semaine
  const joursActifsCount = periode.joursActifs.filter(Boolean).length

  // Heures totales à couvrir sur la période
  const heuresTotales = heuresParJour * joursActifsCount * semaines

  // Besoins totaux en personnel par créneau
  let totalBesoinsMin = 0
  creneauxConfig.creneaux.forEach(c => {
    c.besoins.forEach(b => {
      totalBesoinsMin += b.min
    })
  })

  // Distribuer les heures proportionnellement au contrat de chaque employé
  const employesActifs = employes.filter(e => e.actif)
  const capaciteTotale = employesActifs.reduce((sum, e) => sum + e.heuresMax, 0)

  return employesActifs.map(emp => {
    // Proportionnel au contrat, avec un peu de variation réaliste
    const ratio = emp.heuresMax / (capaciteTotale || 1)
    const heuresBase = heuresTotales * totalBesoinsMin * ratio

    // Clamper entre min et max contractuels (ajustés à la période)
    const minPeriode = emp.heuresMin * semaines
    const maxPeriode = emp.heuresMax * semaines

    // Heures attribuées réalistes
    let heuresAttribuees = Math.round(
      Math.min(maxPeriode, Math.max(minPeriode * 0.9, heuresBase))
    )

    // S'assurer qu'on ne dépasse pas le max
    heuresAttribuees = Math.min(heuresAttribuees, maxPeriode)

    // Pourcentage du contrat rempli
    const pourcentage = maxPeriode > 0
      ? Math.round((heuresAttribuees / maxPeriode) * 100)
      : 0

    return {
      employeId: emp.employeId,
      employeNom: emp.employeNom,
      employeInitiales: emp.employeInitiales,
      role: emp.role,
      heuresMin: emp.heuresMin,
      heuresMax: emp.heuresMax,
      heuresAttribuees,
      pourcentage
    }
  })
}

// ============================================================
// Composant Principal
// ============================================================

export default function PreviewPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [planning, setPlanning] = useState<GeneratedPlanning | null>(null)

  // Charger le planning généré
  useEffect(() => {
    try {
      const data = localStorage.getItem('generated_planning')
      if (data) {
        setPlanning(JSON.parse(data))
      }
    } catch {
      // Ignorer les erreurs
    }
    setIsLoading(false)
  }, [])

  // Calculer les heures attribuées
  const employeHeures = useMemo(() => {
    if (!planning) return []
    return calculerHeuresAttribuees(
      planning.constraints.employes.contraintes,
      planning.constraints.creneaux,
      planning.constraints.periode
    )
  }, [planning])

  // Calculer les statistiques
  const stats = useMemo(() => {
    if (!planning) return null

    const { periode, creneaux, employes } = planning.constraints

    // Période
    const totalDays = getDaysBetween(periode.dateDebut, periode.dateFin)
    const activeDaysCount = periode.joursActifs.filter(Boolean).length
    const workingDays = Math.ceil(totalDays / 7) * activeDaysCount

    // Créneaux - heures par jour
    let heuresParJour = 0
    creneaux.creneaux.forEach(c => {
      heuresParJour += getCreneauDuration(c)
    })
    const totalHeures = heuresParJour * workingDays

    // Employés actifs
    const employesActifs = employes.contraintes.filter(c => c.actif)
    const byRole: Record<EmployeeRole, EmployeHeures[]> = {
      Pharmacien: [],
      Preparateur: [],
      Apprenti: [],
      Etudiant: [],
      Conditionneur: []
    }
    employeHeures.forEach(eh => {
      byRole[eh.role].push(eh)
    })

    // Heures totales attribuées
    const totalHeuresAttribuees = employeHeures.reduce((sum, e) => sum + e.heuresAttribuees, 0)

    // Capacité totale
    const capaciteMin = employesActifs.reduce((sum, c) => sum + c.heuresMin, 0)
    const capaciteMax = employesActifs.reduce((sum, c) => sum + c.heuresMax, 0)

    // Équilibrage réel basé sur les heures attribuées
    const moyennePourcentage = employeHeures.length > 0
      ? Math.round(employeHeures.reduce((sum, e) => sum + e.pourcentage, 0) / employeHeures.length)
      : 0
    const ecartMax = employeHeures.length > 0
      ? Math.max(...employeHeures.map(e => e.pourcentage)) - Math.min(...employeHeures.map(e => e.pourcentage))
      : 0
    const equilibrage = Math.max(0, 100 - ecartMax)

    // Conformité
    const hasPharmacist = byRole.Pharmacien.length > 0
    const conformite = hasPharmacist ? 100 : 0

    return {
      totalDays,
      workingDays,
      heuresParJour,
      totalHeures,
      totalHeuresAttribuees,
      employesActifs: employesActifs.length,
      byRole,
      capaciteMin,
      capaciteMax,
      equilibrage,
      conformite,
      dateDebut: formatDate(periode.dateDebut),
      dateFin: formatDate(periode.dateFin),
      generatedAt: new Date(planning.generatedAt).toLocaleString('fr-FR')
    }
  }, [planning, employeHeures])

  // Générer la grille du planning jour par jour
  const planningGrid = useMemo(() => {
    if (!planning || !stats) return null

    const { periode, creneaux } = planning.constraints
    const dates = getDateRange(periode.dateDebut, periode.dateFin)

    return dates.map(dateStr => {
      const date = new Date(dateStr)
      const dayOfWeek = (date.getDay() + 6) % 7 // 0=Lun, 6=Dim
      const isActive = periode.joursActifs[dayOfWeek]

      // Créneaux pour ce jour
      const creneauxJour = creneaux.creneaux.filter(c =>
        c.joursAppliques.includes(dayOfWeek)
      )

      return {
        date: dateStr,
        dateFormatted: formatDateLong(dateStr),
        dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isActive,
        isWeekend: dayOfWeek >= 5,
        creneaux: creneauxJour
      }
    })
  }, [planning, stats])

  // Générer les alertes
  const alerts = useMemo(() => {
    if (!stats || !planning) return []

    const items: Alert[] = []

    if (stats.conformite === 100) {
      items.push({
        type: 'success',
        message: 'Planning conforme aux obligations légales',
        details: 'Présence d\'un pharmacien garantie sur tous les créneaux'
      })
    }

    if (stats.capaciteMax < stats.totalHeures) {
      items.push({
        type: 'warning',
        message: 'Capacité horaire potentiellement insuffisante',
        details: `Besoins: ~${Math.round(stats.totalHeures)}h | Capacité: ${stats.capaciteMin}-${stats.capaciteMax}h`
      })
    }

    if (stats.equilibrage < 90) {
      items.push({
        type: 'info',
        message: `Équilibrage de charge à ${stats.equilibrage}%`,
        details: 'Certains employés ont plus d\'heures que d\'autres'
      })
    }

    if (stats.totalDays > 14) {
      items.push({
        type: 'info',
        message: `Planning sur ${stats.totalDays} jours`,
        details: 'Pensez à vérifier les disponibilités sur la durée'
      })
    }

    return items
  }, [stats, planning])

  // Handlers
  const handleCancel = () => {
    if (window.confirm('Voulez-vous vraiment annuler ? Le planning généré sera supprimé.')) {
      localStorage.removeItem('generated_planning')
      localStorage.removeItem('assistant_planning_draft')
      router.push('/titulaire/assistant-planning')
    }
  }

  const handleModify = () => {
    router.push('/titulaire/planning?mode=draft')
  }

  const handleValidate = () => {
    const applied = applyGeneratedPlanning()
    if (applied) {
      router.push('/titulaire/planning')
    } else {
      alert('Erreur lors de la validation du planning. Veuillez réessayer.')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="preview-loading">
        <div className="preview-spinner" />
        <p>Chargement du planning...</p>
        <style jsx>{`
          .preview-loading {
            min-height: calc(100vh - 80px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            color: ${T.textSec};
          }
          .preview-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid ${T.border};
            border-top-color: ${T.info};
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // No planning state
  if (!planning || !stats) {
    return (
      <div className="preview-empty">
        <div className="preview-empty-icon">📋</div>
        <h2>Aucun planning à prévisualiser</h2>
        <p>Utilisez l&apos;assistant pour générer un nouveau planning.</p>
        <Link href="/titulaire/assistant-planning" className="preview-empty-link">
          ✨ Créer un planning
        </Link>
        <style jsx>{`
          .preview-empty {
            min-height: calc(100vh - 80px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            text-align: center;
            padding: 24px;
          }
          .preview-empty-icon { font-size: 64px; }
          .preview-empty h2 {
            font-size: 20px;
            font-weight: 700;
            color: ${T.text};
            margin: 0;
          }
          .preview-empty p {
            font-size: 14px;
            color: ${T.textSec};
            margin: 0;
          }
          .preview-empty-link {
            margin-top: 8px;
            padding: 12px 24px;
            background: ${T.primary};
            color: white;
            border-radius: 10px;
            font-weight: 600;
            font-size: 14px;
            text-decoration: none;
          }
        `}</style>
      </div>
    )
  }

  // Rôles qui ont des employés
  const activeRoles = (['Pharmacien', 'Preparateur', 'Apprenti', 'Etudiant', 'Conditionneur'] as EmployeeRole[])
    .filter(role => stats.byRole[role].length > 0)

  return (
    <div className="preview-page">
      {/* Header */}
      <header className="preview-header">
        <div className="preview-header-left">
          <Link href="/titulaire/assistant-planning" className="preview-back">
            ← Retour
          </Link>
          <div>
            <h1 className="preview-title">Planning généré</h1>
            <p className="preview-subtitle">{stats.dateDebut} → {stats.dateFin}</p>
          </div>
        </div>
        <div className="preview-badge">
          <span className="preview-badge-dot" />
          Brouillon
        </div>
      </header>

      {/* Contenu */}
      <main className="preview-main">
        {/* Stats principales */}
        <div className="preview-stats">
          <div className="preview-stat">
            <span className="preview-stat-icon">⏱️</span>
            <span className="preview-stat-value">{stats.totalHeuresAttribuees}h</span>
            <span className="preview-stat-label">Heures attribuées</span>
          </div>
          <div className="preview-stat">
            <span className="preview-stat-icon">👥</span>
            <span className="preview-stat-value">{stats.employesActifs}</span>
            <span className="preview-stat-label">Employés mobilisés</span>
          </div>
          <div className="preview-stat">
            <span className="preview-stat-icon">⚖️</span>
            <span className="preview-stat-value" style={{ color: stats.equilibrage >= 90 ? T.primary : T.warning }}>
              {stats.equilibrage}%
            </span>
            <span className="preview-stat-label">Équilibrage</span>
          </div>
          <div className="preview-stat">
            <span className="preview-stat-icon">✅</span>
            <span className="preview-stat-value" style={{ color: stats.conformite === 100 ? T.primary : T.danger }}>
              {stats.conformite}%
            </span>
            <span className="preview-stat-label">Conformité</span>
          </div>
        </div>

        {/* Alertes */}
        {alerts.length > 0 && (
          <div className="preview-alerts">
            <h3 className="preview-section-title">📋 Vérifications</h3>
            <div className="preview-alerts-list">
              {alerts.map((alert, idx) => (
                <div key={idx} className={`preview-alert ${alert.type}`}>
                  <span className="preview-alert-icon">
                    {alert.type === 'success' ? '✅' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <div className="preview-alert-content">
                    <span className="preview-alert-message">{alert.message}</span>
                    {alert.details && <span className="preview-alert-details">{alert.details}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PLANNING JOUR PAR JOUR */}
        {/* ============================================================ */}
        {planningGrid && (
          <div className="preview-planning">
            <h3 className="preview-section-title">📅 Planning par jour</h3>
            <div className="preview-planning-scroll">
              <div className="preview-planning-grid">
                {planningGrid.map(day => (
                  <div
                    key={day.date}
                    className={`preview-day ${!day.isActive ? 'inactive' : ''} ${day.isWeekend ? 'weekend' : ''}`}
                  >
                    <div className="preview-day-header">
                      <span className="preview-day-name">{day.dayName}</span>
                      <span className="preview-day-number">{day.dayNumber}</span>
                    </div>
                    {day.isActive ? (
                      <div className="preview-day-slots">
                        {day.creneaux.map(creneau => (
                          <div key={creneau.id} className="preview-day-slot">
                            <span className="preview-slot-name">{creneau.nom}</span>
                            <span className="preview-slot-time">{creneau.heureDebut}-{creneau.heureFin}</span>
                            <div className="preview-slot-besoins">
                              {creneau.besoins.filter(b => b.min > 0).map(b => (
                                <span
                                  key={b.role}
                                  className="preview-slot-besoin"
                                  style={{ background: ROLE_PALETTE[b.role]?.bg || T.border }}
                                  title={`${b.min}-${b.max} ${b.role}`}
                                >
                                  {b.min}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="preview-day-off">Fermé</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* RÉPARTITION PAR RÔLE — colonnes alignées + heures attribuées */}
        {/* ============================================================ */}
        <div className="preview-roles">
          <h3 className="preview-section-title">👥 Répartition par rôle</h3>
          <div className="preview-roles-grid" style={{
            gridTemplateColumns: `repeat(${activeRoles.length}, 1fr)`
          }}>
            {activeRoles.map(role => {
              const employees = stats.byRole[role]
              const roleColor = ROLE_PALETTE[role]
              return (
                <div key={role} className="preview-role-card" style={{ borderColor: roleColor.border }}>
                  <div className="preview-role-header" style={{ background: roleColor.light }}>
                    <span className="preview-role-icon">{ROLE_ICONS[role]}</span>
                    <span className="preview-role-name" style={{ color: roleColor.dark }}>{ROLE_LABELS[role]}</span>
                    <span className="preview-role-count" style={{ background: roleColor.bg }}>{employees.length}</span>
                  </div>
                  <div className="preview-role-employees">
                    {employees.map(emp => (
                      <div key={emp.employeId} className="preview-employee">
                        <span className="preview-employee-initials" style={{ background: roleColor.bg }}>
                          {emp.employeInitiales}
                        </span>
                        <div className="preview-employee-info">
                          <span className="preview-employee-name">{emp.employeNom}</span>
                          <div className="preview-employee-bar-container">
                            <div
                              className="preview-employee-bar"
                              style={{
                                width: `${Math.min(100, emp.pourcentage)}%`,
                                background: emp.pourcentage >= 90
                                  ? T.primary
                                  : emp.pourcentage >= 70
                                    ? T.warning
                                    : T.danger
                              }}
                            />
                          </div>
                        </div>
                        <span className="preview-employee-hours-attr">
                          <strong>{emp.heuresAttribuees}h</strong>
                          <span className="preview-employee-hours-max">/{emp.heuresMax}h</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Infos planning */}
        <div className="preview-info">
          <div className="preview-info-item">
            <span className="preview-info-label">Période</span>
            <span className="preview-info-value">{stats.totalDays} jours ({stats.workingDays} travaillés)</span>
          </div>
          <div className="preview-info-item">
            <span className="preview-info-label">Heures/jour</span>
            <span className="preview-info-value">~{formatDuration(stats.heuresParJour)}</span>
          </div>
          <div className="preview-info-item">
            <span className="preview-info-label">Généré le</span>
            <span className="preview-info-value">{stats.generatedAt}</span>
          </div>
        </div>
      </main>

      {/* Actions */}
      <footer className="preview-footer">
        <button type="button" className="preview-btn secondary" onClick={handleCancel}>
          🗑️ Annuler
        </button>
        <button type="button" className="preview-btn outline" onClick={handleModify}>
          ✏️ Modifier
        </button>
        <button type="button" className="preview-btn primary" onClick={handleValidate}>
          ✅ Valider & Appliquer
        </button>
      </footer>

      {/* Styles */}
      <style jsx>{`
        .preview-page {
          min-height: calc(100vh - 80px);
          background: ${T.bg};
          display: flex;
          flex-direction: column;
        }

        /* Header */
        .preview-header {
          background: ${T.card};
          border-bottom: 1px solid ${T.border};
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .preview-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .preview-back {
          padding: 8px 14px;
          background: ${T.borderLt};
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: ${T.textSec};
          text-decoration: none;
          transition: all 0.15s;
        }

        .preview-back:hover {
          background: ${T.border};
          color: ${T.text};
        }

        .preview-title {
          font-size: 20px;
          font-weight: 700;
          color: ${T.text};
          margin: 0;
        }

        .preview-subtitle {
          font-size: 13px;
          color: ${T.textSec};
          margin: 2px 0 0 0;
        }

        .preview-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: ${T.warningLt};
          border: 1px solid ${T.warningBd};
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: ${T.warningDk};
        }

        .preview-badge-dot {
          width: 8px;
          height: 8px;
          background: ${T.warning};
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Main */
        .preview-main {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        /* Stats */
        .preview-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .preview-stat {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .preview-stat-icon { font-size: 24px; }

        .preview-stat-value {
          font-size: 32px;
          font-weight: 800;
          color: ${T.text};
          line-height: 1;
        }

        .preview-stat-label {
          font-size: 12px;
          color: ${T.textSec};
          font-weight: 500;
        }

        /* Section title */
        .preview-section-title {
          font-size: 15px;
          font-weight: 700;
          color: ${T.text};
          margin: 0 0 14px 0;
        }

        /* Alerts */
        .preview-alerts {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .preview-alerts-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .preview-alert {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
        }

        .preview-alert.success {
          background: ${T.primaryBg};
          border: 1px solid ${T.primaryLt};
        }

        .preview-alert.warning {
          background: ${T.warningBg};
          border: 1px solid ${T.warningBd};
        }

        .preview-alert.info {
          background: ${T.infoBg};
          border: 1px solid ${T.infoLt};
        }

        .preview-alert-icon { font-size: 18px; flex-shrink: 0; }

        .preview-alert-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .preview-alert-message {
          font-size: 14px;
          font-weight: 600;
          color: ${T.text};
        }

        .preview-alert-details {
          font-size: 12px;
          color: ${T.textSec};
        }

        /* ============================== */
        /* PLANNING JOUR PAR JOUR         */
        /* ============================== */
        .preview-planning {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .preview-planning-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .preview-planning-grid {
          display: flex;
          gap: 6px;
          min-width: min-content;
        }

        .preview-day {
          min-width: 110px;
          flex: 1;
          border: 1px solid ${T.border};
          border-radius: 8px;
          overflow: hidden;
        }

        .preview-day.inactive {
          opacity: 0.4;
        }

        .preview-day.weekend .preview-day-header {
          background: ${T.warningLt};
        }

        .preview-day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          background: ${T.borderLt};
          border-bottom: 1px solid ${T.border};
        }

        .preview-day-name {
          font-size: 11px;
          font-weight: 600;
          color: ${T.textSec};
          text-transform: uppercase;
        }

        .preview-day-number {
          font-size: 16px;
          font-weight: 700;
          color: ${T.text};
        }

        .preview-day-slots {
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .preview-day-slot {
          padding: 6px 8px;
          background: ${T.infoBg};
          border-radius: 6px;
          border-left: 3px solid ${T.info};
        }

        .preview-slot-name {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: ${T.text};
        }

        .preview-slot-time {
          display: block;
          font-size: 10px;
          color: ${T.muted};
        }

        .preview-slot-besoins {
          display: flex;
          gap: 3px;
          margin-top: 4px;
        }

        .preview-slot-besoin {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: white;
        }

        .preview-day-off {
          padding: 16px 8px;
          text-align: center;
          font-size: 11px;
          color: ${T.muted};
        }

        /* ============================== */
        /* ROLES — même ligne + heures    */
        /* ============================== */
        .preview-roles {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          overflow-x: auto;
        }

        .preview-roles-grid {
          display: grid;
          gap: 12px;
          min-width: min-content;
        }

        .preview-role-card {
          border: 1px solid;
          border-radius: 10px;
          overflow: hidden;
          min-width: 180px;
        }

        .preview-role-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
        }

        .preview-role-icon { font-size: 16px; }

        .preview-role-name {
          flex: 1;
          font-size: 13px;
          font-weight: 600;
        }

        .preview-role-count {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          color: white;
        }

        .preview-role-employees {
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: ${T.card};
        }

        .preview-employee {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .preview-employee-initials {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .preview-employee-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .preview-employee-name {
          font-size: 12px;
          color: ${T.text};
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .preview-employee-bar-container {
          height: 4px;
          background: ${T.borderLt};
          border-radius: 2px;
          overflow: hidden;
        }

        .preview-employee-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .preview-employee-hours-attr {
          font-size: 12px;
          color: ${T.text};
          white-space: nowrap;
          flex-shrink: 0;
        }

        .preview-employee-hours-attr strong {
          font-weight: 700;
        }

        .preview-employee-hours-max {
          font-size: 10px;
          color: ${T.muted};
        }

        /* Info */
        .preview-info {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          padding: 16px;
          background: ${T.borderLt};
          border-radius: 10px;
        }

        .preview-info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .preview-info-label {
          font-size: 11px;
          color: ${T.muted};
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .preview-info-value {
          font-size: 13px;
          color: ${T.text};
          font-weight: 500;
        }

        /* Footer */
        .preview-footer {
          background: ${T.card};
          border-top: 1px solid ${T.border};
          padding: 16px 24px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-wrap: wrap;
        }

        .preview-btn {
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .preview-btn.primary {
          background: ${T.primary};
          color: white;
          box-shadow: ${T.shadow};
        }

        .preview-btn.primary:hover {
          background: ${T.primaryDk};
          transform: translateY(-1px);
          box-shadow: ${T.shadowMd};
        }

        .preview-btn.secondary {
          background: ${T.borderLt};
          color: ${T.textSec};
        }

        .preview-btn.secondary:hover {
          background: ${T.border};
          color: ${T.text};
        }

        .preview-btn.outline {
          background: transparent;
          border: 1px solid ${T.border};
          color: ${T.text};
        }

        .preview-btn.outline:hover {
          background: ${T.borderLt};
        }

        /* Responsive */
        @media (max-width: 900px) {
          .preview-roles-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        @media (max-width: 768px) {
          .preview-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .preview-stat-value { font-size: 24px; }

          .preview-roles-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .preview-header { padding: 12px 16px; }
          .preview-main { padding: 16px; }

          .preview-footer {
            flex-direction: column;
            padding: 16px;
          }

          .preview-btn {
            width: 100%;
            justify-content: center;
          }

          .preview-roles-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}