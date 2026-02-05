'use client'

import { useState, useMemo } from 'react'

/* ─────────────── UI PALETTE ─────────────── */
const UI = {
  primary:    '#10b981',
  primaryDk:  '#059669',
  primaryLt:  '#d1fae5',
  danger:     '#ef4444',
  dangerLt:   '#fee2e2',
  gray50:     '#f9fafb',
  gray100:    '#f3f4f6',
  gray200:    '#e5e7eb',
  gray300:    '#d1d5db',
  gray400:    '#9ca3af',
  gray500:    '#6b7280',
  gray600:    '#4b5563',
  gray700:    '#374151',
  gray800:    '#1f2937',
  gray900:    '#111827',
  white:      '#ffffff',
  radius:     '12px',
  radiusSm:   '8px',
  shadow:     '0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)',
  shadowMd:   '0 4px 12px rgba(0,0,0,.08)',
}

/* ─────────────── DATA ─────────────── */
const JOURS = [
  { id: 'lundi',    nom: 'Lundi',    short: 'Lun', date: '20 janvier', shortDate: '20' },
  { id: 'mardi',    nom: 'Mardi',    short: 'Mar', date: '21 janvier', shortDate: '21' },
  { id: 'mercredi', nom: 'Mercredi', short: 'Mer', date: '22 janvier', shortDate: '22' },
  { id: 'jeudi',    nom: 'Jeudi',    short: 'Jeu', date: '23 janvier', shortDate: '23' },
  { id: 'vendredi', nom: 'Vendredi', short: 'Ven', date: '24 janvier', shortDate: '24' },
  { id: 'samedi',   nom: 'Samedi',   short: 'Sam', date: '25 janvier', shortDate: '25' },
]

const HEURES_DEBUT = ['08:30','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00']
const HEURES_FIN   = ['12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','19:30','20:30']

const QUICK_SLOTS = [
  { key: 'matin',   label: 'Matin',      icon: '🌅', debut: '08:30', fin: '14:00' },
  { key: 'aprem',   label: 'Après-midi',  icon: '☀️', debut: '14:00', fin: '20:30' },
  { key: 'soir',    label: 'Soir',        icon: '🌙', debut: '17:00', fin: '20:30' },
  { key: 'journee', label: 'Journée',     icon: '📅', debut: '08:30', fin: '20:30' },
]

type DayDispo = { disponible: boolean; debut: string; fin: string }

