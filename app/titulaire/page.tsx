'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MOCK_STATS,
  MOCK_DEMANDES,
  MOCK_DISPONIBILITES,
  MOCK_EMPLOYEES,
  SEMAINE_REFERENCE,
  getUrgentDemandes,
  getRoleColor,
  getRoleLabel,
  getRoleIcon,
  type EmployeeRole,
} from '@/lib/mock-data'
import { T, DEMANDE_TYPES, getRolePalette } from '@/lib/ui-tokens'

/* ─────────────── HELPERS ─────────────── */

function getEmployeeRole(employeeId: string): EmployeeRole {
  const emp = MOCK_EMPLOYEES.find(e => e.id === employeeId)
  return emp?.fonction ?? 'Etudiant'
}

const JOUR_MAP: Record<string, string> = {
  '0': 'dimanche', '1': 'lundi', '2': 'mardi', '3': 'mercredi',
  '4': 'jeudi', '5': 'vendredi', '6': 'samedi',
}

const formatTodayLabel = (): string => {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }
  const formatted = now.toLocaleDateString('fr-FR', options)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

const getTodayKey = (): string => {
  const dayIndex = new Date().getDay()
  return JOUR_MAP[String(dayIndex)] || 'lundi'
}

const localParseHoraire = (h: string): { start: string; end: string } | null => {
  if (!h || h === 'non' || h === 'variable' || h === 'congé') return null
  const cleaned = h.replace(/h/g, ':').replace(/:(\d)(?!\d)/g, ':0$1')
  const parts = cleaned.split('-')
  if (parts.length !== 2) return null
  return { start: parts[0].trim().padStart(5, '0'), end: parts[1].trim().padStart(5, '0') }
}

const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

const calcTotalHours = (employees: { start: string; end: string }[]): number => {
  return employees.reduce((sum, e) => {
    const mins = timeToMinutes(e.end) - timeToMinutes(e.start)
    return sum + Math.max(0, mins / 60)
  }, 0)
}

const START_HOUR = 8
const END_HOUR = 21
const TOTAL_HOURS = END_HOUR - START_HOUR

const timeToPct = (time: string): number => {
  const mins = timeToMinutes(time)
  const startMins = START_HOUR * 60
  const totalMins = TOTAL_HOURS * 60
  return Math.max(0, Math.min(100, ((mins - startMins) / totalMins) * 100))
}

/* ─────────────── PAGE ─────────────── */

