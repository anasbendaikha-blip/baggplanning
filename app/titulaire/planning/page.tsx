'use client'

import { useState, useMemo } from 'react'
import { MOCK_EMPLOYEES, MOCK_DISPONIBILITES, MOCK_GARDES, MOCK_STATS, SEMAINE_REFERENCE, JOURS_SEMAINE, getRoleColor, getRoleIcon, getRoleLabel, EmployeeRole, MockEmployee, JourSemaine } from '@/lib/mock-data'

interface PlanningSlot { employee_id: string; start_time: string; end_time: string; pause_start?: string; pause_duration?: number; is_conge?: boolean; slots?: Array<{ start_time: string; end_time: string }> }
interface StudentCardState { expanded: boolean; startTime: string; endTime: string; hasPause: boolean; pauseStart: string; pauseDuration: number; isSplit: boolean; splitSlots: Array<{ startTime: string; endTime: string }> }
type ViewType = 'day' | 'recap' | 'guards'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8)
const ROLE_ORDER: EmployeeRole[] = ['Pharmacien', 'Preparateur', 'Apprenti', 'Etudiant', 'Conditionneur']
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const ROLE_BG: Record<EmployeeRole, string> = { Pharmacien: '#a855f7', Preparateur: '#3b82f6', Apprenti: '#10b981', Etudiant: '#10b981', Conditionneur: '#f59e0b' }

