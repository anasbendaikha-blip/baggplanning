'use client'

import { useState, useMemo } from 'react'
import {
  MOCK_EMPLOYEES,
  MOCK_DISPONIBILITES,
  MOCK_GARDES,
  SEMAINE_REFERENCE,
  JOURS_SEMAINE,
  getEmployeesByRole,
  getRoleColor,
  getRoleIcon,
  getRoleLabel,
  EmployeeRole,
  MockEmployee,
  JourSemaine,
} from '@/lib/mock-data'

// ============================================================
// 📁 app/titulaire/planning/page.tsx
// ============================================================
// Page Planning avec vue Gantt, gestion des pauses,
// modification libre des horaires par le titulaire
// ============================================================

// Types locaux pour le planning
interface PlanningSlot {
  employee_id: string
  start_time: string
  end_time: string
  pause_start?: string
  pause_duration?: number // en minutes
  is_conge?: boolean
  is_modified?: boolean
}

type ViewType = 'day' | 'recap' | 'guards'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8) // 8h à 21h

const ROLE_ORDER: EmployeeRole[] = ['Pharmacien', 'Preparateur', 'Apprenti', 'Etudiant', 'Conditionneur']

export default function PlanningPage() {
  const [selectedDay, setSelectedDay] = useState(0) // 0 = Lundi
  const [activeView, setActiveView] = useState<ViewType>('day')
  const [planningSlots, setPlanningSlots] = useState<Record<string, PlanningSlot[]>>(() => initializePlanning())
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedStudentForAssign, setSelectedStudentForAssign] = useState<string | null>(null)

  const currentDayKey = JOURS_SEMAINE[selectedDay]

  // Récupérer les slots du jour actuel
  const currentDaySlots = planningSlots[currentDayKey] || []

  // Grouper les employés par rôle
  const employeesByRole = useMemo(() => {
    const grouped: Record<EmployeeRole, MockEmployee[]> = {
      Pharmacien: [],
      Preparateur: [],
      Apprenti: [],
      Etudiant: [],
      Conditionneur: [],
    }
    
    MOCK_EMPLOYEES.forEach(emp => {
      if (emp.actif && grouped[emp.fonction]) {
        grouped[emp.fonction].push(emp)
      }
    })
    
    return grouped
  }, [])

  // Étudiants disponibles pour le jour sélectionné
  const availableStudents = useMemo(() => {
    return MOCK_DISPONIBILITES.filter(d => {
      const dispo = d[currentDayKey]
      return dispo !== null && d.has_submitted
    })
  }, [currentDayKey])

  // Obtenir le slot d'un employé pour le jour actuel
  const getEmployeeSlot = (employeeId: string): PlanningSlot | undefined => {
    return currentDaySlots.find(s => s.employee_id === employeeId)
  }

  // Modifier un slot
  const updateSlot = (employeeId: string, updates: Partial<PlanningSlot>) => {
    setPlanningSlots(prev => {
      const daySlots = [...(prev[currentDayKey] || [])]
      const existingIndex = daySlots.findIndex(s => s.employee_id === employeeId)
      
      if (existingIndex >= 0) {
        daySlots[existingIndex] = { ...daySlots[existingIndex], ...updates, is_modified: true }
      } else {
        daySlots.push({
          employee_id: employeeId,
          start_time: '08:30',
          end_time: '17:00',
          ...updates,
          is_modified: true,
        })
      }
      
      return { ...prev, [currentDayKey]: daySlots }
    })
  }

  // Supprimer un slot (marquer comme non travaillé)
  const removeSlot = (employeeId: string) => {
    setPlanningSlots(prev => {
      const daySlots = (prev[currentDayKey] || []).filter(s => s.employee_id !== employeeId)
      return { ...prev, [currentDayKey]: daySlots }
    })
  }

  // Assigner un étudiant
  const assignStudent = (studentId: string, startTime: string, endTime: string, pauseDuration?: number) => {
    updateSlot(studentId, {
      start_time: startTime,
      end_time: endTime,
      pause_duration: pauseDuration,
      pause_start: pauseDuration ? calculatePauseStart(startTime, endTime) : undefined,
    })
    setShowAssignModal(false)
    setSelectedStudentForAssign(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      {/* Onglets jours + Récap + Gardes */}
      <DayTabs
        selectedDay={selectedDay}
        onSelectDay={(day) => {
          setSelectedDay(day)
          setActiveView('day')
        }}
        activeView={activeView}
        onShowRecap={() => setActiveView('recap')}
        onShowGuards={() => setActiveView('guards')}
      />

      {/* Contenu principal */}
      {activeView === 'day' && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar étudiants */}
          <StudentSidebar
            availableStudents={availableStudents}
            currentDayKey={currentDayKey}
            assignedStudentIds={currentDaySlots.filter(s => 
              MOCK_EMPLOYEES.find(e => e.id === s.employee_id)?.fonction === 'Etudiant'
            ).map(s => s.employee_id)}
            onAssignClick={(studentId) => {
              setSelectedStudentForAssign(studentId)
              setShowAssignModal(true)
            }}
          />

          {/* Vue Gantt */}
          <GanttView
            employeesByRole={employeesByRole}
            currentDaySlots={currentDaySlots}
            selectedDay={selectedDay}
            onEditEmployee={setEditingEmployee}
            onUpdateSlot={updateSlot}
            onRemoveSlot={removeSlot}
          />
        </div>
      )}

      {activeView === 'recap' && (
        <WeekRecapView
          planningSlots={planningSlots}
          onBack={() => setActiveView('day')}
        />
      )}

      {activeView === 'guards' && (
        <GuardsView
          onBack={() => setActiveView('day')}
        />
      )}

      {/* Modal d'édition */}
      {editingEmployee && (
        <EditSlotModal
          employee={MOCK_EMPLOYEES.find(e => e.id === editingEmployee)!}
          slot={getEmployeeSlot(editingEmployee)}
          onSave={(updates) => {
            updateSlot(editingEmployee, updates)
            setEditingEmployee(null)
          }}
          onRemove={() => {
            removeSlot(editingEmployee)
            setEditingEmployee(null)
          }}
          onClose={() => setEditingEmployee(null)}
        />
      )}

      {/* Modal d'assignation étudiant */}
      {showAssignModal && selectedStudentForAssign && (
        <AssignStudentModal
          student={MOCK_DISPONIBILITES.find(d => d.employee_id === selectedStudentForAssign)!}
          currentDayKey={currentDayKey}
          onAssign={assignStudent}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedStudentForAssign(null)
          }}
        />
      )}
    </div>
  )
}