export default function TitulaireTableauDeBordPage() {
  const router = useRouter()

  // ── Data ──
  const urgentDemandes = getUrgentDemandes()
  const pendingDemandes = MOCK_DEMANDES.filter(d => d.status === 'pending')
  const nonRepondus = MOCK_DISPONIBILITES.filter(d => !d.has_submitted)

  // ── States ──
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [remindedIds, setRemindedIds] = useState<string[]>([])
  const [approvedIds, setApprovedIds] = useState<string[]>([])
  const [refusedIds, setRefusedIds] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)

  // ── Planning du jour ──
  const todayKey = getTodayKey() as keyof typeof MOCK_EMPLOYEES[0]['horaires']
  const todayLabel = formatTodayLabel()

  const todayPlanning = useMemo(() => {
    const working = MOCK_EMPLOYEES
      .filter(e => e.actif)
      .map(e => {
        const horaire = e.horaires[todayKey]
        const parsed = localParseHoraire(horaire || '')
        if (!parsed) return null
        return {
          id: e.id, prenom: e.prenom, nom: e.nom, initiales: e.initiales,
          fonction: e.fonction, start: parsed.start, end: parsed.end,
        }
      })
      .filter(Boolean) as Array<{
        id: string; prenom: string; nom: string; initiales: string;
        fonction: EmployeeRole; start: string; end: string
      }>
    working.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
    return working
  }, [todayKey])

  const totalHoursToday = useMemo(() => calcTotalHours(todayPlanning), [todayPlanning])

  // ── Toast helper ──
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  // ── Disponibilités handlers ──
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectableNonRepondus = nonRepondus.filter(d => !remindedIds.includes(d.employee_id))

  const toggleSelectAll = () => {
    const allIds = selectableNonRepondus.map(d => d.employee_id)
    const allSel = allIds.every(id => selectedIds.includes(id))
    if (allSel) {
      setSelectedIds(prev => prev.filter(id => !allIds.includes(id)))
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allIds])])
    }
  }

  const allSelected = selectableNonRepondus.length > 0 &&
    selectableNonRepondus.every(d => selectedIds.includes(d.employee_id))

  const handleRemind = (id: string) => {
    setRemindedIds(prev => [...prev, id])
    setSelectedIds(prev => prev.filter(x => x !== id))
    const emp = nonRepondus.find(d => d.employee_id === id)
    showToast(`🔔 Relance envoyée à ${emp?.employee_name}`)
  }

  const handleRemindSelected = () => {
    const toRemind = selectedIds.filter(id => !remindedIds.includes(id))
    setRemindedIds(prev => [...prev, ...toRemind])
    setSelectedIds([])
    showToast(`🔔 ${toRemind.length} relance(s) envoyée(s)`)
  }

  // ── Demandes handlers ──
  const handleApprove = (id: string) => {
    setApprovedIds(prev => [...prev, id])
    const d = pendingDemandes.find(x => x.id === id)
    showToast(`✅ ${d?.employee_name} — demande approuvée`)
  }

  const handleRefuse = (id: string) => {
    setRefusedIds(prev => [...prev, id])
    const d = pendingDemandes.find(x => x.id === id)
    showToast(`❌ ${d?.employee_name} — demande refusée`)
  }

  // ── Filtered data ──
  const activeDemandes = pendingDemandes.filter(
    d => !approvedIds.includes(d.id) && !refusedIds.includes(d.id)
  )
  const activeUrgent = activeDemandes.filter(d => d.urgent)
  const activeNormal = activeDemandes.filter(d => !d.urgent)
  const activeNonRepondus = nonRepondus.filter(d => !remindedIds.includes(d.employee_id))
  const totalActions = activeNonRepondus.length + activeDemandes.length

  return (
    <>
      <div className="db-page">
        {/* ══════ HEADER ══════ */}
        <header className="db-header">
          <div className="db-header-left">
            <h1 className="db-title">Tableau de bord</h1>
            <span className="db-week">
              Semaine du {SEMAINE_REFERENCE.jours[0]} au {SEMAINE_REFERENCE.jours[5]} {SEMAINE_REFERENCE.mois}
            </span>
          </div>
          <div className="db-header-right">
            {totalActions > 0 && (
              <span className="db-action-count">
                {totalActions} action{totalActions > 1 ? 's' : ''}
              </span>
            )}
            <button className="db-cta" onClick={() => router.push('/titulaire/assistant-planning')}>
              ✨ Générer un planning
            </button>
          </div>
        </header>

        {/* ══════ CONTENT : Planning (gauche) + Actions (droite) ══════ */}
        <div className="db-content">

          {/* ── GAUCHE : Planning du jour ── */}
          <div className="db-panel db-panel--planning">
            <div className="db-panel-head">
              <div className="db-panel-head-left">
                <h2 className="db-panel-title">📅 Planning du jour</h2>
                <span className="db-panel-badge">{todayPlanning.length} pers. · {Math.round(totalHoursToday)}h</span>
              </div>
              <span className="db-panel-date">{todayLabel}</span>
            </div>

            <div className="db-timeline-header">
              <div className="db-timeline-label">Employé</div>
              <div className="db-timeline-hours">
                {[8, 10, 12, 14, 16, 18, 20].map(h => (
                  <span key={h} className="db-hour-mark">{h}h</span>
                ))}
              </div>
            </div>

            <div className="db-panel-body">
              {todayPlanning.length > 0 ? (
                todayPlanning.map(emp => {
                  const palette = getRolePalette(emp.fonction)
                  const left = timeToPct(emp.start)
                  const right = timeToPct(emp.end)
                  const width = right - left
                  return (
                    <div key={emp.id} className="db-gantt-row">
                      <div className="db-gantt-emp">
                        <div className="db-gantt-avatar" style={{ background: palette.bg }}>
                          {emp.initiales}
                        </div>
                        <span className="db-gantt-name">{emp.prenom}</span>
                      </div>
                      <div className="db-gantt-track">
                        <div className="db-gantt-grid">
                          {[8, 10, 12, 14, 16, 18, 20].map(h => (
                            <div key={h} className={`db-grid-line ${h === 12 ? 'db-grid-line--noon' : ''}`} />
                          ))}
                        </div>
                        <div
                          className="db-gantt-bar"
                          style={{ left: `${left}%`, width: `${width}%`, background: palette.bg }}
                        >
                          <span className="db-bar-text">{emp.start}–{emp.end}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="db-empty">Aucun créneau planifié aujourd&apos;hui</div>
              )}
            </div>

            <div className="db-panel-foot">
              <Link href="/titulaire/planning" className="db-panel-foot-link">
                Voir le planning complet →
              </Link>
              <Link href="/titulaire/planning/recap" className="db-panel-foot-link db-panel-foot-link--sec">
                📊 Récap
              </Link>
            </div>
          </div>

          {/* ── DROITE : Dispos + Demandes empilées ── */}
          <div className="db-right-col">

            {/* DISPONIBILITÉS */}
            <div className="db-block db-block--dispo">
              <div className="db-block-head db-block-head--dispo">
                <div className="db-block-head-left">
                  <h2 className="db-block-title">📋 Disponibilités</h2>
                  {activeNonRepondus.length > 0 ? (
                    <span className="db-count-badge db-count-badge--warn">
                      {activeNonRepondus.length}
                    </span>
                  ) : (
                    <span className="db-count-badge db-count-badge--ok">OK</span>
                  )}
                </div>
                <span className="db-block-stat">
                  {MOCK_STATS.disponibilites.repondu}/{MOCK_STATS.disponibilites.total}
                </span>
              </div>

              <div className="db-block-body">
                {activeNonRepondus.length === 0 ? (
                  <div className="db-empty-state db-empty-state--sm">
                    ✅ Tous répondus
                  </div>
                ) : (
                  <>
                    <div className="db-list">
                      {nonRepondus.map(emp => {
                        const role = getEmployeeRole(emp.employee_id)
                        const color = getRoleColor(role)
                        const reminded = remindedIds.includes(emp.employee_id)
                        const checked = selectedIds.includes(emp.employee_id)
                        return (
                          <div
                            key={emp.employee_id}
                            className={`db-list-item ${reminded ? 'db-list-item--reminded' : ''}`}
                          >
                            {!reminded && (
                              <input
                                type="checkbox"
                                className="db-checkbox"
                                checked={checked}
                                onChange={() => toggleSelect(emp.employee_id)}
                              />
                            )}
                            <div className="db-avatar" style={{ background: color }}>
                              {emp.initiales}
                            </div>
                            <div className="db-emp-info">
                              <span className="db-emp-name">{emp.employee_name}</span>
                              <span className="db-emp-role">{getRoleIcon(role)} {getRoleLabel(role)}</span>
                            </div>
                            {reminded ? (
                              <span className="db-reminded-tag">✓</span>
                            ) : (
                              <button className="db-btn-remind" onClick={() => handleRemind(emp.employee_id)}>
                                🔔
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {activeNonRepondus.length > 0 && (
                      <div className="db-bulk-actions">
                        <label className="db-select-all">
                          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                          Tout
                        </label>
                        <button
                          className="db-btn-remind-all"
                          disabled={selectedIds.length === 0}
                          onClick={handleRemindSelected}
                        >
                          Relancer ({selectedIds.length})
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="db-block-foot">
                <Link href="/titulaire/disponibilites" className="db-see-all">→ Tout voir</Link>
              </div>
            </div>

            {/* DEMANDES */}
            <div className="db-block db-block--demandes">
              <div className="db-block-head db-block-head--demandes">
                <div className="db-block-head-left">
                  <h2 className="db-block-title">🏥 Demandes</h2>
                  {activeDemandes.length > 0 ? (
                    <span className="db-count-badge db-count-badge--danger">
                      {activeDemandes.length}
                    </span>
                  ) : (
                    <span className="db-count-badge db-count-badge--ok">0</span>
                  )}
                </div>
                {activeUrgent.length > 0 && (
                  <span className="db-urgent-flag">⚠️ {activeUrgent.length}</span>
                )}
              </div>

              <div className="db-block-body">
                {activeDemandes.length === 0 ? (
                  <div className="db-empty-state db-empty-state--sm">
                    ✅ Aucune demande
                  </div>
                ) : (
                  <div className="db-list">
                    {activeUrgent.map(d => {
                      const cfg = DEMANDE_TYPES[d.type] || DEMANDE_TYPES.conge
                      return (
                        <div key={d.id} className="db-req-item db-req-item--urgent">
                          <div className="db-req-icon" style={{ background: cfg.color + '18' }}>{cfg.icon}</div>
                          <div className="db-req-info">
                            <span className="db-req-name">
                              {d.employee_name}
                              <span className="db-req-urgent-tag">URGENT</span>
                            </span>
                            <span className="db-req-meta">{cfg.label} · {d.date}</span>
                          </div>
                          <div className="db-req-actions">
                            <button className="db-btn-approve" onClick={() => handleApprove(d.id)} title="Approuver">✓</button>
                            <button className="db-btn-refuse" onClick={() => handleRefuse(d.id)} title="Refuser">✗</button>
                          </div>
                        </div>
                      )
                    })}
                    {activeNormal.map(d => {
                      const cfg = DEMANDE_TYPES[d.type] || DEMANDE_TYPES.conge
                      return (
                        <div key={d.id} className="db-req-item">
                          <div className="db-req-icon" style={{ background: cfg.color + '18' }}>{cfg.icon}</div>
                          <div className="db-req-info">
                            <span className="db-req-name">{d.employee_name}</span>
                            <span className="db-req-meta">{cfg.label} · {d.date}</span>
                          </div>
                          <div className="db-req-actions">
                            <button className="db-btn-approve" onClick={() => handleApprove(d.id)} title="Approuver">✓</button>
                            <button className="db-btn-refuse" onClick={() => handleRefuse(d.id)} title="Refuser">✗</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="db-block-foot">
                <Link href="/titulaire/demandes" className="db-see-all">→ Tout voir</Link>
                <Link href="/titulaire/demandes/conges" className="db-see-all db-see-all--secondary">📅 Congés</Link>
              </div>
            </div>

          </div>
        </div>

        {/* ══════ FOOTER ══════ */}
        <footer className="db-footer">
          <span className="db-footer-brand">BaggPlanning</span>
          <span className="db-footer-sep">·</span>
          <span className="db-footer-version">v1.2</span>
          <span className="db-footer-sep">·</span>
          <span className="db-footer-copy">© 2026</span>
          <span className="db-footer-sep">·</span>
          <Link href="/mentions-legales" className="db-footer-link">Mentions légales</Link>
          <span className="db-footer-sep">·</span>
          <Link href="/contact" className="db-footer-link">Contact</Link>
        </footer>
      </div>

      {/* ══════ TOAST ══════ */}
      {toast && <div className="db-toast">{toast}</div>}

      {/* ══════ STYLES ══════ */}
      <style jsx global>{`
        /* ═══════════ PAGE ═══════════ */
        .db-page {
          height: calc(100vh - 72px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          gap: 10px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* ═══════════ HEADER ═══════════ */
        .db-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        .db-header-left { display: flex; align-items: baseline; gap: 12px; }
        .db-title { font-size: 18px; font-weight: 800; color: ${T.text}; margin: 0; }
        .db-week { font-size: 13px; color: ${T.textSec}; font-weight: 500; }
        .db-header-right { display: flex; align-items: center; gap: 10px; }
        .db-action-count {
          font-size: 11px; font-weight: 700; color: ${T.warning};
          background: ${T.warningLt}; padding: 3px 10px; border-radius: 12px;
        }
        .db-cta {
          padding: 7px 16px;
          background: linear-gradient(135deg, ${T.primary} 0%, ${T.info} 100%);
          color: white; border: none; border-radius: 8px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .db-cta:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.25); }

        /* ═══════════ CONTENT 2-COL ═══════════ */
        .db-content {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 12px;
        }

        /* ═══════════ PLANNING PANEL (gauche) ═══════════ */
        .db-panel {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
          box-shadow: ${T.shadow};
        }
        .db-panel--planning { flex: 1; }
        .db-panel-head {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 14px; border-bottom: 1px solid ${T.borderLt}; flex-shrink: 0;
        }
        .db-panel-head-left { display: flex; align-items: center; gap: 10px; }
        .db-panel-title {
          font-size: 14px; font-weight: 700; color: ${T.text}; margin: 0;
          display: flex; align-items: center; gap: 6px;
        }
        .db-panel-badge {
          font-size: 11px; font-weight: 600; padding: 2px 8px;
          background: ${T.borderLt}; color: ${T.textSec}; border-radius: 6px;
        }
        .db-panel-date { font-size: 12px; color: ${T.textSec}; font-weight: 500; }
        .db-panel-body {
          flex: 1; overflow-y: auto; min-height: 0;
          padding: 6px 14px; display: flex; flex-direction: column; gap: 2px;
        }
        .db-panel-foot {
          padding: 8px 14px; border-top: 1px solid ${T.borderLt};
          font-size: 12px; flex-shrink: 0;
          display: flex; align-items: center; gap: 14px;
        }
        .db-panel-foot-link {
          font-size: 12px; color: ${T.info}; font-weight: 600; text-decoration: none;
        }
        .db-panel-foot-link:hover { text-decoration: underline; }
        .db-panel-foot-link--sec { color: ${T.textSec}; font-weight: 500; }

        /* Timeline header */
        .db-timeline-header {
          display: flex; align-items: center;
          padding: 5px 14px; background: #f8fafc;
          border-bottom: 1px solid ${T.borderLt}; flex-shrink: 0;
        }
        .db-timeline-label {
          width: 90px; flex-shrink: 0;
          font-size: 10px; font-weight: 600; color: ${T.muted};
          text-transform: uppercase; letter-spacing: 0.03em;
        }
        .db-timeline-hours {
          flex: 1; display: flex; justify-content: space-between;
          font-size: 10px; color: ${T.muted}; font-weight: 500;
        }
        .db-hour-mark { width: 24px; text-align: center; }

        /* Gantt rows */
        .db-gantt-row { display: flex; align-items: center; height: 34px; }
        .db-gantt-emp {
          width: 90px; flex-shrink: 0;
          display: flex; align-items: center; gap: 6px;
        }
        .db-gantt-avatar {
          width: 24px; height: 24px; border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 9px; font-weight: 700; flex-shrink: 0;
        }
        .db-gantt-name {
          font-size: 11px; font-weight: 600; color: ${T.text};
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .db-gantt-track {
          flex: 1; height: 24px; position: relative;
          background: ${T.borderLt}; border-radius: 5px; overflow: hidden;
        }
        .db-gantt-grid { position: absolute; inset: 0; display: flex; }
        .db-grid-line { flex: 1; border-right: 1px solid ${T.border}; }
        .db-grid-line:last-child { border-right: none; }
        .db-grid-line--noon { background: rgba(254,243,199,0.4); }
        .db-gantt-bar {
          position: absolute; top: 2px; bottom: 2px; border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12); min-width: 40px;
        }
        .db-bar-text {
          font-size: 9px; font-weight: 600; color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2); white-space: nowrap;
        }

        /* ═══════════ RIGHT COLUMN ═══════════ */
        .db-right-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 0;
        }

        /* ═══════════ BLOCKS (right col) ═══════════ */
        .db-block {
          display: flex;
          flex-direction: column;
          background: ${T.card};
          border-radius: 10px;
          border: 1px solid ${T.border};
          box-shadow: ${T.shadow};
          overflow: hidden;
          min-height: 0;
          flex: 1;
        }

        /* Dispo = amber accent */
        .db-block--dispo {
          border-top: 3px solid ${T.warning};
        }
        .db-block-head--dispo {
          background: ${T.warningBg};
        }

        /* Demandes = red accent */
        .db-block--demandes {
          border-top: 3px solid ${T.danger};
        }
        .db-block-head--demandes {
          background: ${T.dangerBg};
        }

        /* Block head */
        .db-block-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid ${T.borderLt};
          flex-shrink: 0;
        }
        .db-block-head-left { display: flex; align-items: center; gap: 8px; }
        .db-block-title {
          font-size: 13px; font-weight: 700; color: ${T.text};
          margin: 0; white-space: nowrap;
        }
        .db-block-stat {
          font-size: 11px; color: ${T.textSec}; font-weight: 600;
        }
        .db-count-badge {
          font-size: 10px; font-weight: 800; padding: 2px 7px;
          border-radius: 10px; white-space: nowrap; min-width: 20px; text-align: center;
        }
        .db-count-badge--warn { background: ${T.warningLt}; color: ${T.warningDk}; }
        .db-count-badge--danger { background: ${T.dangerLt}; color: ${T.danger}; }
        .db-count-badge--ok { background: ${T.primaryLt}; color: ${T.primaryDk}; }
        .db-urgent-flag { font-size: 11px; font-weight: 700; color: ${T.danger}; }

        /* Block body */
        .db-block-body {
          flex: 1; overflow-y: auto; min-height: 0;
          padding: 6px 8px;
        }

        /* Block foot */
        .db-block-foot {
          display: flex; align-items: center; gap: 12px;
          padding: 6px 12px; border-top: 1px solid ${T.borderLt}; flex-shrink: 0;
        }
        .db-see-all { font-size: 11px; color: ${T.info}; font-weight: 600; text-decoration: none; }
        .db-see-all:hover { text-decoration: underline; }
        .db-see-all--secondary { color: ${T.textSec}; font-weight: 500; }

        /* ═══════════ EMPTY STATE ═══════════ */
        .db-empty-state {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 20px 12px;
          color: ${T.primary}; font-size: 13px; font-weight: 600;
        }
        .db-empty-state--sm { padding: 14px 8px; font-size: 12px; }
        .db-empty { text-align: center; padding: 16px; color: ${T.textSec}; font-size: 13px; }

        /* ═══════════ DISPO LIST ═══════════ */
        .db-list { display: flex; flex-direction: column; gap: 4px; }
        .db-list-item {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 8px; background: ${T.borderLt}; border-radius: 7px;
          transition: background 0.15s, opacity 0.3s;
        }
        .db-list-item:hover { background: ${T.border}; }
        .db-list-item--reminded { opacity: 0.45; background: transparent; padding-left: 32px; }
        .db-checkbox { width: 14px; height: 14px; cursor: pointer; accent-color: ${T.info}; flex-shrink: 0; }
        .db-avatar {
          width: 28px; height: 28px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 10px; font-weight: 700; flex-shrink: 0;
        }
        .db-emp-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .db-emp-name { font-size: 12px; font-weight: 600; color: ${T.text}; }
        .db-emp-role { font-size: 10px; color: ${T.muted}; }
        .db-btn-remind {
          width: 28px; height: 28px;
          border: 1px solid ${T.border}; background: ${T.card};
          border-radius: 6px; font-size: 13px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .db-btn-remind:hover { background: ${T.info}; border-color: ${T.info}; }
        .db-reminded-tag { font-size: 10px; font-weight: 600; color: ${T.primary}; }

        /* Bulk actions */
        .db-bulk-actions {
          display: flex; justify-content: space-between; align-items: center;
          padding: 6px 8px; background: ${T.borderLt}; border-radius: 6px; margin-top: 4px;
        }
        .db-select-all {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: ${T.textSec}; cursor: pointer; font-weight: 500;
        }
        .db-select-all input { width: 14px; height: 14px; accent-color: ${T.info}; }
        .db-btn-remind-all {
          padding: 4px 10px; background: ${T.info}; color: white;
          border: none; border-radius: 5px; font-size: 11px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .db-btn-remind-all:hover:not(:disabled) { background: ${T.infoDk}; }
        .db-btn-remind-all:disabled { background: ${T.border}; color: ${T.muted}; cursor: not-allowed; }

        /* ═══════════ DEMANDES LIST ═══════════ */
        .db-req-item {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 8px; background: ${T.borderLt}; border-radius: 7px;
          transition: background 0.15s;
        }
        .db-req-item:hover { background: ${T.border}; }
        .db-req-item--urgent {
          background: ${T.dangerBg}; border: 1px solid ${T.dangerBd};
        }
        .db-req-item--urgent:hover { background: ${T.dangerLt}; }
        .db-req-icon {
          width: 28px; height: 28px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
        }
        .db-req-info { flex: 1; display: flex; flex-direction: column; min-width: 0; gap: 1px; }
        .db-req-name {
          font-size: 12px; font-weight: 600; color: ${T.text};
          display: flex; align-items: center; gap: 5px;
        }
        .db-req-urgent-tag {
          font-size: 8px; font-weight: 800; color: ${T.danger};
          background: ${T.dangerLt}; padding: 1px 5px; border-radius: 3px;
        }
        .db-req-meta { font-size: 10px; color: ${T.textSec}; }
        .db-req-actions { display: flex; gap: 4px; flex-shrink: 0; }
        .db-btn-approve {
          width: 28px; height: 28px;
          border: 1px solid ${T.primaryLt}; background: ${T.primaryBg};
          color: ${T.primaryDk}; border-radius: 6px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .db-btn-approve:hover { background: ${T.primary}; color: white; border-color: ${T.primary}; }
        .db-btn-refuse {
          width: 28px; height: 28px;
          border: 1px solid ${T.dangerLt}; background: ${T.dangerBg};
          color: ${T.danger}; border-radius: 6px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .db-btn-refuse:hover { background: ${T.danger}; color: white; border-color: ${T.danger}; }

        /* ═══════════ FOOTER ═══════════ */
        .db-footer {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 16px;
          font-size: 12px;
          color: ${T.muted};
        }
        .db-footer-brand { font-weight: 600; color: ${T.textSec}; }
        .db-footer-version { color: ${T.muted}; font-size: 11px; }
        .db-footer-copy { color: ${T.muted}; }
        .db-footer-sep { color: ${T.border}; font-size: 10px; }
        .db-footer-link {
          color: ${T.info}; text-decoration: none; font-weight: 500;
          transition: color 0.15s;
        }
        .db-footer-link:hover { color: ${T.infoDk}; text-decoration: underline; }

        /* ═══════════ TOAST ═══════════ */
        .db-toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          padding: 10px 24px; background: ${T.text}; color: white;
          border-radius: 10px; font-size: 13px; font-weight: 600;
          box-shadow: ${T.shadowLg}; z-index: 999;
          animation: db-toast-in 0.3s ease;
        }
        @keyframes db-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* ═══════════ RESPONSIVE ═══════════ */
        @media (max-width: 1100px) {
          .db-content { grid-template-columns: 1fr 260px; }
        }
        @media (max-width: 900px) {
          .db-page { height: auto; overflow: visible; }
          .db-content { grid-template-columns: 1fr; }
          .db-header { flex-direction: column; align-items: flex-start; gap: 8px; }
          .db-header-right { width: 100%; justify-content: space-between; }
          .db-right-col { flex-direction: row; gap: 10px; }
          .db-block { flex: 1; }
        }
        @media (max-width: 600px) {
          .db-right-col { flex-direction: column; }
          .db-gantt-emp { width: 60px; }
          .db-timeline-label { width: 60px; }
          .db-gantt-name { display: none; }
          .db-bar-text { font-size: 8px; }
        }
      `}</style>
    </>
  )
}