export default function PlanningPage() {
  const [selectedDay, setSelectedDay] = useState(0)
  const [activeView, setActiveView] = useState<ViewType>('day')
  const [slots, setSlots] = useState<Record<string, PlanningSlot[]>>(() => initPlanning())
  const [cardStates, setCardStates] = useState<Record<string, StudentCardState>>({})
  const [toast, setToast] = useState<string | null>(null)

  const dayKey = JOURS_SEMAINE[selectedDay]
  const daySlots = slots[dayKey] || []

  const empByRole = useMemo(() => {
    const g: Record<EmployeeRole, MockEmployee[]> = { Pharmacien: [], Preparateur: [], Apprenti: [], Etudiant: [], Conditionneur: [] }
    MOCK_EMPLOYEES.forEach(e => e.actif && g[e.fonction]?.push(e))
    return g
  }, [])

  const students = useMemo(() => MOCK_DISPONIBILITES.filter(d => MOCK_EMPLOYEES.find(e => e.id === d.employee_id)?.fonction === 'Etudiant' && d.has_submitted), [])
  const assignedIds = daySlots.filter(s => MOCK_EMPLOYEES.find(e => e.id === s.employee_id)?.fonction === 'Etudiant').map(s => s.employee_id)

  const getState = (id: string): StudentCardState => {
    if (cardStates[id]) return cardStates[id]
    const d = MOCK_DISPONIBILITES.find(x => x.employee_id === id)?.[dayKey]
    let st = '08:00', et = '14:00'
    if (d) { const p = d.split('-'); if (p.length === 2) { st = p[0].replace('h', ':').padStart(5, '0'); et = p[1].replace('h', ':').padStart(5, '0') } }
    return { expanded: false, startTime: st, endTime: et, hasPause: false, pauseStart: '12:00', pauseDuration: 30, isSplit: false, splitSlots: [] }
  }

  const updState = (id: string, u: Partial<StudentCardState>) => setCardStates(p => ({ ...p, [id]: { ...getState(id), ...u } }))

  const assign = (id: string) => {
    const s = getState(id), stu = MOCK_DISPONIBILITES.find(x => x.employee_id === id)
    if (!stu) return
    const slot: PlanningSlot = { employee_id: id, start_time: s.startTime, end_time: s.endTime, pause_start: s.hasPause ? s.pauseStart : undefined, pause_duration: s.hasPause ? s.pauseDuration : undefined }
    if (s.isSplit && s.splitSlots.length) slot.slots = s.splitSlots.map(x => ({ start_time: x.startTime, end_time: x.endTime }))
    setSlots(p => ({ ...p, [dayKey]: [...(p[dayKey] || []).filter(x => x.employee_id !== id), slot] }))
    setToast(`✓ ${stu.employee_name} ajouté !`)
    setTimeout(() => setToast(null), 2500)
    updState(id, { expanded: false })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button style={{ padding: '8px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>←</button>
          <span style={{ fontWeight: '600' }}>{SEMAINE_REFERENCE.jours[0].split(' ')[1]} - {SEMAINE_REFERENCE.jours[5].split(' ')[1]} {SEMAINE_REFERENCE.mois}</span>
          <button style={{ padding: '8px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>→</button>
        </div>
        <button style={{ padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}>Aujourd'hui</button>
      </header>

      {/* Tabs */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', padding: '0 24px' }}>
        <div style={{ display: 'flex', flex: 1 }}>
          {SEMAINE_REFERENCE.jours.map((j, i) => {
            const act = activeView === 'day' && selectedDay === i
            const [n, d] = j.split(' ')
            return <button key={i} onClick={() => { setSelectedDay(i); setActiveView('day') }} style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: act ? '#eff6ff' : 'transparent', borderBottom: act ? '2px solid #3b82f6' : '2px solid transparent', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontWeight: '500', color: act ? '#3b82f6' : '#64748b' }}>{n}</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{d} jan</span>
            </button>
          })}
        </div>
        <div style={{ width: '1px', height: '40px', background: '#e2e8f0', margin: '0 12px', alignSelf: 'center' }} />
        <div style={{ display: 'flex', gap: '8px', alignSelf: 'center' }}>
          <button onClick={() => setActiveView('recap')} style={{ padding: '12px 20px', background: activeView === 'recap' ? '#3b82f6' : 'transparent', color: activeView === 'recap' ? 'white' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}>📊 Récap</button>
          <button onClick={() => setActiveView('guards')} style={{ padding: '12px 20px', background: activeView === 'guards' ? '#8b5cf6' : 'transparent', color: activeView === 'guards' ? 'white' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}>🌙 Gardes</button>
        </div>
      </nav>

      {/* Content */}
      {activeView === 'day' && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <aside style={{ width: '360px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <header style={{ padding: '16px', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>🎓 Étudiants disponibles</h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>{SEMAINE_REFERENCE.jours[selectedDay]}</p>
            </header>
            <div style={{ padding: '12px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe', display: 'flex', gap: '10px' }}>
              <span>💡</span>
              <p style={{ fontSize: '12px', color: '#3b82f6', margin: 0 }}>Cliquez sur un étudiant pour lui assigner des heures</p>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {students.map(stu => {
                const st = getState(stu.employee_id), isAss = assignedIds.includes(stu.employee_id), avail = stu[dayKey], isAv = avail !== null
                const days = JOURS_SEMAINE.filter(j => stu[j] !== null).map((_, i) => DAYS_SHORT[i]).join(', ')
                return (
                  <article key={stu.employee_id} style={{ background: 'white', borderRadius: '10px', border: isAss ? '2px solid #10b981' : '1px solid #e2e8f0', marginBottom: '10px', overflow: 'hidden' }}>
                    <header onClick={() => updState(stu.employee_id, { expanded: !st.expanded })} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: st.expanded ? '#f8fafc' : 'white' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: isAss ? '#10b981' : '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>{stu.initiales}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{stu.employee_name}{isAss && <span style={{ color: '#10b981', marginLeft: '6px' }}>✓</span>}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{days}</div>
                      </div>
                      <span style={{ color: '#94a3b8' }}>{st.expanded ? '▲' : '▼'}</span>
                    </header>
                    {st.expanded && (
                      <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>📅 Disponibilités</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
                          {JOURS_SEMAINE.map((j, i) => {
                            const d = stu[j], has = d !== null
                            return <div key={j} style={{ padding: '6px', borderRadius: '6px', textAlign: 'center', background: has ? '#dcfce7' : '#f1f5f9', border: has ? '1px solid #86efac' : '1px solid #e2e8f0' }}>
                              <div style={{ fontWeight: '500', fontSize: '11px', color: has ? '#16a34a' : '#94a3b8' }}>{DAYS_SHORT[i]}</div>
                              <div style={{ fontSize: '10px', color: has ? '#15803d' : '#94a3b8' }}>{d || '—'}</div>
                            </div>
                          })}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>⏰ Assigner ({DAYS_SHORT[selectedDay]})</div>
                        {!isAv ? <div style={{ padding: '10px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '12px', color: '#d97706' }}>⚠️ Indisponible ce jour</div> : (
                          <>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px' }}>
                              <input type="time" value={st.startTime} onChange={e => updState(stu.employee_id, { startTime: e.target.value })} style={{ padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }} />
                              <span style={{ color: '#94a3b8' }}>→</span>
                              <input type="time" value={st.endTime} onChange={e => updState(stu.employee_id, { endTime: e.target.value })} style={{ padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }} />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={st.hasPause} onChange={e => updState(stu.employee_id, { hasPause: e.target.checked })} />
                              <span style={{ fontSize: '12px' }}>☕ Pause</span>
                            </label>
                            {st.hasPause && (
                              <div style={{ marginLeft: '20px', padding: '10px', background: '#f8fafc', borderRadius: '6px', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>Début:</span>
                                  <input type="time" value={st.pauseStart} onChange={e => updState(stu.employee_id, { pauseStart: e.target.value })} style={{ padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {[30, 45, 60].map(d => <button key={d} onClick={() => updState(stu.employee_id, { pauseDuration: d })} style={{ padding: '4px 10px', background: st.pauseDuration === d ? '#3b82f6' : 'white', color: st.pauseDuration === d ? 'white' : '#64748b', border: st.pauseDuration === d ? 'none' : '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>{d}min</button>)}
                                </div>
                              </div>
                            )}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={st.isSplit} onChange={e => updState(stu.employee_id, { isSplit: e.target.checked, splitSlots: e.target.checked ? [{ startTime: '08:00', endTime: '12:00' }, { startTime: '14:00', endTime: '18:00' }] : [] })} />
                              <span style={{ fontSize: '12px' }}>Heures fractionnées</span>
                            </label>
                            {st.isSplit && (
                              <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
                                {st.splitSlots.map((sl, idx) => (
                                  <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#f8fafc', padding: '6px', borderRadius: '4px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '10px', color: '#64748b' }}>#{idx + 1}</span>
                                    <input type="time" value={sl.startTime} onChange={e => { const n = [...st.splitSlots]; n[idx].startTime = e.target.value; updState(stu.employee_id, { splitSlots: n }) }} style={{ padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px' }} />
                                    <span>→</span>
                                    <input type="time" value={sl.endTime} onChange={e => { const n = [...st.splitSlots]; n[idx].endTime = e.target.value; updState(stu.employee_id, { splitSlots: n }) }} style={{ padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px' }} />
                                  </div>
                                ))}
                                <button onClick={() => updState(stu.employee_id, { splitSlots: [...st.splitSlots, { startTime: '14:00', endTime: '18:00' }] })} style={{ width: '100%', padding: '6px', background: 'white', border: '1px dashed #e2e8f0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', color: '#64748b' }}>+ Créneau</button>
                              </div>
                            )}
                            <button onClick={() => assign(stu.employee_id)} style={{ width: '100%', padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>✓ Valider</button>
                          </>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
            <footer style={{ padding: '12px', background: 'white', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>📊 Légende</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#a855f7' }} /><span style={{ fontSize: '10px', color: '#64748b' }}>Fixe</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} /><span style={{ fontSize: '10px', color: '#64748b' }}>Étudiant</span></div>
              </div>
            </footer>
          </aside>

          {/* Gantt */}
          <main style={{ flex: 1, overflow: 'auto', background: 'white' }}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>📅 {SEMAINE_REFERENCE.jours[selectedDay]} {SEMAINE_REFERENCE.mois}</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ padding: '8px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>📄 PDF</button>
                  <button onClick={() => { setToast('✓ Planning enregistré !'); setTimeout(() => setToast(null), 2500) }} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}>Enregistrer</button>
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                {/* Time header */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                  <div style={{ width: '180px', padding: '10px 14px', fontWeight: '600', color: '#64748b', fontSize: '12px', borderRight: '1px solid #e2e8f0' }}>Employé</div>
                  <div style={{ flex: 1, display: 'flex' }}>
                    {HOURS.map(h => <div key={h} style={{ flex: 1, padding: '10px 0', textAlign: 'center', fontSize: '11px', color: '#64748b', borderRight: '1px solid #f1f5f9', background: h === 13 ? '#fef3c7' : 'transparent' }}>{h}h</div>)}
                  </div>
                </div>

                {/* Groups */}
                {ROLE_ORDER.map(role => {
                  const emps = empByRole[role]
                  if (emps.length === 0 && role !== 'Etudiant') return null
                  return (
                    <div key={role}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '16px' }}>{getRoleIcon(role)}</span>
                        <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>{getRoleLabel(role)}s</span>
                        <span style={{ padding: '2px 8px', background: 'white', borderRadius: '10px', fontSize: '11px', color: '#64748b', border: '1px solid #e2e8f0' }}>{emps.length}</span>
                      </div>
                      {emps.length === 0 && role === 'Etudiant' && <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>👈 Assignez depuis la sidebar</div>}
                      {emps.map(emp => {
                        const slot = daySlots.find(s => s.employee_id === emp.id)
                        const working = !!slot && !slot.is_conge, conge = slot?.is_conge
                        const col = ROLE_BG[emp.fonction]
                        const pct = (t: string) => { const [h, m] = t.split(':').map(Number); return ((h + m / 60 - 8) / 13) * 100 }
                        const wid = (s: string, e: string) => pct(e) - pct(s)
                        return (
                          <div key={emp.id} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: conge ? '#fef2f2' : 'white' }}>
                            <div style={{ width: '180px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderRight: '1px solid #e2e8f0' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: working ? col : conge ? '#fca5a5' : '#e2e8f0', color: working || conge ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px' }}>{emp.initiales}</div>
                              <div>
                                <div style={{ fontWeight: '500', color: conge ? '#dc2626' : '#1e293b', fontSize: '13px' }}>{emp.prenom}</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{working && slot ? `${slot.start_time}-${slot.end_time}` : conge ? 'Congé' : '—'}</div>
                              </div>
                            </div>
                            <div style={{ flex: 1, position: 'relative', height: '56px' }}>
                              <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                                {HOURS.map(h => <div key={h} style={{ flex: 1, borderRight: '1px solid #f1f5f9', background: h === 13 ? 'rgba(254,243,199,0.3)' : 'transparent' }} />)}
                              </div>
                              {working && slot && (
                                <>
                                  {slot.slots?.length ? slot.slots.map((s, i) => (
                                    <div key={i} style={{ position: 'absolute', top: '10px', height: '36px', left: `${pct(s.start_time)}%`, width: `${wid(s.start_time, s.end_time)}%`, background: col, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{s.start_time}-{s.end_time}</div>
                                  )) : (
                                    <>
                                      <div style={{ position: 'absolute', top: '10px', height: '36px', left: `${pct(slot.start_time)}%`, width: `${wid(slot.start_time, slot.end_time)}%`, background: col, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{slot.start_time}-{slot.end_time}{slot.pause_duration && ` (${slot.pause_duration}min)`}</div>
                                      {slot.pause_start && slot.pause_duration && <div style={{ position: 'absolute', top: '10px', height: '36px', left: `${pct(slot.pause_start)}%`, width: `${wid(slot.pause_start, addMin(slot.pause_start, slot.pause_duration))}%`, background: '#fb923c', borderRadius: '3px' }} />}
                                    </>
                                  )}
                                </>
                              )}
                              {conge && <div style={{ position: 'absolute', top: '10px', left: '2%', right: '2%', height: '36px', background: '#fee2e2', border: '2px dashed #fca5a5', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', fontSize: '11px', fontWeight: '600' }}>🏖️ Congé</div>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div style={{ marginTop: '16px', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {ROLE_ORDER.map(r => <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '28px', height: '14px', background: ROLE_BG[r], borderRadius: '3px' }} /><span style={{ fontSize: '12px', color: '#64748b' }}>{getRoleLabel(r)}s</span></div>)}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '28px', height: '14px', background: '#fb923c', borderRadius: '3px' }} /><span style={{ fontSize: '12px', color: '#64748b' }}>Pause</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '28px', height: '14px', background: '#fee2e2', border: '2px dashed #fca5a5', borderRadius: '3px' }} /><span style={{ fontSize: '12px', color: '#64748b' }}>Congé</span></div>
              </div>
            </div>
          </main>
        </div>
      )}

      {activeView === 'recap' && <RecapView slots={slots} onBack={() => setActiveView('day')} onGuards={() => setActiveView('guards')} />}
      {activeView === 'guards' && <GuardsView onBack={() => setActiveView('day')} />}

      {toast && <div style={{ position: 'fixed', bottom: '20px', right: '20px', padding: '14px 20px', background: '#10b981', color: 'white', borderRadius: '10px', fontWeight: '500', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', zIndex: 1000 }}>{toast}</div>}
    </div>
  )
}

function RecapView({ slots, onBack, onGuards }: { slots: Record<string, PlanningSlot[]>; onBack: () => void; onGuards: () => void }) {
  const hours: Record<string, number> = {}
  Object.values(slots).forEach(ds => ds.forEach(s => { if (!s.is_conge) { const h = calcH(s.start_time, s.end_time, s.pause_duration); hours[s.employee_id] = (hours[s.employee_id] || 0) + h } }))
  const cov = (d: string) => { const ds = slots[d] || []; if (!ds.length) return 'warning'; const pk = ds.filter(s => { const st = parseInt(s.start_time?.split(':')[0] || '0'), en = parseInt(s.end_time?.split(':')[0] || '0'); return st <= 16 && en >= 18 }); return pk.length >= 2 ? 'ok' : 'warning' }
  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px 0' }}>📊 Récapitulatif</h2>
      <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>{SEMAINE_REFERENCE.jours[0]} - {SEMAINE_REFERENCE.jours[5]}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[{ t: 'Réponses', v: `${MOCK_STATS.disponibilites.repondu}/${MOCK_STATS.disponibilites.total}`, s: `${MOCK_STATS.disponibilites.en_attente} en attente` }, { t: 'Demandes', v: '3', s: 'à traiter' }, { t: 'Alertes', v: String(JOURS_SEMAINE.filter(j => cov(j) === 'warning').length), s: 'à vérifier' }, { t: 'Gardes', v: String(MOCK_GARDES.length), s: 'nuit', a: onGuards }].map((k, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{k.t}</p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '6px 0 2px 0' }}>{k.v}</p>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px 0' }}>{k.s}</p>
            <button onClick={k.a || onBack} style={{ width: '100%', padding: '6px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Voir</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '14px', borderBottom: '1px solid #e2e8f0', fontWeight: '600' }}>📌 Couverture</div>
          <div style={{ padding: '14px' }}>
            {JOURS_SEMAINE.map((j, i) => <div key={j} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: i < 5 ? '1px solid #f1f5f9' : 'none' }}><span style={{ flex: 1, fontWeight: '500', fontSize: '13px' }}>{DAYS_SHORT[i]}</span><span style={{ padding: '3px 8px', background: cov(j) === 'ok' ? '#dcfce7' : '#fef3c7', color: cov(j) === 'ok' ? '#16a34a' : '#d97706', borderRadius: '4px', fontSize: '11px', fontWeight: '500' }}>{cov(j) === 'ok' ? 'OK' : 'À vérifier'}</span></div>)}
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '14px', borderBottom: '1px solid #e2e8f0', fontWeight: '600' }}>📝 Actions</div>
          <div style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /><span style={{ fontSize: '12px', color: '#64748b' }}>Planning sauvegardé</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} /><span style={{ fontSize: '12px', color: '#64748b' }}>{MOCK_STATS.disponibilites.en_attente} dispo en attente</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} /><span style={{ fontSize: '12px', color: '#64748b' }}>3 demandes à traiter</span></div>
          </div>
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ padding: '14px', borderBottom: '1px solid #e2e8f0', fontWeight: '600' }}>⏱ Heures/semaine</div>
        <div style={{ padding: '14px' }}>
          {Object.entries(hours).length === 0 ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: '16px' }}>Assignez des employés pour voir les heures</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid #e2e8f0' }}><th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontWeight: '500', fontSize: '12px' }}>Employé</th><th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontWeight: '500', fontSize: '12px' }}>Rôle</th><th style={{ textAlign: 'right', padding: '8px', color: '#64748b', fontWeight: '500', fontSize: '12px' }}>Heures</th></tr></thead>
              <tbody>{Object.entries(hours).sort((a, b) => b[1] - a[1]).map(([id, h]) => { const e = MOCK_EMPLOYEES.find(x => x.id === id); if (!e) return null; return <tr key={id} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '28px', height: '28px', borderRadius: '6px', background: getRoleColor(e.fonction), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px' }}>{e.initiales}</div><span style={{ fontWeight: '500', fontSize: '13px' }}>{e.prenom}</span></div></td><td style={{ padding: '8px' }}><span style={{ padding: '3px 8px', background: getRoleColor(e.fonction) + '20', color: getRoleColor(e.fonction), borderRadius: '4px', fontSize: '11px', fontWeight: '500' }}>{getRoleLabel(e.fonction)}</span></td><td style={{ padding: '8px', textAlign: 'right', fontWeight: '600', color: h > 40 ? '#dc2626' : '#1e293b' }}>{h.toFixed(1)}h</td></tr> })}</tbody>
            </table>
          )}
        </div>
      </div>
      <button onClick={onBack} style={{ padding: '10px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>← Retour</button>
    </div>
  )
}

function GuardsView({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px 0' }}>🌙 Gardes</h2>
      <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>{SEMAINE_REFERENCE.jours[0]} - {SEMAINE_REFERENCE.jours[5]}</p>
      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ padding: '14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontWeight: '600' }}>📅 Planning gardes</span><span style={{ padding: '3px 10px', background: '#f3e8ff', color: '#7c3aed', borderRadius: '20px', fontSize: '11px', fontWeight: '500' }}>Nuit</span></div>
          <button style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>+ Ajouter</button>
        </div>
        <div style={{ padding: '14px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid #e2e8f0' }}><th style={{ textAlign: 'left', padding: '10px 8px', color: '#64748b', fontWeight: '500', fontSize: '12px' }}>Jour</th><th style={{ textAlign: 'left', padding: '10px 8px', color: '#64748b', fontWeight: '500', fontSize: '12px' }}>Horaire</th><th style={{ textAlign: 'left', padding: '10px 8px', color: '#64748b', fontWeight: '500', fontSize: '12px' }}>Pharmacien</th><th style={{ textAlign: 'left', padding: '10px 8px', color: '#64748b', fontWeight: '500', fontSize: '12px' }}>Équipe</th><th style={{ textAlign: 'left', padding: '10px 8px', color: '#64748b', fontWeight: '500', fontSize: '12px' }}>Statut</th></tr></thead>
            <tbody>{MOCK_GARDES.map(g => <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '10px 8px', fontWeight: '500' }}>{g.date}</td><td style={{ padding: '10px 8px', color: '#64748b' }}>20:30 → 08:30</td><td style={{ padding: '10px 8px' }}>{g.pharmacien_name || '—'}</td><td style={{ padding: '10px 8px', color: '#64748b' }}>{g.accompagnant_name || '—'}</td><td style={{ padding: '10px 8px' }}><span style={{ padding: '3px 8px', background: g.status === 'validee' ? '#dcfce7' : g.status === 'assignee' ? '#fef3c7' : '#fee2e2', color: g.status === 'validee' ? '#16a34a' : g.status === 'assignee' ? '#d97706' : '#dc2626', borderRadius: '4px', fontSize: '11px', fontWeight: '500' }}>{g.status === 'validee' ? 'Validée' : g.status === 'assignee' ? 'Assignée' : 'À assigner'}</span></td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ padding: '10px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Retour</button>
        <button style={{ padding: '10px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>📄 Exporter</button>
      </div>
    </div>
  )
}

function initPlanning(): Record<string, PlanningSlot[]> {
  const p: Record<string, PlanningSlot[]> = {}
  JOURS_SEMAINE.forEach(j => {
    const s: PlanningSlot[] = []
    MOCK_EMPLOYEES.forEach(e => {
      const h = e.horaires[j]
      if (h === 'congé') s.push({ employee_id: e.id, start_time: '00:00', end_time: '00:00', is_conge: true })
      else if (h !== 'non' && h !== 'variable') {
        const n = h.replace(/h/g, ':').replace(/:(\d)(?!\d)/g, ':0$1'), pt = n.split('-')
        if (pt.length === 2) {
          let st = pt[0].trim(), en = pt[1].trim()
          if (!st.includes(':')) st += ':00'; if (!en.includes(':')) en += ':00'
          st = st.split(':').map(x => x.padStart(2, '0')).join(':'); en = en.split(':').map(x => x.padStart(2, '0')).join(':')
          s.push({ employee_id: e.id, start_time: st, end_time: en })
        }
      }
    })
    p[j] = s
  })
  return p
}

function addMin(t: string, m: number): string { const [h, mi] = t.split(':').map(Number), tot = h * 60 + mi + m; return `${Math.floor(tot / 60).toString().padStart(2, '0')}:${(tot % 60).toString().padStart(2, '0')}` }
function calcH(s: string, e: string, p?: number): number { const [sh, sm] = s.split(':').map(Number), [eh, em] = e.split(':').map(Number); return (eh * 60 + em - sh * 60 - sm - (p || 0)) / 60 }
