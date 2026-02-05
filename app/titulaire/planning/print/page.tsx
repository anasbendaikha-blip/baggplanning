'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { MOCK_EMPLOYEES, getRoleLabel, EmployeeRole } from '@/lib/mock-data'
import { getWeekStart, addWeeks, formatWeekRange, getWeekDates, getWeekDayNames } from '@/lib/date-utils'
import { getAllLeaves, isOnLeave } from '@/lib/demo-store'
import { ROLE_PALETTE } from '@/lib/ui-tokens'

// ============================================================
// 📁 app/titulaire/planning/print/page.tsx
// ============================================================
// Version impression - A4 PORTRAIT - 3 jours empilés par page
// Page 1: Lun/Mar/Mer | Page 2: Jeu/Ven/Sam
// Améliorations: UI boutons + impression propre (uniquement planning)
// ============================================================

const ROLE_ORDER: EmployeeRole[] = ['Pharmacien', 'Preparateur', 'Apprenti', 'Etudiant', 'Conditionneur']
// Utiliser les couleurs centralisées de ROLE_PALETTE
const ROLE_COLORS: Record<EmployeeRole, string> = {
  Pharmacien: ROLE_PALETTE.Pharmacien.bg,
  Preparateur: ROLE_PALETTE.Preparateur.bg,
  Apprenti: ROLE_PALETTE.Apprenti.bg,
  Etudiant: ROLE_PALETTE.Etudiant.bg,
  Conditionneur: ROLE_PALETTE.Conditionneur.bg,
}
const JOURS_MAP = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const
const JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

// Timeline: 8h → 21h avec ticks toutes les 30 min
const START_MIN = 8 * 60
const END_MIN = 21 * 60
const TOTAL_MIN = END_MIN - START_MIN

const HALF_HOUR_TICKS = Array.from({ length: 27 }, (_, i) => {
  const total = START_MIN + i * 30
  const h = Math.floor(total / 60)
  const m = total % 60
  return { h, m, label: `${h}h${m === 30 ? '30' : ''}` }
})

const timeToPct = (t: string): number => {
  const [h, m] = t.split(':').map(Number)
  const mins = h * 60 + m
  return ((mins - START_MIN) / TOTAL_MIN) * 100
}

