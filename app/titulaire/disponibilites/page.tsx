'use client'

import { useState, useMemo } from 'react'
import {
  MOCK_DISPONIBILITES,
  MOCK_EMPLOYEES,
  SEMAINE_REFERENCE,
  JOURS_SEMAINE,
  type EmployeeRole,
  getRoleLabel,
  getRoleIcon,
} from '@/lib/mock-data'
import { T, ROLE_PALETTE } from '@/lib/ui-tokens'

// ============================================================
// Helpers
// ============================================================

const getEmployeeRole = (employeeId: string): EmployeeRole => {
  const emp = MOCK_EMPLOYEES.find(e => e.id === employeeId)
  return emp?.fonction || 'Etudiant'
}

type FilterStatus = 'all' | 'repondu' | 'attente'

// ============================================================
// Page
// ============================================================

export default function DisponibilitesPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Computed data
  const repondus = MOCK_DISPONIBILITES.filter(d => d.has_submitted)
  const nonRepondus = MOCK_DISPONIBILITES.filter(d => !d.has_submitted)
  const total = MOCK_DISPONIBILITES.length
  const nbRepondus = repondus.length
  const pct = Math.round((nbRepondus / total) * 100)

  const filtered = useMemo(() => {
    if (filterStatus === 'repondu') return repondus
    if (filterStatus === 'attente') return nonRepondus
    return MOCK_DISPONIBILITES
  }, [filterStatus])

  // Count available per day
  const perDay = useMemo(() => {
    return JOURS_SEMAINE.map(jour => {
      return MOCK_DISPONIBILITES.filter(d => d.has_submitted && d[jour] !== null).length
    })
  }, [])

  const handleRelancer = () => {
    // TODO: real implementation
    alert(`Relance envoyée à ${nonRepondus.length} personne(s)`)
  }

  return (
    <>
      <div className="dp-page">
        {/* ======== TOP BAR : Stats + Filters + Actions ======== */}
        <div className="dp-topbar">
          {/* Left: Stats compact */}
          <div className="dp-stats">
            <div className="dp-stats-main">
              <span className="dp-stats-value">{nbRepondus}/{total}</span>
              <span className="dp-stats-label">réponses</span>
            </div>
            <div className="dp-progress">
              <div className="dp-progress-bar" style={{ width: `${pct}%` }} />
            </div>
            <span className="dp-stats-pct">{pct}%</span>
            <div className="dp-stats-badges">
              <span className="dp-badge success">✓ {nbRepondus}</span>
              <span className="dp-badge warning">⏱ {nonRepondus.length}</span>
            </div>
          </div>

          {/* Center: Filters */}
          <div className="dp-filters">
            {([
              ['all', 'Tous', total],
              ['repondu', '✓ Répondu', nbRepondus],
              ['attente', '⏱ Attente', nonRepondus.length],
            ] as [FilterStatus, string, number][]).map(([key, label, count]) => (
              <button
                key={key}
                className={`dp-filter ${filterStatus === key ? 'active' : ''}`}
                onClick={() => setFilterStatus(key)}
              >
                {label} <span className="dp-filter-count">{count}</span>
              </button>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="dp-actions">
            {nonRepondus.length > 0 && (
              <button className="dp-btn warn" onClick={handleRelancer}>
                🔔 Relancer ({nonRepondus.length})
              </button>
            )}
            <button className="dp-btn secondary" onClick={() => window.location.reload()}>
              ↻
            </button>
          </div>
        </div>

        {/* ======== DAY SUMMARY (horizontal mini-bar) ======== */}
        <div className="dp-day-strip">
          <span className="dp-day-strip-label">Disponibles :</span>
          {JOURS_SEMAINE.map((jour, i) => (
            <div key={jour} className="dp-day-chip">
              <span className="dp-day-chip-name">{SEMAINE_REFERENCE.joursShort[i]}</span>
              <span className={`dp-day-chip-count ${perDay[i] === 0 ? 'zero' : ''}`}>{perDay[i]}</span>
            </div>
          ))}
        </div>

        {/* ======== TABLE ======== */}
        <div className="dp-table-wrap">
          <div className="dp-table-scroll">
            <table className="dp-table">
              <thead>
                <tr>
                  <th className="dp-th-emp">Employé</th>
                  <th className="dp-th-role">Rôle</th>
                  <th className="dp-th-status">Statut</th>
                  {SEMAINE_REFERENCE.jours.map((jour, i) => (
                    <th key={i} className="dp-th-day">
                      {SEMAINE_REFERENCE.joursShort[i]}
                      <span className="dp-th-date">{jour.split(' ')[1]}</span>
                    </th>
                  ))}
                  <th className="dp-th-action" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(dispo => {
                  const role = getEmployeeRole(dispo.employee_id)
                  const isExpanded = expandedId === dispo.employee_id
                  return (
                    <EmployeeRow
                      key={dispo.employee_id}
                      dispo={dispo}
                      role={role}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedId(isExpanded ? null : dispo.employee_id)}
                      onRelance={handleRelancer}
                    />
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="dp-empty">
                      Aucun employé dans ce filtre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ======== STYLES ======== */}
      <style jsx global>{`
        /* ============ Page ============ */
        .dp-page {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 72px);
          background: ${T.bg};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }

        /* ============ Top Bar ============ */
        .dp-topbar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 20px;
          background: ${T.card};
          border-bottom: 1px solid ${T.border};
          flex-wrap: wrap;
        }

        /* Stats compact */
        .dp-stats {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .dp-stats-main {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .dp-stats-value {
          font-size: 18px;
          font-weight: 800;
          color: ${T.text};
          letter-spacing: -0.02em;
        }
        .dp-stats-label {
          font-size: 12px;
          color: ${T.muted};
          font-weight: 500;
        }
        .dp-progress {
          width: 80px;
          height: 6px;
          background: ${T.borderLt};
          border-radius: 3px;
          overflow: hidden;
        }
        .dp-progress-bar {
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, ${T.primary}, #34d399);
          transition: width 0.4s ease;
        }
        .dp-stats-pct {
          font-size: 12px;
          font-weight: 700;
          color: ${T.primaryDk};
        }
        .dp-stats-badges {
          display: flex;
          gap: 4px;
          margin-left: 4px;
        }
        .dp-badge {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }
        .dp-badge.success {
          background: ${T.primaryLt};
          color: ${T.primaryDk};
        }
        .dp-badge.warning {
          background: ${T.warningLt};
          color: ${T.warningDk};
        }

        /* Filters */
        .dp-filters {
          display: flex;
          gap: 2px;
          background: ${T.borderLt};
          border-radius: 8px;
          padding: 2px;
          margin-left: auto;
        }
        .dp-filter {
          padding: 5px 12px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: ${T.textSec};
          background: transparent;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .dp-filter:hover {
          color: ${T.text};
        }
        .dp-filter.active {
          background: ${T.card};
          color: ${T.info};
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .dp-filter-count {
          font-size: 10px;
          opacity: 0.7;
          margin-left: 2px;
        }

        /* Actions */
        .dp-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        .dp-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .dp-btn:hover { opacity: 0.85; }
        .dp-btn.warn {
          background: ${T.warning};
          color: #fff;
        }
        .dp-btn.secondary {
          background: ${T.borderLt};
          color: ${T.textSec};
          border: 1px solid ${T.border};
          padding: 6px 10px;
          font-size: 14px;
        }

        /* ============ Day Strip ============ */
        .dp-day-strip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 20px;
          background: ${T.card};
          border-bottom: 1px solid ${T.border};
        }
        .dp-day-strip-label {
          font-size: 11px;
          color: ${T.muted};
          font-weight: 500;
          white-space: nowrap;
        }
        .dp-day-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: ${T.bg};
          border: 1px solid ${T.borderLt};
          border-radius: 6px;
        }
        .dp-day-chip-name {
          font-size: 11px;
          font-weight: 600;
          color: ${T.textSec};
        }
        .dp-day-chip-count {
          font-size: 12px;
          font-weight: 800;
          color: ${T.primaryDk};
          min-width: 14px;
          text-align: center;
        }
        .dp-day-chip-count.zero {
          color: ${T.danger};
        }

        /* ============ Table ============ */
        .dp-table-wrap {
          flex: 1;
          overflow: hidden;
          margin: 12px 16px;
          border: 1px solid ${T.border};
          border-radius: 10px;
          background: ${T.card};
          box-shadow: ${T.shadow};
        }
        .dp-table-scroll {
          overflow: auto;
          height: 100%;
          -webkit-overflow-scrolling: touch;
        }
        .dp-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
          font-size: 13px;
        }

        /* Thead */
        .dp-table thead {
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .dp-table thead th {
          padding: 10px 10px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: ${T.muted};
          background: #f8fafc;
          border-bottom: 1px solid ${T.border};
          text-align: center;
          white-space: nowrap;
        }
        .dp-th-emp {
          text-align: left !important;
          padding-left: 14px !important;
          position: sticky;
          left: 0;
          z-index: 12;
          background: #f8fafc !important;
          min-width: 160px;
        }
        .dp-th-role {
          min-width: 90px;
        }
        .dp-th-status {
          min-width: 80px;
        }
        .dp-th-day {
          min-width: 70px;
        }
        .dp-th-date {
          display: block;
          font-size: 9px;
          font-weight: 400;
          color: ${T.muted};
          margin-top: 1px;
          text-transform: none;
          letter-spacing: 0;
        }
        .dp-th-action {
          width: 44px;
        }

        /* Tbody */
        .dp-table tbody tr {
          border-bottom: 1px solid ${T.borderLt};
          transition: background 0.1s;
        }
        .dp-table tbody tr:last-child { border-bottom: none; }
        .dp-table tbody tr:hover { background: #fafbfc; }
        .dp-table tbody tr.dp-row-pending { background: ${T.warningBg}; }
        .dp-table tbody tr.dp-row-pending:hover { background: #fef9ee; }

        .dp-table td {
          padding: 8px 10px;
          text-align: center;
          vertical-align: middle;
          height: 44px;
        }
        .dp-table td:first-child {
          text-align: left;
          padding-left: 14px;
          position: sticky;
          left: 0;
          z-index: 1;
          background: inherit;
        }

        /* Employee cell */
        .dp-emp {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dp-avatar {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 10px;
          color: white;
          flex-shrink: 0;
        }
        .dp-emp-name {
          font-size: 13px;
          font-weight: 600;
          color: ${T.text};
          margin: 0;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Role badge */
        .dp-role {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 8px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        /* Status */
        .dp-status {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 3px 8px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }
        .dp-status.ok {
          background: ${T.primaryLt};
          color: ${T.primaryDk};
        }
        .dp-status.wait {
          background: ${T.warningLt};
          color: ${T.warningDk};
        }

        /* Day pastilles */
        .dp-pastille {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 3px 8px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }
        .dp-pastille.dispo {
          background: ${T.primaryLt};
          color: ${T.primaryDk};
        }
        .dp-pastille.indispo {
          background: ${T.dangerLt};
          color: ${T.dangerDk};
        }
        .dp-pastille.unknown {
          background: ${T.warningLt};
          color: ${T.warningDk};
        }

        /* Relance button (row) */
        .dp-relance-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid ${T.warningBd};
          background: ${T.warningLt};
          color: ${T.warningDk};
          cursor: pointer;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .dp-relance-btn:hover {
          background: ${T.warningBd};
        }

        /* ============ Expanded row ============ */
        .dp-detail-row td {
          padding: 0 !important;
          background: #f8fafc !important;
          height: auto !important;
        }
        .dp-detail-content {
          padding: 8px 14px 8px 52px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 12px;
        }
        .dp-detail-tag {
          padding: 3px 8px;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 5px;
          font-size: 11px;
          color: ${T.text};
          font-weight: 500;
        }

        /* ============ Empty ============ */
        .dp-empty {
          padding: 40px 16px !important;
          text-align: center;
          color: ${T.muted};
          font-size: 13px;
        }

        /* ============ Responsive ============ */
        @media (max-width: 900px) {
          .dp-topbar { padding: 10px 12px; gap: 10px; }
          .dp-stats-badges { display: none; }
          .dp-day-strip { padding: 6px 12px; overflow-x: auto; }
          .dp-table-wrap { margin: 8px; }
        }
        @media (max-width: 640px) {
          .dp-filters { order: 3; width: 100%; }
          .dp-day-strip { gap: 4px; }
          .dp-day-strip-label { display: none; }
          .dp-table-wrap { margin: 6px; }
          .dp-th-role,
          .dp-role-cell { display: none; }
        }
      `}</style>
    </>
  )
}

// ============================================================
// ROW COMPONENT
// ============================================================

function EmployeeRow({
  dispo,
  role,
  isExpanded,
  onToggle,
  onRelance,
}: {
  dispo: (typeof MOCK_DISPONIBILITES)[number]
  role: EmployeeRole
  isExpanded: boolean
  onToggle: () => void
  onRelance: () => void
}) {
  const palette = ROLE_PALETTE[role]
  const icon = getRoleIcon(role)
  const label = getRoleLabel(role)

  return (
    <>
      <tr
        className={dispo.has_submitted ? '' : 'dp-row-pending'}
        onClick={onToggle}
        style={{ cursor: 'pointer' }}
      >
        {/* Employee */}
        <td>
          <div className="dp-emp">
            <div className="dp-avatar" style={{ background: palette.bg }}>
              {dispo.initiales}
            </div>
            <p className="dp-emp-name">{dispo.employee_name}</p>
          </div>
        </td>

        {/* Role */}
        <td className="dp-role-cell">
          <span className="dp-role" style={{ background: palette.light, color: palette.dark }}>
            {icon} {label}
          </span>
        </td>

        {/* Status */}
        <td>
          <span className={`dp-status ${dispo.has_submitted ? 'ok' : 'wait'}`}>
            {dispo.has_submitted ? '✓ Répondu' : '⏱ Attente'}
          </span>
        </td>

        {/* Days */}
        {JOURS_SEMAINE.map((jour, i) => {
          const val = dispo[jour]
          if (!dispo.has_submitted) {
            return <td key={i}><span className="dp-pastille unknown">?</span></td>
          }
          if (val !== null) {
            return <td key={i}><span className="dp-pastille dispo">{val}</span></td>
          }
          return <td key={i}><span className="dp-pastille indispo">—</span></td>
        })}

        {/* Action */}
        <td>
          {!dispo.has_submitted && (
            <button
              className="dp-relance-btn"
              title="Relancer"
              onClick={e => { e.stopPropagation(); onRelance() }}
            >
              🔔
            </button>
          )}
        </td>
      </tr>

      {/* Expanded detail */}
      {isExpanded && dispo.has_submitted && (
        <tr className="dp-detail-row">
          <td colSpan={10}>
            <div className="dp-detail-content">
              {JOURS_SEMAINE.map((jour, i) => {
                const val = dispo[jour]
                return (
                  <span key={i} className="dp-detail-tag">
                    {SEMAINE_REFERENCE.joursShort[i]}: {val ?? 'Indispo'}
                  </span>
                )
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
