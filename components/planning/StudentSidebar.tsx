'use client'

import { useState, useEffect, useMemo } from 'react'
import { MOCK_EMPLOYEES, MOCK_DISPONIBILITES, JOURS_SEMAINE, JourSemaine } from '@/lib/mock-data'

// ============================================================
// 📁 components/planning/StudentSidebar.tsx
// ============================================================
// Sidebar moderne pour affectation des étudiants
// Inspiré du design shadcn/Tailwind
// ============================================================

const TXT = {
  primary: '#111827',
  secondary: '#4b5563',
  muted: '#6b7280',
  link: '#2563eb',
}

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const PAUSE_DURATIONS = [30, 45, 60]

interface StudentCardState {
  expanded: boolean
  startTime: string
  endTime: string
  hasPause: boolean
  pauseStart: string
  pauseDuration: number
  isSplit: boolean
  splitSlots: Array<{ startTime: string; endTime: string }>
}

interface Assignment {
  studentId: string
  studentName: string
  dayIndex: number
  slots: Array<{
    startTime: string
    endTime: string
    pauseStart?: string
    pauseDuration?: number
  }>
}

interface StudentSidebarProps {
  selectedDay: number
  weekDayNames: string[]
  onAssign?: (assignment: Assignment) => void
  onClose?: () => void
}

const normTime = (t: string) => {
  if (!t) return ''
  return t.replace('h', ':').replace(/:(\d)(?!\d)/g, ':0$1').padStart(5, '0')
}