// ============================================================
// COMPOSANT: Onglets des jours
// ============================================================
function DayTabs({
  selectedDay,
  onSelectDay,
  activeView,
  onShowRecap,
  onShowGuards,
}: {
  selectedDay: number
  onSelectDay: (day: number) => void
  activeView: ViewType
  onShowRecap: () => void
  onShowGuards: () => void
}) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Jours de la semaine */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {SEMAINE_REFERENCE.jours.map((jour, index) => {
          const isActive = activeView === 'day' && selectedDay === index
          return (
            <button
              key={index}
              onClick={() => onSelectDay(index)}
              style={{
                padding: '12px 20px',
                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                color: isActive ? '#3b82f6' : '#64748b',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                border: 'none',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '14px' }}>{jour.split(' ')[0]}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{jour.split(' ')[1]}</div>
            </button>
          )
        })}
      </div>

      {/* Boutons Récap et Gardes */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onShowRecap}
          style={{
            padding: '10px 20px',
            backgroundColor: activeView === 'recap' ? '#3b82f6' : 'white',
            color: activeView === 'recap' ? 'white' : '#64748b',
            border: activeView === 'recap' ? 'none' : '1px solid #e2e8f0',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          📊 Récap Semaine
        </button>
        <button
          onClick={onShowGuards}
          style={{
            padding: '10px 20px',
            backgroundColor: activeView === 'guards' ? '#8b5cf6' : 'white',
            color: activeView === 'guards' ? 'white' : '#64748b',
            border: activeView === 'guards' ? 'none' : '1px solid #e2e8f0',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          🌙 Gardes
        </button>
      </div>
    </div>
  )
}

// ============================================================
// COMPOSANT: Sidebar étudiants
// ============================================================
function StudentSidebar({
  availableStudents,
  currentDayKey,
  assignedStudentIds,
  onAssignClick,
}: {
  availableStudents: typeof MOCK_DISPONIBILITES
  currentDayKey: JourSemaine
  assignedStudentIds: string[]
  onAssignClick: (studentId: string) => void
}) {
  return (
    <aside style={{
      width: '280px',
      backgroundColor: 'white',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
          🎓 Étudiants disponibles
        </h3>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
          {availableStudents.length} disponible(s) ce jour
        </p>
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {availableStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <span style={{ fontSize: '32px' }}>📭</span>
            <p style={{ marginTop: '12px' }}>Aucun étudiant disponible</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {availableStudents.map(student => {
              const isAssigned = assignedStudentIds.includes(student.employee_id)
              const dispo = student[currentDayKey]

              return (
                <div
                  key={student.employee_id}
                  style={{
                    padding: '12px',
                    backgroundColor: isAssigned ? '#dcfce7' : '#f8fafc',
                    border: isAssigned ? '1px solid #86efac' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: isAssigned ? '#10b981' : '#f59e0b',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '12px',
                    }}>
                      {student.initiales}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '500', color: '#1e293b', margin: 0, fontSize: '14px' }}>
                        {student.employee_name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                        {dispo}
                      </p>
                    </div>
                  </div>

                  {!isAssigned && (
                    <button
                      onClick={() => onAssignClick(student.employee_id)}
                      style={{
                        width: '100%',
                        marginTop: '10px',
                        padding: '8px',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      ➕ Assigner
                    </button>
                  )}

                  {isAssigned && (
                    <div style={{
                      marginTop: '10px',
                      padding: '6px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      borderRadius: '6px',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      ✓ Assigné
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}

// ============================================================
// COMPOSANT: Vue Gantt principale
// ============================================================
function GanttView({
  employeesByRole,
  currentDaySlots,
  selectedDay,
  onEditEmployee,
  onUpdateSlot,
  onRemoveSlot,
}: {
  employeesByRole: Record<EmployeeRole, MockEmployee[]>
  currentDaySlots: PlanningSlot[]
  selectedDay: number
  onEditEmployee: (id: string) => void
  onUpdateSlot: (id: string, updates: Partial<PlanningSlot>) => void
  onRemoveSlot: (id: string) => void
}) {
  const timeToPercent = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const totalHours = hours + minutes / 60
    return ((totalHours - 8) / 13) * 100 // 8h à 21h = 13h
  }

  const getSlotWidth = (start: string, end: string) => {
    return timeToPercent(end) - timeToPercent(start)
  }

  return (
    <main style={{ flex: 1, overflow: 'auto', backgroundColor: '#f8fafc' }}>
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            📅 {SEMAINE_REFERENCE.jours[selectedDay]} {SEMAINE_REFERENCE.mois}
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{
              padding: '10px 16px',
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}>
              📄 Exporter PDF
            </button>
            <button style={{
              padding: '10px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}>
              ✓ Enregistrer
            </button>
          </div>
        </div>

        {/* Tableau Gantt */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}>
          {/* En-tête des heures */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}>
            <div style={{
              width: '200px',
              padding: '12px 16px',
              fontWeight: '600',
              color: '#64748b',
              fontSize: '13px',
              borderRight: '1px solid #e2e8f0',
            }}>
              Employé
            </div>
            <div style={{ flex: 1, display: 'flex' }}>
              {HOURS.map(hour => (
                <div
                  key={hour}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#64748b',
                    borderRight: '1px solid #f1f5f9',
                    backgroundColor: hour === 13 ? '#fef3c7' : 'transparent',
                  }}
                >
                  {hour}h
                </div>
              ))}
            </div>
          </div>

          {/* Groupes par rôle */}
          {ROLE_ORDER.map(role => {
            const employees = employeesByRole[role]
            if (employees.length === 0) return null

            return (
              <div key={role}>
                {/* En-tête du groupe */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: '#f1f5f9',
                  borderBottom: '1px solid #e2e8f0',
                }}>
                  <span style={{ fontSize: '18px' }}>{getRoleIcon(role)}</span>
                  <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                    {getRoleLabel(role)}s
                  </span>
                  <span style={{
                    padding: '2px 10px',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                  }}>
                    {employees.length}
                  </span>
                </div>

                {/* Lignes des employés */}
                {employees.map(employee => {
                  const slot = currentDaySlots.find(s => s.employee_id === employee.id)
                  const isWorking = !!slot && !slot.is_conge
                  const isConge = slot?.is_conge
                  const color = getRoleColor(employee.fonction)

                  return (
                    <div
                      key={employee.id}
                      style={{
                        display: 'flex',
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isConge ? '#fef2f2' : 'white',
                        cursor: 'pointer',
                      }}
                      onClick={() => onEditEmployee(employee.id)}
                    >
                      {/* Info employé */}
                      <div style={{
                        width: '200px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        borderRight: '1px solid #e2e8f0',
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: isWorking ? color : isConge ? '#fca5a5' : '#e2e8f0',
                          color: isWorking || isConge ? 'white' : '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '13px',
                        }}>
                          {employee.initiales}
                        </div>
                        <div>
                          <p style={{
                            fontWeight: '500',
                            color: isConge ? '#dc2626' : '#1e293b',
                            margin: 0,
                            fontSize: '14px',
                          }}>
                            {employee.prenom}
                          </p>
                          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                            {isWorking && slot ? `${slot.start_time} - ${slot.end_time}` : isConge ? 'Congé' : 'Non planifié'}
                          </p>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div style={{
                        flex: 1,
                        position: 'relative',
                        height: '64px',
                      }}>
                        {/* Grille de fond */}
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                        }}>
                          {HOURS.map(hour => (
                            <div
                              key={hour}
                              style={{
                                flex: 1,
                                borderRight: '1px solid #f1f5f9',
                                backgroundColor: hour === 13 ? 'rgba(254, 243, 199, 0.3)' : 'transparent',
                              }}
                            />
                          ))}
                        </div>

                        {/* Barre de travail */}
                        {isWorking && slot && (
                          <div style={{ position: 'absolute', inset: 0, padding: '12px 4px' }}>
                            {/* Barre principale */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '12px',
                                height: '40px',
                                left: `${timeToPercent(slot.start_time)}%`,
                                width: `${getSlotWidth(slot.start_time, slot.end_time)}%`,
                                backgroundColor: color,
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '600',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              }}
                            >
                              {slot.start_time} - {slot.end_time}
                              {slot.pause_duration && ` (pause ${slot.pause_duration}min)`}
                            </div>

                            {/* Barre de pause */}
                            {slot.pause_start && slot.pause_duration && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '12px',
                                  height: '40px',
                                  left: `${timeToPercent(slot.pause_start)}%`,
                                  width: `${getSlotWidth(slot.pause_start, addMinutes(slot.pause_start, slot.pause_duration))}%`,
                                  backgroundColor: '#fb923c',
                                  borderRadius: '4px',
                                }}
                              />
                            )}
                          </div>
                        )}

                        {/* Indication congé */}
                        {isConge && (
                          <div style={{
                            position: 'absolute',
                            inset: '12px 4px',
                            backgroundColor: '#fee2e2',
                            border: '2px dashed #fca5a5',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#dc2626',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}>
                            🏖️ Congé
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Légende */}
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
        }}>
          {ROLE_ORDER.map(role => (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '16px',
                backgroundColor: getRoleColor(role),
                borderRadius: '4px',
              }} />
              <span style={{ fontSize: '13px', color: '#64748b' }}>{getRoleLabel(role)}s</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '16px',
              backgroundColor: '#fb923c',
              borderRadius: '4px',
            }} />
            <span style={{ fontSize: '13px', color: '#64748b' }}>Pause</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '16px',
              backgroundColor: '#fee2e2',
              border: '2px dashed #fca5a5',
              borderRadius: '4px',
            }} />
            <span style={{ fontSize: '13px', color: '#64748b' }}>Congé/Absence</span>
          </div>
        </div>
      </div>
    </main>
  )
}

// ============================================================
// COMPOSANT: Modal d'édition de slot
// ============================================================
function EditSlotModal({
  employee,
  slot,
  onSave,
  onRemove,
  onClose,
}: {
  employee: MockEmployee
  slot?: PlanningSlot
  onSave: (updates: Partial<PlanningSlot>) => void
  onRemove: () => void
  onClose: () => void
}) {
  const [startTime, setStartTime] = useState(slot?.start_time || '08:30')
  const [endTime, setEndTime] = useState(slot?.end_time || '17:00')
  const [pauseDuration, setPauseDuration] = useState(slot?.pause_duration || 0)
  const [isConge, setIsConge] = useState(slot?.is_conge || false)

  const handleSave = () => {
    if (isConge) {
      onSave({ is_conge: true })
    } else {
      onSave({
        start_time: startTime,
        end_time: endTime,
        pause_duration: pauseDuration > 0 ? pauseDuration : undefined,
        pause_start: pauseDuration > 0 ? calculatePauseStart(startTime, endTime) : undefined,
        is_conge: false,
      })
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          width: '400px',
          maxWidth: '90vw',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 20px 0' }}>
          ✏️ Modifier - {employee.prenom}
        </h3>

        {/* Option congé */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          backgroundColor: isConge ? '#fef2f2' : '#f8fafc',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '16px',
        }}>
          <input
            type="checkbox"
            checked={isConge}
            onChange={e => setIsConge(e.target.checked)}
            style={{ width: '18px', height: '18px' }}
          />
          <span style={{ fontWeight: '500', color: isConge ? '#dc2626' : '#64748b' }}>
            🏖️ Marquer comme congé/absence
          </span>
        </label>

        {!isConge && (
          <>
            {/* Heure début */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>
                Heure de début
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Heure fin */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>
                Heure de fin
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Pause */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>
                Durée de pause (minutes)
              </label>
              <select
                value={pauseDuration}
                onChange={e => setPauseDuration(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                <option value={0}>Pas de pause</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 heure</option>
              </select>
            </div>
          </>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onRemove}
            style={{
              padding: '10px 16px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            🗑️ Retirer
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            ✓ Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COMPOSANT: Modal d'assignation étudiant
// ============================================================
function AssignStudentModal({
  student,
  currentDayKey,
  onAssign,
  onClose,
}: {
  student: typeof MOCK_DISPONIBILITES[0]
  currentDayKey: JourSemaine
  onAssign: (studentId: string, startTime: string, endTime: string, pauseDuration?: number) => void
  onClose: () => void
}) {
  const dispo = student[currentDayKey]
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [pauseDuration, setPauseDuration] = useState(0)

  // Pré-remplir avec les horaires de disponibilité
  useState(() => {
    if (dispo) {
      const parts = dispo.split('-')
      if (parts.length === 2) {
        setStartTime(parts[0].replace('h', ':').padStart(5, '0'))
        setEndTime(parts[1].replace('h', ':').padStart(5, '0'))
      }
    }
  })

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          width: '400px',
          maxWidth: '90vw',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>
          🎓 Assigner {student.employee_name}
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
          Disponibilité: {dispo || 'Non précisée'}
        </p>

        {/* Heure début */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>
            Heure de début
          </label>
          <input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Heure fin */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>
            Heure de fin
          </label>
          <input
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Pause */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>
            Pause (optionnel)
          </label>
          <select
            value={pauseDuration}
            onChange={e => setPauseDuration(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            <option value={0}>Pas de pause</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 heure</option>
          </select>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => onAssign(student.employee_id, startTime, endTime, pauseDuration > 0 ? pauseDuration : undefined)}
            disabled={!startTime || !endTime}
            style={{
              padding: '10px 20px',
              backgroundColor: startTime && endTime ? '#f59e0b' : '#e2e8f0',
              color: startTime && endTime ? 'white' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              cursor: startTime && endTime ? 'pointer' : 'not-allowed',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            ➕ Assigner
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COMPOSANT: Vue Récap Semaine
// ============================================================
function WeekRecapView({
  planningSlots,
  onBack,
}: {
  planningSlots: Record<string, PlanningSlot[]>
  onBack: () => void
}) {
  // Calculer les heures par employé
  const employeeHours: Record<string, number> = {}
  
  Object.values(planningSlots).forEach(daySlots => {
    daySlots.forEach(slot => {
      if (!slot.is_conge) {
        const hours = calculateHours(slot.start_time, slot.end_time, slot.pause_duration)
        employeeHours[slot.employee_id] = (employeeHours[slot.employee_id] || 0) + hours
      }
    })
  })

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
          📊 Récapitulatif de la semaine
        </h2>
        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
          {SEMAINE_REFERENCE.jours[0]} au {SEMAINE_REFERENCE.jours[5]} {SEMAINE_REFERENCE.mois}
        </p>
      </div>

      {/* Tableau des heures */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        marginBottom: '24px',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          fontWeight: '600',
          color: '#1e293b',
        }}>
          ⏱️ Heures par employé
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ textAlign: 'left', padding: '12px 20px', color: '#64748b', fontWeight: '500' }}>Employé</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', color: '#64748b', fontWeight: '500' }}>Rôle</th>
              <th style={{ textAlign: 'right', padding: '12px 20px', color: '#64748b', fontWeight: '500' }}>Heures</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(employeeHours)
              .sort((a, b) => b[1] - a[1])
              .map(([empId, hours]) => {
                const emp = MOCK_EMPLOYEES.find(e => e.id === empId)
                if (!emp) return null
                return (
                  <tr key={empId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: getRoleColor(emp.fonction),
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '12px',
                        }}>
                          {emp.initiales}
                        </div>
                        <span style={{ fontWeight: '500', color: '#1e293b' }}>{emp.prenom}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{
                        padding: '4px 10px',
                        backgroundColor: getRoleColor(emp.fonction) + '20',
                        color: getRoleColor(emp.fonction),
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}>
                        {getRoleLabel(emp.fonction)}
                      </span>
                    </td>
                    <td style={{
                      padding: '12px 20px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: hours > 40 ? '#dc2626' : '#1e293b',
                    }}>
                      {hours.toFixed(1)}h
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      <button
        onClick={onBack}
        style={{
          padding: '10px 20px',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px',
        }}
      >
        ← Retour au planning
      </button>
    </div>
  )
}

// ============================================================
// COMPOSANT: Vue Gardes
// ============================================================
function GuardsView({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
          🌙 Gardes
        </h2>
        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
          {SEMAINE_REFERENCE.jours[0]} au {SEMAINE_REFERENCE.jours[5]} {SEMAINE_REFERENCE.mois}
        </p>
      </div>

      {/* Liste des gardes */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        marginBottom: '24px',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontWeight: '600', color: '#1e293b' }}>📅 Planning des gardes</span>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
          }}>
            + Ajouter une garde
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ textAlign: 'left', padding: '12px 20px', color: '#64748b', fontWeight: '500' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', color: '#64748b', fontWeight: '500' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', color: '#64748b', fontWeight: '500' }}>Pharmacien</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', color: '#64748b', fontWeight: '500' }}>Accompagnant</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', color: '#64748b', fontWeight: '500' }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_GARDES.map(garde => (
              <tr key={garde.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 20px', fontWeight: '500' }}>{garde.date}</td>
                <td style={{ padding: '12px 20px' }}>
                  <span style={{
                    padding: '4px 10px',
                    backgroundColor: garde.type === 'nuit' ? '#8b5cf620' : garde.type === 'soir' ? '#f59e0b20' : '#3b82f620',
                    color: garde.type === 'nuit' ? '#8b5cf6' : garde.type === 'soir' ? '#f59e0b' : '#3b82f6',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}>
                    {garde.type.charAt(0).toUpperCase() + garde.type.slice(1)}
                  </span>
                </td>
                <td style={{ padding: '12px 20px' }}>{garde.pharmacien_name || '—'}</td>
                <td style={{ padding: '12px 20px' }}>{garde.accompagnant_name || '—'}</td>
                <td style={{ padding: '12px 20px' }}>
                  <span style={{
                    padding: '4px 10px',
                    backgroundColor: garde.status === 'validee' ? '#dcfce7' : garde.status === 'assignee' ? '#fef3c7' : '#fee2e2',
                    color: garde.status === 'validee' ? '#16a34a' : garde.status === 'assignee' ? '#d97706' : '#dc2626',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}>
                    {garde.status === 'validee' ? 'Validée' : garde.status === 'assignee' ? 'Assignée' : 'À assigner'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={onBack}
        style={{
          padding: '10px 20px',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px',
        }}
      >
        ← Retour au planning
      </button>
    </div>
  )
}

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

function initializePlanning(): Record<string, PlanningSlot[]> {
  const planning: Record<string, PlanningSlot[]> = {}
  
  JOURS_SEMAINE.forEach(jour => {
    const slots: PlanningSlot[] = []
    
    MOCK_EMPLOYEES.forEach(emp => {
      const horaire = emp.horaires[jour]
      
      if (horaire === 'congé') {
        slots.push({
          employee_id: emp.id,
          start_time: '00:00',
          end_time: '00:00',
          is_conge: true,
        })
      } else if (horaire !== 'non' && horaire !== 'variable') {
        const parsed = parseHoraire(horaire)
        if (parsed) {
          slots.push({
            employee_id: emp.id,
            start_time: parsed.start,
            end_time: parsed.end,
          })
        }
      }
    })
    
    planning[jour] = slots
  })
  
  return planning
}

function parseHoraire(horaire: string): { start: string; end: string } | null {
  if (!horaire || horaire === 'non' || horaire === 'variable' || horaire === 'congé') return null
  
  const normalized = horaire.replace(/h/g, ':').replace(/:(\d)(?!\d)/g, ':0$1')
  const parts = normalized.split('-')
  if (parts.length !== 2) return null
  
  let start = parts[0].trim()
  let end = parts[1].trim()
  
  if (!start.includes(':')) start += ':00'
  if (!end.includes(':')) end += ':00'
  
  start = start.split(':').map((p, i) => p.padStart(2, '0')).join(':')
  end = end.split(':').map((p, i) => p.padStart(2, '0')).join(':')
  
  return { start, end }
}

function calculatePauseStart(startTime: string, endTime: string): string {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  const midMinutes = Math.floor((startMinutes + endMinutes) / 2)
  
  const h = Math.floor(midMinutes / 60)
  const m = midMinutes % 60
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = h * 60 + m + minutes
  const newH = Math.floor(totalMinutes / 60)
  const newM = totalMinutes % 60
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`
}

function calculateHours(startTime: string, endTime: string, pauseDuration?: number): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  const workedMinutes = endMinutes - startMinutes - (pauseDuration || 0)
  
  return workedMinutes / 60
}