/* ─────────────── COMPONENT ─────────────── */
export default function EmployeDisponibilitesPage() {
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false, message: '', type: 'success',
  })

  const [disponibilites, setDisponibilites] = useState<Record<string, DayDispo>>(() => {
    const init: Record<string, DayDispo> = {}
    JOURS.forEach(j => { init[j.id] = { disponible: false, debut: '17:00', fin: '20:30' } })
    return init
  })

  /* ── helpers ── */
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type })
    window.setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3500)
  }

  const fmtH = (h: string) => h.replace(':', 'h')

  const totalHeures = useMemo(() => {
    let total = 0
    Object.values(disponibilites).forEach(d => {
      if (d.disponible) {
        const [hD, mD] = d.debut.split(':').map(Number)
        const [hF, mF] = d.fin.split(':').map(Number)
        total += (hF + mF / 60) - (hD + mD / 60)
      }
    })
    return total
  }, [disponibilites])

  const joursDispos = useMemo(() =>
    Object.values(disponibilites).filter(d => d.disponible).length
  , [disponibilites])

  const completion = Math.round((joursDispos / JOURS.length) * 100)

  /* ── actions ── */
  const toggleDispo = (jourId: string, value: boolean) => {
    setDisponibilites(prev => ({ ...prev, [jourId]: { ...prev[jourId], disponible: value } }))
  }

  const updateHeure = (jourId: string, type: 'debut' | 'fin', value: string) => {
    setDisponibilites(prev => ({ ...prev, [jourId]: { ...prev[jourId], [type]: value } }))
  }

  const quickSelect = (jourId: string, slot: typeof QUICK_SLOTS[number]) => {
    setDisponibilites(prev => ({
      ...prev,
      [jourId]: { disponible: true, debut: slot.debut, fin: slot.fin },
    }))
  }

  const setAll = (value: boolean) => {
    setDisponibilites(prev => {
      const n = { ...prev }
      Object.keys(n).forEach(k => { n[k] = { ...n[k], disponible: value } })
      return n
    })
  }

  const save = () => showToast('Disponibilités enregistrées avec succès !')

  return (
    <>
      {/* ── Header card ── */}
      <div className="dsp-header">
        <div className="dsp-header-top">
          <div>
            <p className="dsp-header-label">Semaine du</p>
            <p className="dsp-header-dates">20 – 25 Janvier 2025</p>
          </div>
          <div className="dsp-header-stats">
            <div className="dsp-stat">
              <span className="dsp-stat-value">{totalHeures.toFixed(1)}h</span>
              <span className="dsp-stat-label">Total</span>
            </div>
            <div className="dsp-stat">
              <span className="dsp-stat-value">{joursDispos}/{JOURS.length}</span>
              <span className="dsp-stat-label">Jours</span>
            </div>
          </div>
        </div>

        {/* progress */}
        <div className="dsp-progress-wrap">
          <div className="dsp-progress-bar">
            <div className="dsp-progress-fill" style={{ width: `${completion}%` }} />
          </div>
          <span className="dsp-progress-label">{completion}% complété</span>
        </div>

        <div className="dsp-deadline">
          ⏰ Date limite : <strong>Dimanche 19 janvier à 20h</strong>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="dsp-quick-actions">
        <button className="dsp-qa-btn dsp-qa-primary" onClick={() => setAll(true)}>
          ✓ Tout disponible
        </button>
        <button className="dsp-qa-btn dsp-qa-secondary" onClick={() => setAll(false)}>
          ✗ Tout effacer
        </button>
      </div>

      {/* ── Day cards ── */}
      {JOURS.map(jour => {
        const d = disponibilites[jour.id]
        const dayHours = d.disponible
          ? (() => {
              const [hD, mD] = d.debut.split(':').map(Number)
              const [hF, mF] = d.fin.split(':').map(Number)
              return ((hF + mF / 60) - (hD + mD / 60)).toFixed(1)
            })()
          : '0'

        return (
          <div key={jour.id} className={`dsp-card ${d.disponible ? 'dsp-card--on' : ''}`}>
            {/* card header */}
            <div className="dsp-card-head">
              <div className="dsp-card-day">
                <div className={`dsp-card-num ${d.disponible ? 'dsp-card-num--on' : ''}`}>{jour.shortDate}</div>
                <div>
                  <div className="dsp-card-name">{jour.nom}</div>
                  <div className="dsp-card-date">{jour.date}</div>
                </div>
              </div>
              {d.disponible && (
                <div className="dsp-card-badge">
                  {fmtH(d.debut)} – {fmtH(d.fin)} · {dayHours}h
                </div>
              )}
            </div>

            {/* toggle */}
            <div className="dsp-toggle-row">
              <button
                className={`dsp-toggle ${d.disponible ? 'dsp-toggle--on' : ''}`}
                onClick={() => toggleDispo(jour.id, true)}
              >
                <span className="dsp-toggle-dot">✓</span> Disponible
              </button>
              <button
                className={`dsp-toggle ${!d.disponible ? 'dsp-toggle--off' : ''}`}
                onClick={() => toggleDispo(jour.id, false)}
              >
                <span className="dsp-toggle-dot">✗</span> Indisponible
              </button>
            </div>

            {/* expanded content */}
            {d.disponible && (
              <div className="dsp-card-body">
                {/* quick slots */}
                <div className="dsp-slots">
                  {QUICK_SLOTS.map(s => {
                    const active = d.debut === s.debut && d.fin === s.fin
                    return (
                      <button
                        key={s.key}
                        className={`dsp-slot ${active ? 'dsp-slot--active' : ''}`}
                        onClick={() => quickSelect(jour.id, s)}
                      >
                        <span>{s.icon}</span>
                        <span>{s.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* time selectors */}
                <div className="dsp-time-row">
                  <div className="dsp-time-field">
                    <label className="dsp-time-label">Début</label>
                    <select
                      className="dsp-time-select"
                      value={d.debut}
                      onChange={e => updateHeure(jour.id, 'debut', e.target.value)}
                    >
                      {HEURES_DEBUT.map(h => <option key={h} value={h}>{fmtH(h)}</option>)}
                    </select>
                  </div>
                  <div className="dsp-time-arrow">→</div>
                  <div className="dsp-time-field">
                    <label className="dsp-time-label">Fin</label>
                    <select
                      className="dsp-time-select"
                      value={d.fin}
                      onChange={e => updateHeure(jour.id, 'fin', e.target.value)}
                    >
                      {HEURES_FIN.map(h => <option key={h} value={h}>{fmtH(h)}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* spacer for sticky button */}
      <div style={{ height: '80px' }} />

      {/* ── Sticky save ── */}
      <div className="dsp-sticky-save">
        <button className="dsp-save-btn" onClick={save}>
          ✓ Enregistrer mes disponibilités
        </button>
      </div>

      {/* ── Toast ── */}
      <div className={`dsp-toast ${toast.type} ${toast.visible ? 'dsp-toast--show' : ''}`}>
        <span>{toast.type === 'success' ? '✓' : '✗'}</span>
        <span>{toast.message}</span>
      </div>

      <style jsx global>{`
        /* ═══════════════ DISPONIBILITES ═══════════════ */

        /* ── Header card ── */
        .dsp-header {
          background: ${UI.white};
          border-radius: ${UI.radius};
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: ${UI.shadow};
          border: 1px solid ${UI.gray200};
        }
        .dsp-header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .dsp-header-label {
          font-size: 12px;
          color: ${UI.gray500};
          margin: 0 0 2px;
          text-transform: uppercase;
          letter-spacing: .5px;
          font-weight: 600;
        }
        .dsp-header-dates {
          font-size: 17px;
          font-weight: 700;
          color: ${UI.gray900};
          margin: 0;
        }
        .dsp-header-stats {
          display: flex;
          gap: 16px;
        }
        .dsp-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .dsp-stat-value {
          font-size: 18px;
          font-weight: 800;
          color: ${UI.primary};
        }
        .dsp-stat-label {
          font-size: 11px;
          color: ${UI.gray500};
          text-transform: uppercase;
          letter-spacing: .3px;
        }

        /* progress */
        .dsp-progress-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .dsp-progress-bar {
          flex: 1;
          height: 6px;
          background: ${UI.gray200};
          border-radius: 3px;
          overflow: hidden;
        }
        .dsp-progress-fill {
          height: 100%;
          background: ${UI.primary};
          border-radius: 3px;
          transition: width .3s ease;
        }
        .dsp-progress-label {
          font-size: 12px;
          color: ${UI.gray500};
          font-weight: 600;
          white-space: nowrap;
        }

        .dsp-deadline {
          font-size: 12px;
          color: ${UI.gray600};
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: ${UI.radiusSm};
          padding: 8px 12px;
          text-align: center;
        }

        /* ── Quick actions ── */
        .dsp-quick-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .dsp-qa-btn {
          flex: 1;
          padding: 10px;
          border-radius: ${UI.radiusSm};
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all .15s;
        }
        .dsp-qa-primary {
          background: ${UI.primaryLt};
          color: ${UI.primaryDk};
        }
        .dsp-qa-primary:active { background: ${UI.primary}; color: ${UI.white}; }
        .dsp-qa-secondary {
          background: ${UI.gray100};
          color: ${UI.gray600};
        }
        .dsp-qa-secondary:active { background: ${UI.gray300}; }

        /* ── Day card ── */
        .dsp-card {
          background: ${UI.white};
          border-radius: ${UI.radius};
          border: 1.5px solid ${UI.gray200};
          padding: 14px;
          margin-bottom: 10px;
          transition: border-color .2s, box-shadow .2s;
        }
        .dsp-card--on {
          border-color: ${UI.primary};
          box-shadow: 0 0 0 3px ${UI.primaryLt};
        }

        .dsp-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .dsp-card-day {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dsp-card-num {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: ${UI.gray100};
          color: ${UI.gray600};
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 15px;
          transition: all .2s;
        }
        .dsp-card-num--on {
          background: ${UI.primary};
          color: ${UI.white};
        }
        .dsp-card-name {
          font-weight: 700;
          font-size: 15px;
          color: ${UI.gray800};
        }
        .dsp-card-date {
          font-size: 12px;
          color: ${UI.gray400};
        }
        .dsp-card-badge {
          font-size: 12px;
          font-weight: 600;
          color: ${UI.primaryDk};
          background: ${UI.primaryLt};
          padding: 4px 10px;
          border-radius: 20px;
          white-space: nowrap;
        }

        /* toggle row */
        .dsp-toggle-row {
          display: flex;
          gap: 6px;
          margin-bottom: 10px;
        }
        .dsp-toggle {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px;
          border-radius: ${UI.radiusSm};
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid ${UI.gray200};
          background: ${UI.white};
          color: ${UI.gray500};
          transition: all .15s;
        }
        .dsp-toggle--on {
          background: ${UI.primaryLt};
          border-color: ${UI.primary};
          color: ${UI.primaryDk};
        }
        .dsp-toggle--off {
          background: ${UI.dangerLt};
          border-color: ${UI.danger};
          color: ${UI.danger};
        }
        .dsp-toggle-dot {
          font-size: 11px;
        }

        /* card body (expanded) */
        .dsp-card-body {
          animation: dsp-slideDown .2s ease;
        }
        @keyframes dsp-slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* quick slots */
        .dsp-slots {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 10px;
        }
        .dsp-slot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 8px 4px;
          border-radius: ${UI.radiusSm};
          border: 1.5px solid ${UI.gray200};
          background: ${UI.gray50};
          font-size: 11px;
          font-weight: 600;
          color: ${UI.gray600};
          cursor: pointer;
          transition: all .15s;
        }
        .dsp-slot:active { transform: scale(.96); }
        .dsp-slot--active {
          border-color: ${UI.primary};
          background: ${UI.primaryLt};
          color: ${UI.primaryDk};
        }

        /* time row */
        .dsp-time-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }
        .dsp-time-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dsp-time-label {
          font-size: 11px;
          font-weight: 600;
          color: ${UI.gray500};
          text-transform: uppercase;
          letter-spacing: .3px;
        }
        .dsp-time-select {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid ${UI.gray200};
          border-radius: ${UI.radiusSm};
          font-size: 15px;
          font-weight: 600;
          color: ${UI.gray800};
          background: ${UI.white};
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }
        .dsp-time-select:focus {
          outline: none;
          border-color: ${UI.primary};
          box-shadow: 0 0 0 3px ${UI.primaryLt};
        }
        .dsp-time-arrow {
          font-size: 18px;
          color: ${UI.gray400};
          padding-bottom: 10px;
          font-weight: 600;
        }

        /* ── Sticky save ── */
        .dsp-sticky-save {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 12px 16px;
          padding-bottom: max(12px, env(safe-area-inset-bottom));
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-top: 1px solid ${UI.gray200};
          z-index: 100;
        }
        .dsp-save-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: ${UI.radiusSm};
          background: ${UI.primary};
          color: ${UI.white};
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background .15s;
          box-shadow: ${UI.shadowMd};
        }
        .dsp-save-btn:active { background: ${UI.primaryDk}; }

        /* ── Toast ── */
        .dsp-toast {
          position: fixed;
          bottom: 80px;
          left: 16px;
          right: 16px;
          padding: 12px 16px;
          border-radius: ${UI.radiusSm};
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transform: translateY(20px);
          opacity: 0;
          pointer-events: none;
          transition: all .25s ease;
          z-index: 200;
        }
        .dsp-toast.success {
          background: ${UI.primaryDk};
          color: ${UI.white};
        }
        .dsp-toast.error {
          background: ${UI.danger};
          color: ${UI.white};
        }
        .dsp-toast--show {
          transform: translateY(0);
          opacity: 1;
          pointer-events: auto;
        }

        /* ── Desktop enhancements ── */
        @media (min-width: 768px) {
          .dsp-header {
            padding: 20px 24px;
          }
          .dsp-header-dates {
            font-size: 20px;
          }
          .dsp-quick-actions {
            max-width: 400px;
          }
          .dsp-card {
            padding: 18px 20px;
          }
          .dsp-slots {
            gap: 8px;
          }
          .dsp-slot {
            flex-direction: row;
            gap: 6px;
            padding: 10px 14px;
            font-size: 13px;
          }
          .dsp-sticky-save {
            max-width: 500px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: ${UI.radius} ${UI.radius} 0 0;
          }
          .dsp-toast {
            max-width: 400px;
            left: 50%;
            right: auto;
            transform: translateX(-50%) translateY(20px);
          }
          .dsp-toast--show {
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </>
  )
}