export default function StudentSidebar({ 
  selectedDay, 
  weekDayNames,
  onAssign,
  onClose 
}: StudentSidebarProps) {
  const [cardStates, setCardStates] = useState<Record<string, StudentCardState>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const dayKey = JOURS_SEMAINE[selectedDay]

  // Récupérer les étudiants avec disponibilités
  const students = useMemo(() => {
    return MOCK_DISPONIBILITES
      .filter(d => {
        const emp = MOCK_EMPLOYEES.find(e => e.id === d.employee_id)
        return emp?.fonction === 'Etudiant' && d.has_submitted
      })
      .filter(d => d.employee_name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(d => !filterAvailableOnly || d[dayKey] !== null)
  }, [searchQuery, filterAvailableOnly, dayKey])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const getCardState = (studentId: string, student: typeof students[0]): StudentCardState => {
    if (cardStates[studentId]) return cardStates[studentId]
    
    const availability = student[dayKey]
    let startTime = '08:00'
    let endTime = '14:00'
    
    if (availability) {
      const parts = availability.split('-')
      if (parts.length === 2) {
        startTime = normTime(parts[0])
        endTime = normTime(parts[1])
      }
    }
    
    return {
      expanded: false,
      startTime,
      endTime,
      hasPause: false,
      pauseStart: '12:00',
      pauseDuration: 30,
      isSplit: false,
      splitSlots: [],
    }
  }

  const updateCardState = (studentId: string, student: typeof students[0], updates: Partial<StudentCardState>) => {
    setCardStates(prev => ({
      ...prev,
      [studentId]: { ...getCardState(studentId, student), ...updates },
    }))
  }

  const toggleExpanded = (studentId: string, student: typeof students[0]) => {
    const state = getCardState(studentId, student)
    updateCardState(studentId, student, { expanded: !state.expanded })
  }

  const getAvailableDays = (student: typeof students[0]): string => {
    return JOURS_SEMAINE
      .filter(j => student[j] !== null)
      .map(j => DAYS_SHORT[JOURS_SEMAINE.indexOf(j)])
      .join(', ')
  }

  const handleAssign = (student: typeof students[0]) => {
    const state = getCardState(student.employee_id, student)
    
    const assignment: Assignment = {
      studentId: student.employee_id,
      studentName: student.employee_name,
      dayIndex: selectedDay,
      slots: state.isSplit && state.splitSlots.length > 0
        ? state.splitSlots.map(slot => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            ...(state.hasPause && { pauseStart: state.pauseStart, pauseDuration: state.pauseDuration }),
          }))
        : [{
            startTime: state.startTime,
            endTime: state.endTime,
            ...(state.hasPause && { pauseStart: state.pauseStart, pauseDuration: state.pauseDuration }),
          }]
    }

    onAssign?.(assignment)
    showToast(`✓ ${student.employee_name} assigné pour ${DAYS_SHORT[selectedDay]}`)
    
    // Replier la carte après assignation
    updateCardState(student.employee_id, student, { expanded: false })
  }

  const addSplitSlot = (studentId: string, student: typeof students[0]) => {
    const state = getCardState(studentId, student)
    updateCardState(studentId, student, {
      splitSlots: [...state.splitSlots, { startTime: '14:00', endTime: '18:00' }],
    })
  }

  const updateSplitSlot = (studentId: string, student: typeof students[0], index: number, field: 'startTime' | 'endTime', value: string) => {
    const state = getCardState(studentId, student)
    const newSlots = [...state.splitSlots]
    newSlots[index] = { ...newSlots[index], [field]: value }
    updateCardState(studentId, student, { splitSlots: newSlots })
  }

  const removeSplitSlot = (studentId: string, student: typeof students[0], index: number) => {
    const state = getCardState(studentId, student)
    const newSlots = state.splitSlots.filter((_, i) => i !== index)
    updateCardState(studentId, student, { splitSlots: newSlots })
  }

  return (
    <aside style={{
      width: '400px',
      background: '#f8fafc',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 20px',
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: TXT.primary, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎓 Étudiants disponibles
            </h2>
            <p style={{ fontSize: '13px', color: TXT.secondary, margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', background: '#dbeafe', borderRadius: '4px', fontSize: '11px' }}>📅</span>
              {weekDayNames[selectedDay] || `Jour ${selectedDay + 1}`}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                background: '#f1f5f9',
                cursor: 'pointer',
                color: TXT.secondary,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >✕</button>
          )}
        </div>
      </header>

      {/* Info box */}
      <div style={{
        padding: '12px 16px',
        background: '#eff6ff',
        borderBottom: '1px solid #bfdbfe',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '20px', lineHeight: 1 }}>💡</span>
        <div style={{ fontSize: '12px' }}>
          <strong style={{ color: '#1e40af' }}>Comment ça marche ?</strong>
          <p style={{ color: '#3b82f6', margin: '4px 0 0 0', lineHeight: 1.4 }}>
            Cliquez sur un étudiant pour voir ses disponibilités et lui assigner des heures.
          </p>
        </div>
      </div>

      {/* Recherche & Filtre */}
      <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <input
          type="text"
          placeholder="🔍 Rechercher un étudiant..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            color: TXT.primary,
            marginBottom: '8px',
          }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: TXT.secondary }}>
          <input
            type="checkbox"
            checked={filterAvailableOnly}
            onChange={e => setFilterAvailableOnly(e.target.checked)}
            style={{ width: '14px', height: '14px', accentColor: '#2563eb' }}
          />
          Afficher uniquement les disponibles ({DAYS_SHORT[selectedDay]})
        </label>
      </div>

      {/* Liste des étudiants */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: TXT.muted }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🔍</span>
              <p style={{ margin: 0, fontSize: '13px' }}>Aucun étudiant trouvé</p>
            </div>
          ) : (
            students.map(student => {
              const state = getCardState(student.employee_id, student)
              const isAvailable = student[dayKey] !== null
              const availability = student[dayKey]

              return (
                <article
                  key={student.employee_id}
                  style={{
                    background: 'white',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Card Header */}
                  <header
                    onClick={() => toggleExpanded(student.employee_id, student)}
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      background: state.expanded ? '#f9fafb' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: isAvailable ? '#8b5cf6' : '#9ca3af',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '14px',
                      flexShrink: 0,
                    }}>
                      {student.initiales}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: TXT.primary }}>
                        {student.employee_name}
                      </div>
                      <div style={{ fontSize: '12px', color: TXT.muted, marginTop: '2px' }}>
                        {getAvailableDays(student)}
                      </div>
                    </div>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: TXT.muted,
                      transition: 'transform 0.2s',
                      transform: state.expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>
                      ▼
                    </div>
                  </header>

                  {/* Card Body (expanded) */}
                  {state.expanded && (
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f1f5f9' }}>
                      {/* Grille disponibilités semaine */}
                      <div style={{ paddingTop: '14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: TXT.secondary, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          📅 Disponibilités cette semaine
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                          {JOURS_SEMAINE.map((jour, idx) => {
                            const dispo = student[jour]
                            const isToday = idx === selectedDay
                            const hasAvailability = dispo !== null
                            
                            return (
                              <div
                                key={jour}
                                style={{
                                  padding: '8px 4px',
                                  borderRadius: '6px',
                                  textAlign: 'center',
                                  border: isToday ? '2px solid #3b82f6' : '1px solid transparent',
                                  background: hasAvailability ? '#dcfce7' : '#f3f4f6',
                                }}
                              >
                                <div style={{
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: hasAvailability ? '#166534' : '#9ca3af',
                                }}>
                                  {DAYS_SHORT[idx]}
                                </div>
                                <div style={{
                                  fontSize: '10px',
                                  color: hasAvailability ? '#15803d' : '#d1d5db',
                                  marginTop: '4px',
                                }}>
                                  {dispo || '—'}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Section assignation */}
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: TXT.secondary, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          ⏰ Assigner des heures ({DAYS_SHORT[selectedDay]})
                        </div>

                        {!isAvailable ? (
                          /* Message indisponible */
                          <div style={{
                            padding: '14px',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '8px',
                            marginBottom: '12px',
                          }}>
                            <p style={{ fontSize: '13px', color: '#92400e', margin: 0, fontWeight: '500' }}>
                              ⚠️ {student.employee_name} n'est pas disponible ce jour
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Horaires */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                              <span style={{ fontSize: '12px', color: TXT.muted, width: '60px' }}>Horaire :</span>
                              <input
                                type="time"
                                value={state.startTime}
                                onChange={e => updateCardState(student.employee_id, student, { startTime: e.target.value })}
                                style={{
                                  flex: 1,
                                  padding: '8px 10px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  color: TXT.primary,
                                  height: '36px',
                                }}
                              />
                              <span style={{ color: '#9ca3af' }}>→</span>
                              <input
                                type="time"
                                value={state.endTime}
                                onChange={e => updateCardState(student.employee_id, student, { endTime: e.target.value })}
                                style={{
                                  flex: 1,
                                  padding: '8px 10px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  color: TXT.primary,
                                  height: '36px',
                                }}
                              />
                            </div>

                            {/* Pause */}
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                                <input
                                  type="checkbox"
                                  checked={state.hasPause}
                                  onChange={e => updateCardState(student.employee_id, student, { hasPause: e.target.checked })}
                                  style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }}
                                />
                                <span style={{ fontSize: '13px', color: TXT.primary }}>☕ Ajouter une pause</span>
                              </label>

                              {state.hasPause && (
                                <div style={{
                                  padding: '12px',
                                  background: '#fefce8',
                                  borderRadius: '8px',
                                  marginLeft: '24px',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '11px', color: TXT.muted, width: '50px' }}>Début :</span>
                                    <input
                                      type="time"
                                      value={state.pauseStart}
                                      onChange={e => updateCardState(student.employee_id, student, { pauseStart: e.target.value })}
                                      style={{
                                        padding: '6px 8px',
                                        border: '1px solid #fde68a',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        color: TXT.primary,
                                        height: '32px',
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <span style={{ fontSize: '11px', color: TXT.muted, display: 'block', marginBottom: '6px' }}>Durée :</span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      {PAUSE_DURATIONS.map(duration => (
                                        <button
                                          key={duration}
                                          onClick={() => updateCardState(student.employee_id, student, { pauseDuration: duration })}
                                          style={{
                                            flex: 1,
                                            padding: '6px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            background: state.pauseDuration === duration ? '#2563eb' : 'white',
                                            color: state.pauseDuration === duration ? 'white' : TXT.primary,
                                            boxShadow: state.pauseDuration === duration ? 'none' : '0 1px 2px rgba(0,0,0,0.1)',
                                          }}
                                        >
                                          {duration} min
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Heures fractionnées */}
                            <div style={{ marginBottom: '14px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                                <input
                                  type="checkbox"
                                  checked={state.isSplit}
                                  onChange={e => {
                                    const isSplit = e.target.checked
                                    updateCardState(student.employee_id, student, {
                                      isSplit,
                                      splitSlots: isSplit ? [
                                        { startTime: '08:00', endTime: '12:00' },
                                        { startTime: '14:00', endTime: '18:00' }
                                      ] : [],
                                    })
                                  }}
                                  style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                                />
                                <span style={{ fontSize: '13px', color: TXT.primary }}>Heures fractionnées</span>
                              </label>

                              {state.isSplit && (
                                <div style={{ marginLeft: '24px' }}>
                                  {state.splitSlots.map((slot, index) => (
                                    <div key={index} style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '8px',
                                      background: '#f9fafb',
                                      borderRadius: '6px',
                                      marginBottom: '6px',
                                    }}>
                                      <span style={{ fontSize: '11px', color: TXT.muted, width: '65px' }}>Créneau {index + 1}:</span>
                                      <input
                                        type="time"
                                        value={slot.startTime}
                                        onChange={e => updateSplitSlot(student.employee_id, student, index, 'startTime', e.target.value)}
                                        style={{
                                          flex: 1,
                                          padding: '4px 6px',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '4px',
                                          fontSize: '12px',
                                          color: TXT.primary,
                                          height: '30px',
                                        }}
                                      />
                                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>→</span>
                                      <input
                                        type="time"
                                        value={slot.endTime}
                                        onChange={e => updateSplitSlot(student.employee_id, student, index, 'endTime', e.target.value)}
                                        style={{
                                          flex: 1,
                                          padding: '4px 6px',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '4px',
                                          fontSize: '12px',
                                          color: TXT.primary,
                                          height: '30px',
                                        }}
                                      />
                                      {state.splitSlots.length > 1 && (
                                        <button
                                          onClick={() => removeSplitSlot(student.employee_id, student, index)}
                                          style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '4px',
                                            border: 'none',
                                            background: '#fee2e2',
                                            color: '#dc2626',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                          }}
                                        >×</button>
                                      )}
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => addSplitSlot(student.employee_id, student)}
                                    style={{
                                      width: '100%',
                                      padding: '8px',
                                      borderRadius: '6px',
                                      border: '1px dashed #d1d5db',
                                      background: 'transparent',
                                      color: TXT.secondary,
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: '500',
                                    }}
                                  >
                                    + Ajouter un créneau
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Bouton validation */}
                            <button
                              onClick={() => handleAssign(student)}
                              style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#10b981',
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                              onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
                            >
                              ✓ Valider et ajouter au planning
                            </button>
                          </>
                        )}

                        {/* Bouton disabled si indisponible */}
                        {!isAvailable && (
                          <button
                            disabled
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#e5e7eb',
                              color: '#9ca3af',
                              fontWeight: '600',
                              fontSize: '14px',
                              cursor: 'not-allowed',
                            }}
                          >
                            Indisponible ce jour
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </div>
      </div>

      {/* Footer Légende */}
      <footer style={{
        padding: '12px 16px',
        background: 'white',
        borderTop: '1px solid #e2e8f0',
      }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: TXT.secondary, marginBottom: '8px' }}>
          📊 Légende
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: TXT.muted }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8b5cf6' }} />
            <span>Étudiant disponible</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#9ca3af' }} />
            <span>Étudiant indisponible (jour sélectionné)</span>
          </div>
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          background: '#10b981',
          color: 'white',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '13px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 1000,
        }}>
          {toast}
        </div>
      )}
    </aside>
  )
}