const formatDayLabel = (dateStr: string): string => {
  const d = new Date(`${dateStr}T00:00:00`)
  const weekday = d.toLocaleDateString('fr-FR', { weekday: 'long' })
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${dd}/${mm}`
}

const parseHoraire = (h: string | undefined): { s: string; e: string } | null => {
  if (!h || h === 'non' || h === 'variable' || h === 'congé') return null
  const p = h.replace(/h/g, ':').replace(/:(\d)(?!\d)/g, ':0$1').split('-')
  return p.length === 2 ? { s: p[0].trim().padStart(5, '0'), e: p[1].trim().padStart(5, '0') } : null
}

export default function PrintPlanningPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Chargement...</div>}>
      <PrintPlanningContent />
    </Suspense>
  )
}

function PrintPlanningContent() {
  const searchParams = useSearchParams()
  const [weekStart, setWeekStart] = useState(() => {
    const weekParam = searchParams.get('week')
    if (weekParam) {
      const [y, m, d] = weekParam.split('-').map(Number)
      return getWeekStart(new Date(y, m - 1, d))
    }
    return getWeekStart(new Date(2026, 0, 26))
  })
  const [leaves, setLeaves] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const weekDates = getWeekDates(weekStart)
  const weekLabel = formatWeekRange(weekStart)

  useEffect(() => { setLeaves(getAllLeaves()) }, [weekStart])

  const employees = MOCK_EMPLOYEES.filter(e => e.actif)

  const handlePrint = () => {
    setShowPreview(true)
    setTimeout(() => {
      window.print()
      setTimeout(() => setShowPreview(false), 500)
    }, 100)
  }

  // ============================================================
  // COMPOSANT: Bloc d'un jour (header timeline + rows employés)
  // ============================================================
  const DayBlock = ({ dayIdx }: { dayIdx: number }) => {
    const jourKey = JOURS_MAP[dayIdx]
    const dateStr = weekDates[dayIdx]
    const dayLabel = formatDayLabel(dateStr)

    return (
      <div className="day-block" style={{ marginBottom: '5px' }}>
        {/* Header jour avec timeline intégrée */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          color: '#92400e',
          padding: '4px 6px',
          fontSize: '9px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #f59e0b',
        }}>
          <span style={{ minWidth: '85px', fontSize: '10px' }}>{dayLabel}</span>
          {/* Mini timeline dans le header */}
          <div style={{ position: 'relative', height: '14px', flex: 1, background: 'rgba(255,255,255,0.6)', borderRadius: '3px' }}>
            {HALF_HOUR_TICKS.filter((_, i) => i % 2 === 0).map(t => {
              const left = ((t.h * 60 + t.m - START_MIN) / TOTAL_MIN) * 100
              return (
                <div key={`${t.h}-${t.m}`} style={{ position: 'absolute', left: `${left}%`, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '1px', height: '100%', background: '#f59e0b' }} />
                  <span style={{ position: 'absolute', top: '1px', left: '2px', fontSize: '6px', fontWeight: '600', color: '#b45309' }}>{t.h}h</span>
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
                  {/* Colonne employé */}
                  <td style={{
                    width: '70px',
                    padding: '2px 4px',
                    fontSize: '8px',
                    fontWeight: '600',
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    background: '#fafafa',
                    borderRight: '1px solid #e5e7eb',
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      borderRadius: '2px',
                      background: color,
                      color: 'white',
                      textAlign: 'center',
                      lineHeight: '12px',
                      fontSize: '6px',
                      marginRight: '3px',
                      fontWeight: '700',
                    }}>{emp.initiales}</span>
                    {emp.prenom.slice(0, 8)}
                  </td>

                  {/* Colonne timeline */}
                  <td style={{ padding: '2px 3px', height: '14px', background: onLeave ? '#fef2f2' : 'white' }}>
                    {onLeave ? (
                      <div style={{ fontSize: '7px', color: '#dc2626', fontWeight: '700', textAlign: 'center' }}>🏖️ CONGÉ</div>
                    ) : parsed ? (
                      <div style={{ position: 'relative', height: '10px', background: '#f1f5f9', borderRadius: '2px' }}>
                        {/* Ticks heures (toutes les heures) */}
                        {HALF_HOUR_TICKS.filter((_, i) => i % 2 === 0).map(t => {
                          const left = ((t.h * 60 + t.m - START_MIN) / TOTAL_MIN) * 100
                          return <div key={`tick-${t.h}`} style={{ position: 'absolute', left: `${left}%`, top: 0, bottom: 0, borderLeft: '1px solid #e2e8f0' }} />
                        })}
                        {/* Barre créneau */}
                        <div style={{
                          position: 'absolute',
                          top: '1px',
                          height: '8px',
                          left: `${timeToPct(parsed.s)}%`,
                          width: `${Math.max(timeToPct(parsed.e) - timeToPct(parsed.s), 3)}%`,
                          background: color,
                          borderRadius: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '6px',
                          fontWeight: '600',
                        }}>
                          {(timeToPct(parsed.e) - timeToPct(parsed.s)) > 12 ? `${parsed.s.slice(0, 5)}-${parsed.e.slice(0, 5)}` : ''}
                        </div>
                      </div>
                    ) : horaire === 'variable' ? (
                      <div style={{ fontSize: '6px', color: '#9ca3af', textAlign: 'center', fontStyle: 'italic' }}>variable</div>
                    ) : (
                      <div style={{ fontSize: '7px', color: '#d1d5db', textAlign: 'center' }}>—</div>
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

  // ============================================================
  // COMPOSANT: Page imprimable (3 jours empilés)
  // ============================================================
  const PrintPage = ({ dayIndices, pageNum }: { dayIndices: number[]; pageNum: number }) => (
    <div className="print-page" style={{
      pageBreakAfter: pageNum === 1 ? 'always' : 'auto',
      padding: '6mm',
      boxSizing: 'border-box',
    }}>
      {/* Header pharmacie (petit) */}
      <div className="print-header" style={{
        borderBottom: '2px solid #1e293b',
        paddingBottom: '4px',
        marginBottom: '6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>🏥 Pharmacie MAURER</div>
          <div style={{ fontSize: '10px', color: '#475569' }}>Semaine du {weekLabel}</div>
        </div>
        <div style={{ fontSize: '8px', color: '#64748b', textAlign: 'right' }}>
          <div>{JOURS_COURTS[dayIndices[0]]} → {JOURS_COURTS[dayIndices[2]]}</div>
          <div>Page {pageNum}/2</div>
        </div>
      </div>

      {/* 3 jours empilés */}
      {dayIndices.map(idx => <DayBlock key={idx} dayIdx={idx} />)}

      {/* Footer légende */}
      <div className="print-footer" style={{
        marginTop: '4px',
        paddingTop: '4px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '7px',
        color: '#64748b',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {ROLE_ORDER.map(r => (
            <span key={r} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '8px', height: '5px', background: ROLE_COLORS[r], borderRadius: '1px' }} />
              {getRoleLabel(r).slice(0, 5)}
            </span>
          ))}
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '8px', height: '5px', background: '#fca5a5', borderRadius: '1px' }} />
            Congé
          </span>
        </div>
        <span>Imprimé le {new Date().toLocaleDateString('fr-FR')}</span>
      </div>
    </div>
  )

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <>
      {/* CSS Global - Print + Screen */}
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 4mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          
          /* Masquer tout sauf la zone print */
          .no-print { display: none !important; }
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          
          .print-page { page-break-after: always; break-after: page; }
          .print-page:last-child { page-break-after: auto; break-after: auto; }
          
          /* Compaction impression */
          .print-header { margin-bottom: 4px !important; }
          .day-block { margin-bottom: 4px !important; }
        }
        
        @media screen {
          .print-container { display: none; }
          .print-container.preview { display: block; max-width: 210mm; margin: 0 auto; }
        }
      `}</style>

      {/* ========== CONTRÔLES UI (masqués à l'impression) ========== */}
      <div className="no-print" style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          {/* Titre */}
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>
            🖨️ Imprimer le Planning
          </h1>
          <p style={{ color: '#64748b', margin: '0 0 24px 0', fontSize: '14px' }}>
            Format A4 Portrait • 3 jours par page • 2 pages
          </p>

          {/* Navigation semaine */}
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
              {/* Bouton Précédent - AMÉLIORÉ */}
              <button
                onClick={() => setWeekStart(addWeeks(weekStart, -1))}
                style={{
                  width: '40px',
                  height: '40px',
                  padding: 0,
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '800',
                  color: '#0f172a',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0' }}
              >
                ←
              </button>

              {/* Label semaine */}
              <span style={{
                fontWeight: '600',
                fontSize: '15px',
                color: '#1e293b',
                minWidth: '180px',
                textAlign: 'center',
              }}>
                {weekLabel}
              </span>

              {/* Bouton Suivant - AMÉLIORÉ */}
              <button
                onClick={() => setWeekStart(addWeeks(weekStart, 1))}
                style={{
                  width: '40px',
                  height: '40px',
                  padding: 0,
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '800',
                  color: '#0f172a',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0' }}
              >
                →
              </button>

              {/* Bouton Aujourd'hui */}
              <button
                onClick={() => setWeekStart(getWeekStart(new Date(2026, 0, 26)))}
                style={{
                  padding: '8px 14px',
                  background: '#dbeafe',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#2563eb',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Aujourd'hui
              </button>
            </div>
          </div>

          {/* Aperçu des pages */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              padding: '14px',
              background: '#f1f5f9',
              borderRadius: '10px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '500' }}>Page 1</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Lun • Mar • Mer</div>
            </div>
            <div style={{
              padding: '14px',
              background: '#f1f5f9',
              borderRadius: '10px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '500' }}>Page 2</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Jeu • Ven • Sam</div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {/* Bouton Aperçu - VERT */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: showPreview ? '#dc2626' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '14px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = showPreview ? '#b91c1c' : '#047857'}
              onMouseLeave={e => e.currentTarget.style.background = showPreview ? '#dc2626' : '#059669'}
            >
              👁️ {showPreview ? 'Masquer aperçu' : 'Voir aperçu'}
            </button>

            {/* Bouton Imprimer */}
            <button
              onClick={handlePrint}
              style={{
                flex: 2,
                padding: '12px 20px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '14px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
              onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
            >
              🖨️ Imprimer / Exporter PDF
            </button>
          </div>

          {/* Info */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#fef3c7',
            borderRadius: '8px',
            border: '1px solid #fde68a',
          }}>
            <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
              💡 <strong>Conseil :</strong> Dans la boîte de dialogue, sélectionnez "Enregistrer en PDF" pour créer un fichier.
            </p>
          </div>

          {/* Retour */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <a
              href="/titulaire/planning"
              style={{
                color: '#2563eb',
                fontSize: '13px',
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              ← Retour au planning
            </a>
          </div>
        </div>
      </div>

      {/* ========== ZONE IMPRIMABLE ========== */}
      <div
        className={`print-container ${showPreview ? 'preview' : ''}`}
        style={{
          background: showPreview ? '#94a3b8' : 'transparent',
          padding: showPreview ? '24px' : 0,
        }}
      >
        {showPreview && (
          <div className="no-print" style={{
            textAlign: 'center',
            marginBottom: '16px',
            fontSize: '13px',
            color: 'white',
            fontWeight: '500',
          }}>
            📄 Aperçu A4 Portrait — 2 pages
          </div>
        )}

        {/* Zone à imprimer uniquement */}
        <div id="print-area">
          {/* Page 1: Lun/Mar/Mer */}
          <div style={{
            background: 'white',
            marginBottom: showPreview ? '24px' : 0,
            boxShadow: showPreview ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
            borderRadius: showPreview ? '4px' : 0,
          }}>
            <PrintPage dayIndices={[0, 1, 2]} pageNum={1} />
          </div>

          {/* Page 2: Jeu/Ven/Sam */}
          <div style={{
            background: 'white',
            boxShadow: showPreview ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
            borderRadius: showPreview ? '4px' : 0,
          }}>
            <PrintPage dayIndices={[3, 4, 5]} pageNum={2} />
          </div>
        </div>
      </div>
    </>
  )
}