'use client'

import { useState, useEffect } from 'react'
import { MOCK_EMPLOYEES, getRoleLabel, EmployeeRole } from '@/lib/mock-data'
import { getWeekStart, addWeeks, formatWeekRange, getWeekDates, getWeekDayNames } from '@/lib/date-utils'
import { getAllLeaves, isOnLeave } from '@/lib/demo-store'

// ============================================================
// 📁 app/titulaire/planning/print/page.tsx
// ============================================================
// Version impression - A4 PORTRAIT - 3 jours empilés par page
// Page 1: Lun/Mar/Mer | Page 2: Jeu/Ven/Sam
// ============================================================

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
const ROLE_ORDER: EmployeeRole[] = ['Pharmacien', 'Preparateur', 'Apprenti', 'Etudiant', 'Conditionneur']
const ROLE_COLORS: Record<EmployeeRole, string> = {
  Pharmacien: '#059669', Preparateur: '#2563eb', Apprenti: '#d97706', Etudiant: '#7c3aed', Conditionneur: '#475569'
}
const JOURS_MAP = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const
const JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const HALF_HOUR_TICKS = Array.from({ length: 27 }, (_, i) => {
  const total = 8 * 60 + i * 30
  const h = Math.floor(total / 60)
  const m = total % 60
  return { h, m, label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` }
})

const START_MIN = 8 * 60
const END_MIN = 21 * 60
const TOTAL_MIN = END_MIN - START_MIN

const timeToPct = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  const mins = h * 60 + m
  return ((mins - START_MIN) / TOTAL_MIN) * 100
}

const formatDayLabel = (dateStr: string) => {
  const d = new Date(`${dateStr}T00:00:00`)
  const weekday = d.toLocaleDateString('fr-FR', { weekday: 'long' })
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  return `${cap} ${dd}-${mm}`
}

const ensureMondayWeekStart = (d: Date) => {
  const x = new Date(d)
  const day = x.getDay() // 0=Sun
  const diff = x.getDate() - day + (day === 0 ? -6 : 1)
  x.setDate(diff)
  x.setHours(0, 0, 0, 0)
  return x
}

const parseHoraire = (h: string | undefined): { s: string; e: string } | null => {
  if (!h || h === 'non' || h === 'variable' || h === 'congé') return null
  const p = h.replace(/h/g, ':').replace(/:(\d)(?!\d)/g, ':0$1').split('-')
  return p.length === 2 ? { s: p[0].trim().padStart(5, '0'), e: p[1].trim().padStart(5, '0') } : null
}

export default function PrintPlanningPage() {
  const [weekStart, setWeekStart] = useState(() => ensureMondayWeekStart(new Date(2026, 0, 26)))
  const [leaves, setLeaves] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const weekDates = getWeekDates(weekStart)
  const weekDayNames = getWeekDayNames(weekStart)
  const weekLabel = formatWeekRange(weekStart)

  useEffect(() => { setLeaves(getAllLeaves()) }, [weekStart])

  const employees = MOCK_EMPLOYEES.filter(e => e.actif)

  const handlePrint = () => { setShowPreview(true); setTimeout(() => { window.print(); setTimeout(() => setShowPreview(false), 300) }, 50) }

  // Composant : 1 jour (bloc compact)
  const DayBlock = ({ dayIdx }: { dayIdx: number }) => {
    const jourKey = JOURS_MAP[dayIdx]
    const dateStr = weekDates[dayIdx]
    const dayLabel = formatDayLabel(dateStr)

    return (
      <div style={{ marginBottom: '6px' }}>
        {/* Header jour + timeline (fusionnés) */}
        <div style={{
          background: '#fef3c7',
          color: '#7c2d12',
          padding: '3px 6px',
          fontSize: '9px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderTop: '1px solid #fde68a',
          borderBottom: '1px solid #fde68a'
        }}>
          <span style={{ minWidth: '78px' }}>{dayLabel}</span>
          <div style={{
            position: 'relative',
            height: '14px',
            flex: 1,
            background: 'rgba(255,255,255,0.55)',
            borderRadius: '3px'
          }}>
            {HALF_HOUR_TICKS.map(t => {
              const left = ((t.h * 60 + t.m - START_MIN) / TOTAL_MIN) * 100
              const isHour = t.m === 0
              return (
                <div key={t.label} style={{ position: 'absolute', left: `${left}%`, top: 0, bottom: 0 }}>
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    bottom: '2px',
                    left: 0,
                    width: 0,
                    borderLeft: `1px solid ${isHour ? '#f59e0b' : '#fed7aa'}`
                  }} />
                  {isHour && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: '2px',
                      fontSize: '6px',
                      fontWeight: '700',
                      color: '#9a3412',
                      whiteSpace: 'nowrap'
                    }}>
                      {t.label}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Table employés */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7px' }}>
          <tbody>
            {employees.map(emp => {
              const onLeave = isOnLeave(emp.id, dateStr)
              const horaire = emp.horaires[jourKey]
              const parsed = parseHoraire(horaire)
              const color = ROLE_COLORS[emp.fonction]

              return (
                <tr key={emp.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  {/* Nom - très compact */}
                  <td style={{ width: '68px', padding: '1px 4px', fontSize: '8px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: '#fafafa', borderRight: '1px solid #e5e7eb' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: color, color: 'white', textAlign: 'center', lineHeight: '10px', fontSize: '5px', marginRight: '2px', fontWeight: '700' }}>{emp.initiales}</span>
                    {emp.prenom.slice(0, 8)}
                  </td>
                  {/* Timeline */}
                  <td style={{ padding: '1px 2px', height: '12px', background: onLeave ? '#fef2f2' : 'white' }}>
                    {onLeave ? (
                      <div style={{ fontSize: '6px', color: '#dc2626', fontWeight: '600', textAlign: 'center' }}>CONGÉ</div>
                    ) : parsed ? (
                      <div style={{ position: 'relative', height: '10px', background: '#f1f5f9', borderRadius: '1px' }}>
                        {/* Ticks heures */}
                        {HALF_HOUR_TICKS.map(t => {
                          const left = ((t.h * 60 + t.m - START_MIN) / TOTAL_MIN) * 100
                          const isHour = t.m === 0
                          return (
                            <div
                              key={t.label}
                              style={{
                                position: 'absolute',
                                left: `${left}%`,
                                top: 0,
                                bottom: 0,
                                borderLeft: `1px solid ${isHour ? '#e2e8f0' : '#f1f5f9'}`
                              }}
                            />
                          )
                        })}
                        {/* Barre créneau */}
                        <div style={{
                          position: 'absolute', top: '1px', height: '8px',
                          left: `${timeToPct(parsed.s)}%`, width: `${Math.max(timeToPct(parsed.e) - timeToPct(parsed.s), 3)}%`,
                          background: color, borderRadius: '1px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '5px', fontWeight: '600'
                        }}>
                          {(timeToPct(parsed.e) - timeToPct(parsed.s)) > 15 ? `${parsed.s.slice(0,5)}-${parsed.e.slice(0,5)}` : ''}
                        </div>
                      </div>
                    ) : horaire === 'variable' ? (
                      <div style={{ fontSize: '5px', color: '#9ca3af', textAlign: 'center' }}>var.</div>
                    ) : (
                      <div style={{ fontSize: '6px', color: '#d1d5db', textAlign: 'center' }}>—</div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Composant : 1 page (3 jours empilés)
  const PrintPage = ({ dayIndices, pageNum }: { dayIndices: number[]; pageNum: number }) => (
    <div className="print-page" style={{ 
      pageBreakAfter: pageNum === 1 ? 'always' : 'auto',
      padding: '8px',
      boxSizing: 'border-box'
    }}>
      {/* Header mini */}
      <div className="print-page-header" style={{ borderBottom: '1px solid #334155', paddingBottom: '4px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#1e293b' }}>
          Pharmacie MAURER — {weekLabel}
        </div>
        <div style={{ fontSize: '7px', color: '#64748b' }}>
          {JOURS_COURTS[dayIndices[0]]}→{JOURS_COURTS[dayIndices[2]]} • Page {pageNum}/2
        </div>
      </div>

      {/* 3 jours empilés */}
      {dayIndices.map(idx => <DayBlock key={idx} dayIdx={idx} />)}

      {/* Footer mini */}
      <div className="print-page-footer" style={{ marginTop: '4px', paddingTop: '3px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '6px', color: '#94a3b8' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {ROLE_ORDER.map(r => <span key={r} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><span style={{ width: '6px', height: '4px', background: ROLE_COLORS[r], borderRadius: '1px' }} />{getRoleLabel(r).slice(0,4)}</span>)}
        </div>
        <span>Imprimé {new Date().toLocaleDateString('fr-FR')}</span>
      </div>
    </div>
  )

  return (
    <>
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 4mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-container { display: block !important; }
          .print-page { page-break-after: always; break-after: page; }
          .print-page:last-child { page-break-after: auto; break-after: auto; }
          /* print ONLY planning */
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print-page-header, .print-page-footer { display: none !important; }
        }
        @media screen {
          .print-container { display: none; }
          .print-container.preview { display: block; max-width: 210mm; margin: 0 auto; }
        }
      `}</style>

      {/* Contrôles (masqués à l'impression) */}
      <div className="no-print" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>🖨️ Imprimer le Planning</h1>
          <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: '13px' }}>A4 Portrait • 3 jours/page • 2 pages</p>

          {/* Navigation semaine */}
          <div style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setWeekStart(prev => ensureMondayWeekStart(addWeeks(prev, -1)))}
                onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                style={{ width: '36px', height: '36px', padding: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: '#0f172a', fontSize: '18px', lineHeight: '36px' }}
              >←</button>
              <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b', minWidth: '160px', textAlign: 'center' }}>{weekLabel}</span>
              <button
                onClick={() => setWeekStart(prev => ensureMondayWeekStart(addWeeks(prev, 1)))}
                onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                style={{ width: '36px', height: '36px', padding: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: '#0f172a', fontSize: '18px', lineHeight: '36px' }}
              >→</button>
              <button onClick={() => setWeekStart(ensureMondayWeekStart(new Date(2026, 0, 26)))} style={{ padding: '6px 10px', background: '#dbeafe', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#2563eb', fontSize: '12px' }}>Auj.</button>
            </div>
          </div>

          {/* Aperçu résumé */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>Page 1</div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>Lun • Mar • Mer</div>
            </div>
            <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>Page 2</div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>Jeu • Ven • Sam</div>
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowPreview(!showPreview)} onMouseEnter={e => { e.currentTarget.style.background = '#047857' }} onMouseLeave={e => { e.currentTarget.style.background = '#059669' }} style={{ flex: 1, padding: '10px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
              👁️ {showPreview ? 'Masquer' : 'Aperçu'}
            </button>
            <button onClick={handlePrint} style={{ flex: 2, padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
              🖨️ Imprimer / PDF
            </button>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <a href="/titulaire/planning" style={{ color: '#2563eb', fontSize: '12px', textDecoration: 'none' }}>← Retour au planning</a>
          </div>
        </div>
      </div>

      {/* Contenu imprimable */}
      <div className={`print-container ${showPreview ? 'preview' : ''}`} style={{ background: showPreview ? '#e2e8f0' : 'transparent', padding: showPreview ? '20px' : 0 }}>
        {showPreview && <div className="no-print" style={{ textAlign: 'center', marginBottom: '10px', fontSize: '11px', color: '#64748b' }}>📄 Aperçu A4 Portrait (2 pages)</div>}

        <div id="print-area">
          <div style={{ background: 'white', marginBottom: showPreview ? '20px' : 0, boxShadow: showPreview ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>
            <PrintPage dayIndices={[0, 1, 2]} pageNum={1} />
          </div>

          <div style={{ background: 'white', boxShadow: showPreview ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>
            <PrintPage dayIndices={[3, 4, 5]} pageNum={2} />
          </div>
        </div>
      </div>
    </>
  )
}