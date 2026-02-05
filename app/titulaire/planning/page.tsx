'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import StudentSidebar from '@/components/planning/StudentSidebar'
import { getWeekStart, addWeeks, formatWeekRange, getWeekDates, getWeekDayNames } from '@/lib/date-utils'
import { addLeave, updateLeave, getAllLeaves, isOnLeave, deleteLeave, Leave, addStudentAssignment } from '@/lib/demo-store'
import { MOCK_EMPLOYEES, MOCK_DISPONIBILITES, SEMAINE_REFERENCE, JOURS_SEMAINE, getRoleColor, getRoleIcon, getRoleLabel, EmployeeRole, MockEmployee, JourSemaine } from '@/lib/mock-data'
import {
  getAppliedPlanning,
  hasAppliedPlanning,
  updateAppliedDay,
  clearAppliedPlanning,
} from '@/lib/applied-planning-store'

// ============================================================
// Types
// ============================================================

interface PlanningSlot { id: string; employee_id: string; start_time: string; end_time: string; type: 'work' | 'pause' | 'conge'; congeMotif?: string }
interface StudentCardState { expanded: boolean; startTime: string; endTime: string; hasPause: boolean; pauseStart: string; pauseDuration: number }
type ModalType = 'none' | 'add-slot' | 'edit-slot' | 'add-pause' | 'delete-confirm' | 'add-conge' | 'delete-conge-confirm'
type FilterType = 'all' | 'Pharmacien' | 'Preparateur' | 'Etudiant' | 'Conditionneur'

// ============================================================
// 🎨 PALETTE — via ui-tokens (student ≠ break)
// ============================================================

import { T, ROLE_PALETTE, ACTIVITY_COLORS } from '@/lib/ui-tokens'

const COLORS = {
  work:    { bg: T.primary, text: '#fff', light: T.primaryLt, border: '#6ee7b7', label: '#065f46' },
  break:   { bg: ACTIVITY_COLORS.pause.bg, text: '#fff', light: ACTIVITY_COLORS.pause.light, border: ACTIVITY_COLORS.pause.border, label: ACTIVITY_COLORS.pause.dark },
  student: { bg: ROLE_PALETTE.Etudiant.bg, text: '#fff', light: ROLE_PALETTE.Etudiant.light, border: ROLE_PALETTE.Etudiant.border, label: ROLE_PALETTE.Etudiant.dark },
  leave:   { bg: ACTIVITY_COLORS.conge.bg, text: '#fff', light: ACTIVITY_COLORS.conge.light, border: ACTIVITY_COLORS.conge.border, label: ACTIVITY_COLORS.conge.dark },
  guard:   { bg: ACTIVITY_COLORS.garde.bg, text: '#fff', light: ACTIVITY_COLORS.garde.light, border: ACTIVITY_COLORS.garde.border, label: ACTIVITY_COLORS.garde.dark },
}

const SLOT_ROLE_COLORS: Record<EmployeeRole, string> = {
  Pharmacien:    ROLE_PALETTE.Pharmacien.bg,
  Preparateur:   ROLE_PALETTE.Preparateur.bg,
  Apprenti:      ROLE_PALETTE.Apprenti.bg,
  Etudiant:      ROLE_PALETTE.Etudiant.bg,
  Conditionneur: ROLE_PALETTE.Conditionneur.bg,
}

// ============================================================
// Config
// ============================================================

const REAL_START = 8       // 8h00 — début de la grille
const REAL_END = 22        // 22h00
const TOTAL_SPAN = REAL_END - REAL_START // 14 heures

// Zones spéciales
const MORNING_END = 8.5            // 8h30 — fin zone matinale verte
const NIGHT_SHIFT_START = 20.5     // 20h30 — début zone garde de nuit
const NIGHT_LABEL_POS = 21.5       // Position du label "Garde" (entre 21h et 22h)

// Grille : colonnes de 30 min (8h00, 8h30, 9h00, ..., 21h00, 21h30)
const GRID_MARKS: number[] = []
for (let t = REAL_START; t < REAL_END; t += 0.5) GRID_MARKS.push(t)
// GRID_MARKS = [8, 8.5, 9, 9.5, ..., 21, 21.5] — 28 demi-heures

// Labels d'heures à afficher sur la barre
const HOUR_LABELS: { value: number; label: string; isKey: boolean }[] = []
for (let t = REAL_START; t <= REAL_END; t += 0.5) {
  const h = Math.floor(t)
  const m = Math.round((t - h) * 60)
  const isFull = m === 0
  const isHalfKey = t === MORNING_END || t === NIGHT_SHIFT_START // 8h30 + 20h30 toujours affichés
  if (isFull || isHalfKey) {
    HOUR_LABELS.push({
      value: t,
      label: `${h}h${m === 0 ? '' : m}`,
      isKey: t === REAL_START || t === REAL_END || t === 14 || t === MORNING_END || t === NIGHT_SHIFT_START,
    })
  }
}

// Pourcentages des zones spéciales
const NIGHT_SHIFT_LEFT_PCT = ((NIGHT_SHIFT_START - REAL_START) / TOTAL_SPAN) * 100
const MORNING_WIDTH_PCT = ((MORNING_END - REAL_START) / TOTAL_SPAN) * 100
const NIGHT_LABEL_LEFT_PCT = ((NIGHT_LABEL_POS - REAL_START) / TOTAL_SPAN) * 100

// Helper : détecte si un créneau est une garde de nuit
const isNightShift = (endTime: string) => {
  const [h, m] = endTime.split(':').map(Number)
  return (h + m / 60) > NIGHT_SHIFT_START
}

// Compat : ancienne variable pour lunch highlight
const START_HOUR = REAL_START
const END_HOUR = REAL_END
const TOTAL_HOURS = TOTAL_SPAN

const ROLE_ORDER: EmployeeRole[] = ['Pharmacien', 'Preparateur', 'Apprenti', 'Etudiant', 'Conditionneur']
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const EMP_COL_W = 100
const TXT = { primary: T.text, secondary: T.textSec, muted: T.muted, link: T.info }

// ============================================================
// Helpers
// ============================================================

const formatHourLabel = (h: number) => {
  const hour = Math.floor(h)
  const mins = Math.round((h - hour) * 60)
  return `${hour}h${mins.toString().padStart(2, '0')}`
}
const isMorningCol = (h: number) => h >= REAL_START && h < MORNING_END
const isLunchCol = (h: number) => h >= 12 && h < 14
const isNightCol = (h: number) => h >= NIGHT_SHIFT_START

const toPct = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  const decimal = h + m / 60
  return ((decimal - REAL_START) / TOTAL_SPAN) * 100
}
const addMins = (t: string, mins: number) => {
  const [h, m] = t.split(':').map(Number)
  const tot = h * 60 + m + mins
  return `${Math.floor(tot / 60).toString().padStart(2, '0')}:${(tot % 60).toString().padStart(2, '0')}`
}
const normTime = (t: string) => t.replace('h', ':').replace(/:(\d)(?!\d)/g, ':0$1').padStart(5, '0')

// Build base planning from mock data (stable, no localStorage — used for SSR)
const initPlanningMock = (): Record<string, PlanningSlot[]> => {
  const p: Record<string, PlanningSlot[]> = {}
  JOURS_SEMAINE.forEach(j => {
    const s: PlanningSlot[] = []
    MOCK_EMPLOYEES.forEach(e => {
      const h = e.horaires[j]
      if (h && h !== 'non' && h !== 'variable' && h !== 'congé') {
        const n = h.replace(/h/g, ':').replace(/:(\d)(?!\d)/g, ':0$1').split('-')
        if (n.length === 2) s.push({ id: `${e.id}-${j}`, employee_id: e.id, start_time: n[0].trim().padStart(5, '0'), end_time: n[1].trim().padStart(5, '0'), type: 'work' })
      }
    })
    p[j] = s
  })
  return p
}

// Load applied planning from localStorage (client-only)
const loadAppliedPlanning = (): Record<string, PlanningSlot[]> | null => {
  const applied = getAppliedPlanning()
  if (applied) {
    const p: Record<string, PlanningSlot[]> = {}
    JOURS_SEMAINE.forEach(j => {
      p[j] = (applied.slots[j] || []).map(s => ({
        id: s.id,
        employee_id: s.employee_id,
        start_time: s.start_time,
        end_time: s.end_time,
        type: s.type as 'work' | 'pause' | 'conge'
      }))
    })
    return p
  }
  return null
}

// ============================================================
// Page
// ============================================================

export default function PlanningPage() {
  const [selectedDay, setSelectedDay] = useState(0)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const currentWeekDates = getWeekDates(weekStart)
  const currentWeekDayNames = getWeekDayNames(weekStart)
  const goToPrevWeek = () => setWeekStart(prev => addWeeks(prev, -1))
  const goToNextWeek = () => setWeekStart(prev => addWeeks(prev, 1))
  const goToToday = () => { setWeekStart(getWeekStart(new Date())); setSelectedDay(0) }
  const [slots, setSlots] = useState<Record<string, PlanningSlot[]>>(() => initPlanningMock())
  // Load applied planning from localStorage on client mount (avoids hydration mismatch)
  useEffect(() => {
    const applied = loadAppliedPlanning()
    if (applied) setSlots(applied)
  }, [])
  const [studentStates, setStudentStates] = useState<Record<string, StudentCardState>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [selectedEmp, setSelectedEmp] = useState<MockEmployee | null>(null)
  const [editPanelOpen, setEditPanelOpen] = useState(false)
  const [modalType, setModalType] = useState<ModalType>('none')
  const [editingSlot, setEditingSlot] = useState<PlanningSlot | null>(null)
  const [newSlot, setNewSlot] = useState({ startTime: '09:00', endTime: '17:00' })
  const [pauseData, setPauseData] = useState({ startTime: '12:00', duration: 30 })
  const [congeData, setCongeData] = useState({ dateDebut: currentWeekDates[selectedDay] || '', dateFin: currentWeekDates[selectedDay] || '', motif: '' })
  const [leaves, setLeaves] = useState<Leave[]>([])
  const refreshLeaves = () => setLeaves(getAllLeaves())
  useEffect(() => { refreshLeaves() }, [weekStart])
  const [editingCongeId, setEditingCongeId] = useState<string | null>(null)
  const [congeToDelete, setCongeToDelete] = useState<Leave | null>(null)
  // Collapsed roles — localStorage persistence
  const [collapsedRoles, setCollapsedRoles] = useState<Set<EmployeeRole>>(() => {
    if (typeof window === 'undefined') return new Set<EmployeeRole>()
    try {
      const saved = localStorage.getItem('planning_collapsed_roles')
      if (saved) return new Set(JSON.parse(saved) as EmployeeRole[])
    } catch { /* ignore */ }
    return new Set<EmployeeRole>()
  })
  const [filter, setFilter] = useState<FilterType>('all')
  // Sidebar — fermée par défaut, persistée dans localStorage
  const [showSidebar, setShowSidebar] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const saved = localStorage.getItem('planning_sidebar_open')
      if (saved !== null) return saved === 'true'
    } catch { /* ignore */ }
    return false
  })
  const [compactView, setCompactView] = useState(false)
  const [hideEmpty, setHideEmpty] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const saved = localStorage.getItem('planning_hide_empty')
      if (saved !== null) return saved === 'true'
    } catch { /* ignore */ }
    return false
  })

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('planning_sidebar_open', String(showSidebar))
  }, [showSidebar])

  // Persist collapsed roles state
  useEffect(() => {
    localStorage.setItem('planning_collapsed_roles', JSON.stringify([...collapsedRoles]))
  }, [collapsedRoles])

  // Persist hide-empty preference
  useEffect(() => {
    localStorage.setItem('planning_hide_empty', String(hideEmpty))
  }, [hideEmpty])

  // Indicateur de planning appliqué par l'assistant
  const [hasApplied, setHasApplied] = useState(false)
  useEffect(() => {
    setHasApplied(hasAppliedPlanning())
  }, [])

  // Synchro : quand on modifie un slot dans le Gantt, persister dans le planning appliqué
  const syncSlotChange = (dayKey: string, newSlots: PlanningSlot[]) => {
    if (hasApplied) {
      updateAppliedDay(dayKey, newSlots.map(s => ({
        id: s.id,
        employee_id: s.employee_id,
        start_time: s.start_time,
        end_time: s.end_time,
        type: s.type as 'work' | 'pause'
      })))
    }
  }

  const dayKey = JOURS_SEMAINE[selectedDay]
  const daySlots = slots[dayKey] || []
  const empByRole = useMemo(() => {
    const g: Record<EmployeeRole, MockEmployee[]> = { Pharmacien: [], Preparateur: [], Apprenti: [], Etudiant: [], Conditionneur: [] }
    MOCK_EMPLOYEES.forEach(e => e.actif && g[e.fonction]?.push(e))
    return g
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }
  const openEdit = (emp: MockEmployee) => { setSelectedEmp(emp); setEditPanelOpen(true) }
  const closeEdit = () => { setSelectedEmp(null); setEditPanelOpen(false); setModalType('none'); setEditingSlot(null) }
  const getEmpSlots = (id: string) => daySlots.filter(s => s.employee_id === id)
  const toggleRole = (r: EmployeeRole) => setCollapsedRoles(p => { const n = new Set(p); n.has(r) ? n.delete(r) : n.add(r); return n })
  const filteredRoles = filter === 'all' ? ROLE_ORDER : ROLE_ORDER.filter(r => filter === 'Etudiant' ? (r === 'Etudiant' || r === 'Apprenti') : r === filter)

  // Count hidden employees (for info banner)
  const hiddenCount = useMemo(() => {
    if (!hideEmpty) return 0
    let total = 0
    filteredRoles.forEach(role => {
      const emps = empByRole[role]
      emps.forEach(emp => {
        const empSlots = getEmpSlots(emp.id)
        const hasWork = empSlots.some(s => s.type === 'work')
        const onConge = isOnLeave(emp.id, currentWeekDates[selectedDay])
        if (!hasWork && !onConge) total++
      })
    })
    return total
  }, [hideEmpty, filteredRoles, daySlots, selectedDay, empByRole, currentWeekDates])

  // Alerts
  const dayAlerts = useMemo(() => {
    const alerts: string[] = []
    const pharmacists = empByRole.Pharmacien
    const hasPharmacist = pharmacists.some(p => {
      const pSlots = daySlots.filter(s => s.employee_id === p.id && s.type === 'work')
      return pSlots.length > 0 && !isOnLeave(p.id, currentWeekDates[selectedDay])
    })
    if (!hasPharmacist) alerts.push('Aucun pharmacien présent ce jour')

    const peakWorkers = daySlots.filter(s => {
      if (s.type !== 'work') return false
      const [sh] = s.start_time.split(':').map(Number)
      const [eh] = s.end_time.split(':').map(Number)
      return sh <= 16 && eh >= 18
    })
    if (peakWorkers.length < 3) alerts.push('Sous-effectif 16h-18h (' + peakWorkers.length + ' pers.)')
    return alerts
  }, [daySlots, selectedDay, empByRole])

  const isEmployeeOnConge = (empId: string, dateStr: string) => isOnLeave(empId, dateStr)

  const weekStartStr = currentWeekDates[0]
  const weekEndStr = currentWeekDates[5]
  const getEmpCongesForWeek = (empId: string) =>
    leaves.filter(l => l.employeeId === empId && l.startDate <= weekEndStr && l.endDate >= weekStartStr)

  // ============================================================
  // Handlers
  // ============================================================

  // FIX: Gère TOUS les créneaux (heures fractionnées)
  const handleSidebarAssign = (assignment: any) => {
    try {
      const dayIndex = typeof assignment?.dayIndex === 'number' ? assignment.dayIndex : selectedDay
      const date = currentWeekDates[dayIndex]
      const assignmentSlots = assignment?.slots
      if (!date || !assignmentSlots || assignmentSlots.length === 0) return

      const targetDayKey = JOURS_SEMAINE[dayIndex]
      const newPlanningSlots: PlanningSlot[] = []

      // Boucler sur TOUS les créneaux (fix heures fractionnées)
      assignmentSlots.forEach((slot: any, idx: number) => {
        if (!slot?.startTime || !slot?.endTime) return

        // Slot de travail
        newPlanningSlots.push({
          id: `slot-${Date.now()}-${idx}`,
          employee_id: assignment.studentId,
          start_time: slot.startTime,
          end_time: slot.endTime,
          type: 'work'
        })

        // Pause si demandée (uniquement sur le premier créneau pour éviter les doublons)
        if (idx === 0 && slot.pauseStart && slot.pauseDuration) {
          newPlanningSlots.push({
            id: `pause-${Date.now()}-${idx}`,
            employee_id: assignment.studentId,
            start_time: slot.pauseStart,
            end_time: addMins(slot.pauseStart, slot.pauseDuration),
            type: 'pause'
          })
        }
      })

      if (newPlanningSlots.length === 0) return

      // Sauvegarder aussi dans le demo-store si nécessaire
      const slot0 = assignmentSlots[0]
      addStudentAssignment({ studentId: assignment.studentId, date, startTime: slot0.startTime, endTime: slot0.endTime } as any)

      // Remplacer les anciens slots de cet étudiant pour ce jour
      setSlots(prev => {
        const updated = {
          ...prev,
          [targetDayKey]: [
            ...(prev[targetDayKey] || []).filter(s => s.employee_id !== assignment.studentId),
            ...newPlanningSlots
          ]
        }
        syncSlotChange(targetDayKey, updated[targetDayKey])
        return updated
      })

      const stu = MOCK_DISPONIBILITES.find(x => x.employee_id === assignment.studentId)
      const workCount = newPlanningSlots.filter(s => s.type === 'work').length
      showToast(`${stu?.employee_name || 'Étudiant'} ajouté (${workCount} créneau${workCount > 1 ? 'x' : ''})`)
    } catch { /* no-op */ }
  }

  const handleAddSlot = () => {
    if (!selectedEmp) return
    const newS: PlanningSlot = {
      id: `slot-${Date.now()}`,
      employee_id: selectedEmp.id,
      start_time: newSlot.startTime,
      end_time: newSlot.endTime,
      type: 'work'
    }
    setSlots(p => {
      const updated = { ...p, [dayKey]: [...(p[dayKey] || []), newS] }
      syncSlotChange(dayKey, updated[dayKey])
      return updated
    })
    setModalType('none')
    showToast('Créneau ajouté')
  }

  const handleEditSlot = () => {
    if (!editingSlot) return
    setSlots(p => {
      const updated = { ...p, [dayKey]: (p[dayKey] || []).map(s => s.id === editingSlot.id ? editingSlot : s) }
      syncSlotChange(dayKey, updated[dayKey])
      return updated
    })
    setModalType('none')
    setEditingSlot(null)
    showToast('Modifié')
  }

  const handleDeleteSlot = () => {
    if (!editingSlot) return
    setSlots(p => {
      const updated = { ...p, [dayKey]: (p[dayKey] || []).filter(s => s.id !== editingSlot.id) }
      syncSlotChange(dayKey, updated[dayKey])
      return updated
    })
    setModalType('none')
    setEditingSlot(null)
    showToast('Supprimé')
  }

  const handleAddPause = () => {
    if (!selectedEmp) return
    const newP: PlanningSlot = {
      id: `pause-${Date.now()}`,
      employee_id: selectedEmp.id,
      start_time: pauseData.startTime,
      end_time: addMins(pauseData.startTime, pauseData.duration),
      type: 'pause'
    }
    setSlots(p => {
      const updated = { ...p, [dayKey]: [...(p[dayKey] || []), newP] }
      syncSlotChange(dayKey, updated[dayKey])
      return updated
    })
    setModalType('none')
    showToast('Pause ajoutée')
  }

  const handleAddConge = () => {
    if (!selectedEmp || !congeData.dateDebut || !congeData.dateFin) return
    if (editingCongeId) {
      updateLeave(editingCongeId, { startDate: congeData.dateDebut, endDate: congeData.dateFin, motif: congeData.motif || undefined })
      refreshLeaves(); setModalType('none'); setEditingCongeId(null)
      setCongeData({ dateDebut: currentWeekDates[selectedDay] || '', dateFin: currentWeekDates[selectedDay] || '', motif: '' })
      showToast('Congé mis à jour'); return
    }
    addLeave({ employeeId: selectedEmp.id, startDate: congeData.dateDebut, endDate: congeData.dateFin, motif: congeData.motif || undefined })
    refreshLeaves(); setModalType('none')
    setCongeData({ dateDebut: currentWeekDates[selectedDay] || '', dateFin: currentWeekDates[selectedDay] || '', motif: '' })
    showToast('Congé enregistré')
  }

  const handleDeleteConge = () => {
    if (!congeToDelete) return
    deleteLeave(congeToDelete.id); refreshLeaves(); setModalType('none'); setCongeToDelete(null); setEditingCongeId(null); showToast('Congé supprimé')
  }

  const handleResetPlanning = () => {
    if (window.confirm('Revenir au planning par défaut ? Les modifications seront perdues.')) {
      clearAppliedPlanning()
      // Recharger les données mock
      const p: Record<string, PlanningSlot[]> = {}
      JOURS_SEMAINE.forEach(j => {
        const s: PlanningSlot[] = []
        MOCK_EMPLOYEES.forEach(e => {
          const h = e.horaires[j]
          if (h && h !== 'non' && h !== 'variable' && h !== 'congé') {
            const n = h.replace(/h/g, ':').replace(/:(\d)(?!\d)/g, ':0$1').split('-')
            if (n.length === 2) s.push({ id: `${e.id}-${j}`, employee_id: e.id, start_time: n[0].trim().padStart(5, '0'), end_time: n[1].trim().padStart(5, '0'), type: 'work' })
          }
        })
        p[j] = s
      })
      setSlots(p)
      setHasApplied(false)
      showToast('Planning réinitialisé')
    }
  }

  const getStudentState = (id: string): StudentCardState => {
    if (studentStates[id]) return studentStates[id]
    const d = MOCK_DISPONIBILITES.find(x => x.employee_id === id)?.[dayKey as keyof typeof MOCK_DISPONIBILITES[0]]
    let st = '08:00', et = '14:00'
    if (typeof d === 'string' && d) { const p = d.split('-'); if (p.length === 2) { st = normTime(p[0]); et = normTime(p[1]) } }
    return { expanded: false, startTime: st, endTime: et, hasPause: false, pauseStart: '12:00', pauseDuration: 30 }
  }
  const updStudentState = (id: string, u: Partial<StudentCardState>) => setStudentStates(p => ({ ...p, [id]: { ...getStudentState(id), ...u } }))
  const assignStudent = (id: string) => {
    const st = getStudentState(id), stu = MOCK_DISPONIBILITES.find(x => x.employee_id === id)
    if (!stu) return
    const ns: PlanningSlot[] = [{ id: `slot-${Date.now()}`, employee_id: id, start_time: st.startTime, end_time: st.endTime, type: 'work' }]
    if (st.hasPause) ns.push({ id: `pause-${Date.now() + 1}`, employee_id: id, start_time: st.pauseStart, end_time: addMins(st.pauseStart, st.pauseDuration), type: 'pause' })
    setSlots(p => {
      const updated = { ...p, [dayKey]: [...(p[dayKey] || []).filter(s => s.employee_id !== id), ...ns] }
      syncSlotChange(dayKey, updated[dayKey])
      return updated
    })
    showToast(`${stu.employee_name} ajouté`); updStudentState(id, { expanded: false })
  }

  // Stats
  const totalWorkSlots = daySlots.filter(s => s.type === 'work').length
  const uniqueWorkers = new Set(daySlots.filter(s => s.type === 'work').map(s => s.employee_id)).size

  // Get slot color for an employee
  const getSlotColor = (emp: MockEmployee, type: 'work' | 'pause' | 'conge') => {
    if (type === 'pause') return COLORS.break.bg
    if (type === 'conge') return COLORS.leave.bg
    if (emp.fonction === 'Etudiant') return COLORS.student.bg
    return SLOT_ROLE_COLORS[emp.fonction]
  }

  const rowH = compactView ? 30 : 38

  return (
    <div className="pl-page">
      {/* =================== HEADER =================== */}
      <header className="pl-header">
        <div className="pl-header-left">
          <div className="pl-header-nav">
            <button className="pl-nav-btn" onClick={goToPrevWeek}>&#x2190;</button>
            <span className="pl-week-label">{formatWeekRange(weekStart)}</span>
            <button className="pl-nav-btn" onClick={goToNextWeek}>&#x2192;</button>
            <button className="pl-nav-today" onClick={goToToday}>Aujourd&apos;hui</button>
          </div>
        </div>
        <div className="pl-header-right">
          {/* Badge planning assistant */}
          {hasApplied && (
            <div className="pl-applied-badge">
              <span className="pl-applied-dot" />
              Planning assistant
              <button
                className="pl-applied-reset"
                onClick={handleResetPlanning}
                title="Réinitialiser"
              >✕</button>
            </div>
          )}
          <select className="pl-filter-select" value={filter} onChange={e => setFilter(e.target.value as FilterType)}>
            <option value="all">Tous</option>
            <option value="Pharmacien">Pharmaciens</option>
            <option value="Preparateur">Préparateurs</option>
            <option value="Etudiant">Étudiants</option>
            <option value="Conditionneur">Conditionneurs</option>
          </select>
          <button className={`pl-toggle-btn ${hideEmpty ? 'active' : ''}`} onClick={() => setHideEmpty(v => !v)} title={hideEmpty ? 'Afficher tous les employés' : 'Masquer les lignes vides'}>
            {hideEmpty ? '👁️' : '👁️‍🗨️'} {hideEmpty ? 'Actifs' : 'Tous'}
          </button>
          <button className={`pl-sidebar-toggle ${showSidebar ? 'active' : ''}`} onClick={() => setShowSidebar(p => !p)}>
            🎓 Étudiants {showSidebar ? '◂' : '▸'}
          </button>
        </div>
      </header>

      {/* =================== DAY TABS =================== */}
      <nav className="pl-tabs">
        <div className="pl-tabs-days">
          {currentWeekDayNames.map((dayName, i) => {
            const active = selectedDay === i
            const [name, num] = dayName.split(' ')
            return (
              <button key={i} className={`pl-tab ${active ? 'active' : ''}`} onClick={() => setSelectedDay(i)}>
                <span className="pl-tab-name">{name}</span>
                <span className="pl-tab-num">{num}</span>
              </button>
            )
          })}
        </div>
        <div className="pl-tabs-links">
          <Link href="/titulaire/planning/recap" className="pl-tab-link">📊 Synthèse</Link>
          <Link href="/titulaire/planning/garde" className="pl-tab-link">🌙 Gardes</Link>
          <Link href={`/titulaire/planning/print?weekStart=${encodeURIComponent(currentWeekDates[0] || '')}`} className="pl-tab-link">🖨️ PDF</Link>
        </div>
      </nav>

      {/* =================== ALERTS =================== */}
      {dayAlerts.length > 0 && (
        <div className="pl-alerts">
          {dayAlerts.map((a, i) => (
            <div key={i} className="pl-alert-item">
              <span className="pl-alert-icon">⚠️</span>
              <span>{a}</span>
            </div>
          ))}
        </div>
      )}

      {/* =================== HIDDEN LINES BANNER =================== */}
      {hideEmpty && hiddenCount > 0 && (
        <div className="pl-hidden-banner">
          <span>ℹ️ {hiddenCount} employé{hiddenCount > 1 ? 's' : ''} sans créneau masqué{hiddenCount > 1 ? 's' : ''}</span>
          <button className="pl-hidden-show-all" onClick={() => setHideEmpty(false)}>Tout afficher</button>
        </div>
      )}

      {/* =================== MAIN =================== */}
      <div className="pl-body">
        {/* Sidebar */}
        {showSidebar && (
          <StudentSidebar
            selectedDay={selectedDay}
            weekDayNames={currentWeekDayNames}
            onAssign={handleSidebarAssign}
            onClose={() => setShowSidebar(false)}
          />
        )}

        {/* Gantt */}
        <main className="pl-gantt-wrap">
          <div className="pl-gantt-top">
            <div className="pl-gantt-title">
              <h2 className="pl-day-title">{currentWeekDayNames[selectedDay]} {weekStart.getFullYear()}</h2>
              <div className="pl-stats">
                <span className="pl-stat">{uniqueWorkers} présents</span>
                <span className="pl-stat">{totalWorkSlots} créneaux</span>
              </div>
            </div>
            <button className="pl-save-btn" onClick={() => showToast('Enregistré')}>💾 Sauver</button>
          </div>

          {/* Legend */}
          <div className="pl-legend">
            {ROLE_ORDER.map(r => (
              <div key={r} className="pl-legend-item">
                <span className="pl-legend-dot" style={{ background: SLOT_ROLE_COLORS[r] }} />
                <span>{getRoleLabel(r)}</span>
              </div>
            ))}
            <div className="pl-legend-item">
              <span className="pl-legend-dot" style={{ background: COLORS.break.bg }} />
              <span>Pause</span>
            </div>
            <div className="pl-legend-item">
              <span className="pl-legend-dot" style={{ background: COLORS.leave.bg, borderRadius: '2px' }} />
              <span>Congé</span>
            </div>
          </div>

          {/* Gantt grid */}
          <div className="pl-gantt">
            {/* Hour header */}
            <div className="pl-gantt-header">
              <div className="pl-gantt-emp-col">Employé</div>
              <div className="pl-gantt-hours">
                {/* Background cells for lunch/night highlight + grid borders */}
                {GRID_MARKS.map(t => (
                  <div key={`bg-${t}`} className={`pl-hour-cell ${isMorningCol(t) ? 'morning' : ''} ${isLunchCol(t) ? 'lunch' : ''} ${isNightCol(t) ? 'night' : ''}`} />
                ))}
                {/* Night shift zone label — centré entre 21h et 22h */}
                <span className="pl-night-label" style={{ left: `${NIGHT_LABEL_LEFT_PCT}%` }}>🌙 Garde</span>
                {/* Labels positioned absolutely to align with bar positions */}
                {HOUR_LABELS.map(l => {
                  const leftPct = ((l.value - REAL_START) / TOTAL_SPAN) * 100
                  return (
                    <span
                      key={`lbl-${l.value}`}
                      className={`pl-hour-label ${l.isKey ? 'key' : ''} ${l.value >= NIGHT_SHIFT_START ? 'night' : ''}`}
                      style={{ left: `${leftPct}%` }}
                    >
                      {l.label}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Rows by role */}
            {filteredRoles.map(role => {
              const emps = empByRole[role]
              if (emps.length === 0 && role !== 'Etudiant') return null
              // Filter out employees with no slots when hideEmpty is active
              const visibleEmps = hideEmpty
                ? emps.filter(emp => {
                    const empSlots = getEmpSlots(emp.id)
                    const hasWork = empSlots.some(s => s.type === 'work')
                    const onConge = isEmployeeOnConge(emp.id, currentWeekDates[selectedDay])
                    return hasWork || onConge
                  })
                : emps
              // Hide entire category if all employees are filtered out
              if (hideEmpty && visibleEmps.length === 0) return null
              const isCollapsed = collapsedRoles.has(role)
              return (
                <div key={role}>
                  <div className="pl-role-header" onClick={() => toggleRole(role)}>
                    <span className="pl-role-chevron">{isCollapsed ? '▶' : '▼'}</span>
                    <span className="pl-role-icon">{getRoleIcon(role)}</span>
                    <span className="pl-role-name">{getRoleLabel(role)}s</span>
                    <span className="pl-role-count">{hideEmpty ? `${visibleEmps.length}/${emps.length}` : emps.length}</span>
                  </div>
                  {!isCollapsed && visibleEmps.map(emp => {
                    const empSlots = getEmpSlots(emp.id)
                    const workSlots = empSlots.filter(s => s.type === 'work')
                    const pauseSlots = empSlots.filter(s => s.type === 'pause')
                    const isWorking = workSlots.length > 0
                    const onConge = isEmployeeOnConge(emp.id, currentWeekDates[selectedDay])
                    const color = getSlotColor(emp, 'work')

                    return (
                      <div key={emp.id} className="pl-emp-row" onClick={() => openEdit(emp)} style={{ height: `${rowH}px` }}>
                        <div className="pl-emp-cell">
                          <div className="pl-emp-avatar" style={{ background: isWorking ? color : '#cbd5e1' }}>{emp.initiales}</div>
                          <div className="pl-emp-info">
                            <span className="pl-emp-name">{emp.prenom}</span>
                            {!compactView && (
                              <span className="pl-emp-hours">
                                {isWorking
                                  ? workSlots.length > 1
                                    ? `${workSlots.length} créneaux`
                                    : `${workSlots[0].start_time}→${workSlots[0].end_time}`
                                  : onConge ? 'Congé' : '—'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="pl-emp-gantt">
                          {/* Grid lines */}
                          <div className="pl-grid-lines">
                            {GRID_MARKS.map(t => (
                              <div key={t} className={`pl-grid-col ${isMorningCol(t) ? 'morning' : ''} ${isLunchCol(t) ? 'lunch' : ''} ${isNightCol(t) ? 'night' : ''} ${t % 1 === 0 ? 'full-hour' : ''}`} />
                            ))}
                          </div>
                          {/* Night shift zone border */}
                          <div className="pl-night-zone" style={{ left: `${NIGHT_SHIFT_LEFT_PCT}%` }} />
                          {/* Morning zone (8h–8h30) */}
                          <div className="pl-morning-zone" style={{ left: '0%', width: `${MORNING_WIDTH_PCT}%` }} />
                          {/* Work slots */}
                          {workSlots.map(s => {
                            const left = toPct(s.start_time)
                            const width = Math.max(toPct(s.end_time) - left, 3)
                            const nightGuard = isNightShift(s.end_time)
                            return (
                              <div key={s.id} className={`pl-slot work ${nightGuard ? 'night-shift' : ''}`} style={{ left: `${left}%`, width: `${width}%`, background: color }}>
                                {width > 12 && <span className="pl-slot-label">{s.start_time}-{s.end_time}</span>}
                                {nightGuard && width > 8 && <span className="pl-slot-moon">🌙</span>}
                              </div>
                            )
                          })}
                          {/* Pause slots */}
                          {pauseSlots.map(s => {
                            const left = toPct(s.start_time)
                            const width = Math.max(toPct(s.end_time) - left, 2)
                            return (
                              <div key={s.id} className="pl-slot pause" style={{ left: `${left}%`, width: `${width}%` }}>
                                <span className="pl-slot-icon">☕</span>
                              </div>
                            )
                          })}
                          {/* Congé */}
                          {onConge && (
                            <div className="pl-slot conge">🏖️ Congé</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {!isCollapsed && emps.length === 0 && role === 'Etudiant' && (
                    <div className="pl-empty-row">👈 Assignez depuis la sidebar</div>
                  )}
                </div>
              )
            })}
          </div>
        </main>

        {/* =================== EDIT PANEL =================== */}
        {editPanelOpen && selectedEmp && (
          <aside className="pl-panel">
            <header className="pl-panel-header">
              <div className="pl-panel-emp">
                <div className="pl-panel-avatar" style={{ background: SLOT_ROLE_COLORS[selectedEmp.fonction] }}>{selectedEmp.initiales}</div>
                <div>
                  <h3 className="pl-panel-name">{selectedEmp.prenom} {selectedEmp.nom}</h3>
                  <span className="pl-panel-role" style={{ color: SLOT_ROLE_COLORS[selectedEmp.fonction] }}>{getRoleLabel(selectedEmp.fonction)}</span>
                </div>
              </div>
              <button className="pl-panel-close" onClick={closeEdit}>✕</button>
            </header>
            <div className="pl-panel-nav">
              <button className="pl-nav-btn sm" onClick={goToPrevWeek}>←</button>
              <span className="pl-panel-week">{formatWeekRange(weekStart)}</span>
              <button className="pl-nav-today sm" onClick={goToToday}>Auj.</button>
              <button className="pl-nav-btn sm" onClick={goToNextWeek}>→</button>
            </div>
            <div className="pl-panel-actions">
              <button className="pl-action-btn" onClick={() => setModalType('add-slot')}>
                <span>➕</span><span>Créneau</span>
              </button>
              <button className="pl-action-btn" onClick={() => setModalType('add-pause')}>
                <span>☕</span><span>Pause</span>
              </button>
              <button className="pl-action-btn leave" onClick={() => { setEditingCongeId(null); setCongeToDelete(null); setCongeData({ dateDebut: currentWeekDates[selectedDay], dateFin: currentWeekDates[selectedDay], motif: '' }); setModalType('add-conge') }}>
                <span>🏖️</span><span>Congé</span>
              </button>
            </div>

            {/* Congés */}
            <div className="pl-panel-section">
              <div className="pl-panel-section-header">
                <span className="pl-panel-section-title">Congés enregistrés</span>
                <span className="pl-panel-section-count">{getEmpCongesForWeek(selectedEmp.id).length}</span>
              </div>
              {getEmpCongesForWeek(selectedEmp.id).length === 0 ? (
                <div className="pl-panel-empty">Aucun congé cette semaine</div>
              ) : (
                <div className="pl-panel-list">
                  {getEmpCongesForWeek(selectedEmp.id).map(c => (
                    <div key={c.id} className="pl-panel-conge">
                      <div className="pl-panel-conge-info">
                        <p className="pl-panel-conge-dates">Du {c.startDate} au {c.endDate}</p>
                        {c.motif && <span className="pl-panel-conge-motif">{c.motif}</span>}
                      </div>
                      <div className="pl-panel-conge-actions">
                        <button className="pl-mini-btn" onClick={e => { e.stopPropagation(); setEditingCongeId(c.id); setCongeToDelete(null); setCongeData({ dateDebut: c.startDate, dateFin: c.endDate, motif: c.motif || '' }); setModalType('add-conge') }}>✏️</button>
                        <button className="pl-mini-btn danger" onClick={e => { e.stopPropagation(); setCongeToDelete(c); setModalType('delete-conge-confirm') }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Créneaux */}
            <div className="pl-panel-section" style={{ flex: 1, overflow: 'auto' }}>
              <span className="pl-panel-section-title">Créneaux {DAYS_SHORT[selectedDay]}</span>
              {getEmpSlots(selectedEmp.id).length === 0 ? (
                <div className="pl-panel-empty-big">
                  <span style={{ fontSize: '24px' }}>📭</span>
                  <p>Aucun créneau</p>
                </div>
              ) : (
                <div className="pl-panel-list">
                  {getEmpSlots(selectedEmp.id).filter(s => s.type === 'work').map(slot => (
                    <div key={slot.id} className="pl-panel-slot work" onClick={() => { setEditingSlot(slot); setModalType('edit-slot') }}>
                      <div className="pl-panel-slot-info">
                        <p className="pl-panel-slot-time">{slot.start_time} - {slot.end_time}</p>
                        <span className="pl-panel-slot-type" style={{ color: COLORS.work.label }}>Travail</span>
                      </div>
                      <div className="pl-panel-conge-actions">
                        <button className="pl-mini-btn" onClick={e => { e.stopPropagation(); setEditingSlot(slot); setModalType('edit-slot') }}>✏️</button>
                        <button className="pl-mini-btn danger" onClick={e => { e.stopPropagation(); setEditingSlot(slot); setModalType('delete-confirm') }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                  {getEmpSlots(selectedEmp.id).filter(s => s.type === 'pause').map(slot => (
                    <div key={slot.id} className="pl-panel-slot pause-slot">
                      <div className="pl-panel-slot-info">
                        <p className="pl-panel-slot-time">{slot.start_time} - {slot.end_time}</p>
                        <span className="pl-panel-slot-type" style={{ color: COLORS.break.label }}>☕ Pause</span>
                      </div>
                      <button className="pl-mini-btn danger" onClick={() => { setEditingSlot(slot); setModalType('delete-confirm') }}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* =================== MODALS =================== */}
      {modalType === 'add-slot' && (
        <div className="pl-overlay" onClick={() => setModalType('none')}>
          <div className="pl-modal" onClick={e => e.stopPropagation()}>
            <div className="pl-modal-header"><h3>Nouveau créneau</h3><button className="pl-modal-close" onClick={() => setModalType('none')}>✕</button></div>
            <div className="pl-modal-body">
              <div className="pl-modal-info">{SEMAINE_REFERENCE.jours[selectedDay]}</div>
              <div className="pl-modal-grid">
                <div className="pl-modal-field"><label>Début</label><input type="time" value={newSlot.startTime} onChange={e => setNewSlot(p => ({ ...p, startTime: e.target.value }))} className="pl-modal-input" /></div>
                <div className="pl-modal-field"><label>Fin</label><input type="time" value={newSlot.endTime} onChange={e => setNewSlot(p => ({ ...p, endTime: e.target.value }))} className="pl-modal-input" /></div>
              </div>
              <button className="pl-modal-btn primary" onClick={handleAddSlot}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'edit-slot' && editingSlot && (
        <div className="pl-overlay" onClick={() => { setModalType('none'); setEditingSlot(null) }}>
          <div className="pl-modal" onClick={e => e.stopPropagation()}>
            <div className="pl-modal-header"><h3>Modifier le créneau</h3><button className="pl-modal-close" onClick={() => { setModalType('none'); setEditingSlot(null) }}>✕</button></div>
            <div className="pl-modal-body">
              <div className="pl-modal-grid">
                <div className="pl-modal-field"><label>Début</label><input type="time" value={editingSlot.start_time} onChange={e => setEditingSlot(p => p ? { ...p, start_time: e.target.value } : p)} className="pl-modal-input" /></div>
                <div className="pl-modal-field"><label>Fin</label><input type="time" value={editingSlot.end_time} onChange={e => setEditingSlot(p => p ? { ...p, end_time: e.target.value } : p)} className="pl-modal-input" /></div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="pl-modal-btn danger" onClick={() => setModalType('delete-confirm')}>🗑️ Supprimer</button>
                <button className="pl-modal-btn primary" style={{ flex: 2 }} onClick={handleEditSlot}>Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalType === 'add-pause' && (
        <div className="pl-overlay" onClick={() => setModalType('none')}>
          <div className="pl-modal" onClick={e => e.stopPropagation()}>
            <div className="pl-modal-header"><h3>☕ Ajouter une pause</h3><button className="pl-modal-close" onClick={() => setModalType('none')}>✕</button></div>
            <div className="pl-modal-body">
              <div className="pl-modal-field"><label>Début</label><input type="time" value={pauseData.startTime} onChange={e => setPauseData(p => ({ ...p, startTime: e.target.value }))} className="pl-modal-input" /></div>
              <div className="pl-modal-field" style={{ marginTop: '10px' }}>
                <label>Durée</label>
                <div className="pl-duration-btns">
                  {[15, 30, 45, 60].map(d => (
                    <button key={d} className={`pl-duration-btn ${pauseData.duration === d ? 'active' : ''}`} onClick={() => setPauseData(p => ({ ...p, duration: d }))}>{d}m</button>
                  ))}
                </div>
              </div>
              <button className="pl-modal-btn break" onClick={handleAddPause}>☕ Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'delete-confirm' && (
        <div className="pl-overlay" onClick={() => setModalType('none')}>
          <div className="pl-modal sm" onClick={e => e.stopPropagation()}>
            <h3 className="pl-modal-del-title">Supprimer ce créneau ?</h3>
            <p className="pl-modal-del-sub">Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="pl-modal-btn secondary" onClick={() => setModalType('none')}>Annuler</button>
              <button className="pl-modal-btn danger" onClick={handleDeleteSlot}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'add-conge' && (
        <div className="pl-overlay" onClick={() => setModalType('none')}>
          <div className="pl-modal" onClick={e => e.stopPropagation()}>
            <div className="pl-modal-header"><h3>{editingCongeId ? 'Modifier le congé' : 'Déclarer un congé'}</h3><button className="pl-modal-close" onClick={() => { setModalType('none'); setEditingCongeId(null) }}>✕</button></div>
            <div className="pl-modal-body">
              <div className="pl-modal-field"><label>Du</label><input type="date" value={congeData.dateDebut} onChange={e => setCongeData(p => ({ ...p, dateDebut: e.target.value, dateFin: p.dateFin < e.target.value ? e.target.value : p.dateFin }))} className="pl-modal-input" /></div>
              <div className="pl-modal-field" style={{ marginTop: '8px' }}><label>Au</label><input type="date" value={congeData.dateFin} min={congeData.dateDebut} onChange={e => setCongeData(p => ({ ...p, dateFin: e.target.value }))} className="pl-modal-input" /></div>
              <div className="pl-modal-field" style={{ marginTop: '8px' }}><label>Motif</label><input value={congeData.motif} onChange={e => setCongeData(p => ({ ...p, motif: e.target.value }))} placeholder="Vacances, RDV..." className="pl-modal-input" /></div>
              <div className="pl-conge-days">
                {congeData.dateDebut === congeData.dateFin ? '1 jour' : `${Math.ceil((new Date(congeData.dateFin).getTime() - new Date(congeData.dateDebut).getTime()) / 86400000) + 1} jours`}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="pl-modal-btn secondary" onClick={() => { setModalType('none'); setEditingCongeId(null) }}>Annuler</button>
                {editingCongeId && <button className="pl-modal-btn danger" onClick={() => { const c = leaves.find(x => x.id === editingCongeId); if (c) { setCongeToDelete(c); setModalType('delete-conge-confirm') } }}>🗑️</button>}
                <button className="pl-modal-btn leave" style={{ flex: 2 }} onClick={handleAddConge}>{editingCongeId ? 'Enregistrer' : 'Valider'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalType === 'delete-conge-confirm' && congeToDelete && (
        <div className="pl-overlay" onClick={() => setModalType('none')}>
          <div className="pl-modal sm" onClick={e => e.stopPropagation()}>
            <h3 className="pl-modal-del-title">Supprimer ce congé ?</h3>
            <p className="pl-modal-del-sub">Du {congeToDelete.startDate} au {congeToDelete.endDate}</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="pl-modal-btn secondary" onClick={() => { setModalType('none'); setCongeToDelete(null) }}>Annuler</button>
              <button className="pl-modal-btn danger" onClick={handleDeleteConge}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="pl-toast">{toast}</div>}

      {/* =================== STYLES =================== */}
      <style jsx global>{`
        /* ====== Page ====== */
        .pl-page {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 80px);
          background: ${T.bg};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* ====== Header ====== */
        .pl-header {
          background: ${T.card};
          border-bottom: 1px solid ${T.border};
          padding: 8px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pl-header-left { display: flex; align-items: center; gap: 10px; }
        .pl-header-right { display: flex; align-items: center; gap: 6px; }
        .pl-header-nav { display: flex; align-items: center; gap: 6px; }
        .pl-week-label {
          font-weight: 700;
          font-size: 14px;
          color: ${TXT.primary};
          min-width: 150px;
          text-align: center;
        }
        .pl-nav-btn {
          padding: 5px 10px;
          background: ${T.borderLt};
          border: 1px solid ${T.border};
          border-radius: 6px;
          cursor: pointer;
          color: ${TXT.primary};
          font-weight: 600;
          font-size: 13px;
        }
        .pl-nav-btn:hover { background: ${T.border}; }
        .pl-nav-btn.sm { padding: 3px 7px; font-size: 11px; }
        .pl-nav-today {
          padding: 5px 10px;
          background: ${T.infoLt};
          border: none;
          border-radius: 6px;
          cursor: pointer;
          color: ${T.info};
          font-size: 12px;
          font-weight: 600;
        }
        .pl-nav-today.sm { padding: 3px 7px; font-size: 10px; }
        .pl-nav-today:hover { background: #bfdbfe; }
        .pl-filter-select {
          padding: 5px 8px;
          border: 1px solid ${T.border};
          border-radius: 6px;
          font-size: 12px;
          color: ${TXT.secondary};
          background: ${T.card};
          cursor: pointer;
          outline: none;
        }
        .pl-toggle-btn {
          padding: 5px 10px;
          background: ${T.borderLt};
          border: 1px solid ${T.border};
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: ${TXT.secondary};
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s;
        }
        .pl-toggle-btn.active { background: ${T.infoLt}; border-color: ${T.info}; color: ${T.infoDk}; }
        .pl-sidebar-toggle {
          padding: 5px 10px;
          background: ${T.borderLt};
          border: 1px solid ${T.border};
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: ${TXT.primary};
        }
        .pl-sidebar-toggle.active { background: ${ROLE_PALETTE.Etudiant.light}; border-color: ${ROLE_PALETTE.Etudiant.border}; }

        /* ====== Applied badge ====== */
        .pl-applied-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          background: ${T.primaryBg};
          border: 1px solid ${T.primaryLt};
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: ${T.primaryDk};
        }
        .pl-applied-dot {
          width: 6px;
          height: 6px;
          background: ${T.primary};
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        .pl-applied-reset {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 10px;
          color: ${TXT.secondary};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pl-applied-reset:hover {
          background: ${T.primaryLt};
          color: ${T.primaryDk};
        }

        /* ====== Tabs ====== */
        .pl-tabs {
          background: ${T.card};
          border-bottom: 1px solid ${T.border};
          display: flex;
          padding: 0 16px;
          justify-content: space-between;
        }
        .pl-tabs-days { display: flex; flex: 1; }
        .pl-tab {
          padding: 8px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: transparent;
          border: none;
          border-bottom: 2.5px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
        }
        .pl-tab.active { border-bottom-color: ${T.info}; background: ${T.infoBg}; }
        .pl-tab:hover { background: ${T.bg}; }
        .pl-tab-name { font-weight: 600; color: ${TXT.primary}; font-size: 13px; }
        .pl-tab.active .pl-tab-name { color: ${T.info}; }
        .pl-tab-num { font-size: 11px; color: ${TXT.muted}; }
        .pl-tab.active .pl-tab-num { color: ${T.info}; }
        .pl-tabs-links { display: flex; gap: 4px; align-self: center; }
        .pl-tab-link {
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 600;
          color: ${TXT.secondary};
          text-decoration: none;
          border-radius: 6px;
          transition: background 0.1s;
        }
        .pl-tab-link:hover { background: ${T.borderLt}; }

        /* ====== Alerts ====== */
        .pl-alerts {
          padding: 6px 16px;
          background: ${T.dangerBg};
          border-bottom: 1px solid ${T.dangerBd};
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .pl-alert-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: ${T.dangerDk};
        }
        .pl-alert-icon { font-size: 14px; }

        /* ====== Hidden lines banner ====== */
        .pl-hidden-banner {
          padding: 6px 16px;
          background: ${T.infoBg};
          border-bottom: 1px solid ${T.infoLt};
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          font-weight: 600;
          color: ${T.infoDk};
          flex-shrink: 0;
        }
        .pl-hidden-show-all {
          margin-left: auto;
          padding: 3px 10px;
          background: ${T.info};
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .pl-hidden-show-all:hover { background: ${T.infoDk}; }

        /* ====== Body ====== */
        .pl-body { display: flex; flex: 1; overflow: hidden; }

        /* ====== Gantt ====== */
        .pl-gantt-wrap { flex: 1; overflow: auto; background: ${T.card}; }
        .pl-gantt-top {
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .pl-gantt-title { display: flex; align-items: center; gap: 12px; }
        .pl-day-title { font-size: 14px; font-weight: 700; margin: 0; color: ${TXT.primary}; }
        .pl-stats { display: flex; gap: 10px; }
        .pl-stat {
          padding: 2px 8px;
          background: ${T.borderLt};
          border-radius: 6px;
          font-size: 11px;
          color: ${TXT.muted};
          font-weight: 500;
        }
        .pl-save-btn {
          padding: 6px 12px;
          background: ${COLORS.work.bg};
          color: #fff;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 12px;
        }
        .pl-save-btn:hover { opacity: 0.9; }

        /* ====== Legend ====== */
        .pl-legend {
          padding: 4px 12px 8px;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }
        .pl-legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: ${TXT.secondary};
          font-weight: 500;
        }
        .pl-legend-dot {
          width: 12px;
          height: 6px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        /* ====== Gantt Grid ====== */
        .pl-gantt {
          margin: 0 12px 12px;
          border: 1px solid ${T.border};
          border-radius: 8px;
          overflow: hidden;
        }
        .pl-gantt-header {
          display: flex;
          border-bottom: 1px solid ${T.border};
          background: ${T.bg};
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .pl-gantt-emp-col {
          width: ${EMP_COL_W}px;
          padding: 6px 8px;
          font-weight: 600;
          color: ${TXT.muted};
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-right: 1px solid ${T.border};
        }
        .pl-gantt-hours { flex: 1; display: flex; position: relative; }
        .pl-hour-cell {
          flex: 1;
          padding: 6px 0;
          font-size: 10px;
          border-right: 1px solid ${T.borderLt};
          line-height: 1;
        }
        .pl-hour-cell.morning { background: rgba(16,185,129,0.15); }
        .pl-hour-cell.lunch { background: rgba(254,243,199,0.35); }
        .pl-hour-cell.night { background: rgba(99,102,241,0.06); }
        .pl-hour-label {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 10px;
          color: ${TXT.muted};
          font-weight: 500;
          white-space: nowrap;
          pointer-events: none;
          z-index: 1;
        }
        .pl-hour-label.key { font-weight: 800; color: ${TXT.secondary}; }
        .pl-hour-label.night { color: #6366f1; }
        .pl-night-label {
          position: absolute;
          top: 1px;
          transform: translateX(4px);
          font-size: 8px;
          color: #6366f1;
          font-weight: 700;
          letter-spacing: 0.3px;
          pointer-events: none;
          z-index: 1;
          opacity: 0.7;
        }

        /* Role headers */
        .pl-role-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 8px;
          background: ${T.bg};
          border-bottom: 1px solid ${T.border};
          cursor: pointer;
          user-select: none;
        }
        .pl-role-header:hover { background: ${T.borderLt}; }
        .pl-role-chevron { font-size: 9px; color: ${TXT.muted}; width: 12px; }
        .pl-role-icon { font-size: 13px; }
        .pl-role-name { font-weight: 600; color: ${TXT.primary}; font-size: 12px; }
        .pl-role-count {
          padding: 1px 6px;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 8px;
          font-size: 10px;
          color: ${TXT.muted};
          font-weight: 600;
        }

        /* Employee rows */
        .pl-emp-row {
          display: flex;
          border-bottom: 1px solid ${T.borderLt};
          cursor: pointer;
          transition: background 0.1s;
        }
        .pl-emp-row:hover { background: #fafbfc; }
        .pl-emp-cell {
          width: ${EMP_COL_W}px;
          padding: 4px 6px;
          display: flex;
          align-items: center;
          gap: 6px;
          border-right: 1px solid ${T.borderLt};
        }
        .pl-emp-avatar {
          width: 24px;
          height: 24px;
          border-radius: 5px;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 9px;
          flex-shrink: 0;
        }
        .pl-emp-info { min-width: 0; flex: 1; }
        .pl-emp-name {
          font-weight: 700;
          color: ${TXT.primary};
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }
        .pl-emp-hours {
          font-size: 9px;
          color: ${TXT.muted};
          font-weight: 500;
          display: block;
        }

        /* Gantt bars */
        .pl-emp-gantt { flex: 1; position: relative; }
        .pl-grid-lines { position: absolute; inset: 0; display: flex; }
        .pl-grid-col { flex: 1; border-right: 1px solid #f5f5f5; }
        .pl-grid-col.full-hour { border-right: 1px solid ${T.borderLt}; }
        .pl-grid-col.morning { background: rgba(16,185,129,0.08); }
        .pl-grid-col.lunch { background: rgba(254,243,199,0.2); }
        .pl-grid-col.night { background: rgba(99,102,241,0.04); }

        /* Night shift zone border line */
        .pl-night-zone {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 0;
          border-left: 2px dashed rgba(99,102,241,0.25);
          z-index: 1;
          pointer-events: none;
        }

        /* Morning zone (8h–8h30) — bande verte */
        .pl-morning-zone {
          position: absolute;
          top: 0;
          bottom: 0;
          background: rgba(16,185,129,0.08);
          border-right: 2px solid rgba(16,185,129,0.35);
          z-index: 1;
          pointer-events: none;
        }

        .pl-slot {
          position: absolute;
          top: 4px;
          bottom: 4px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          z-index: 2;
          transition: opacity 0.1s;
        }
        .pl-slot:hover { opacity: 0.85; }
        .pl-slot.work {
          color: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .pl-slot.work.night-shift {
          border: 2px solid rgba(99,102,241,0.5);
          box-shadow: 0 1px 6px rgba(99,102,241,0.2);
        }
        .pl-slot-label { font-size: 9px; font-weight: 600; letter-spacing: -0.01em; }
        .pl-slot-moon { font-size: 10px; margin-left: 3px; }
        .pl-slot.pause {
          background: ${COLORS.break.bg};
          color: #fff;
          border: 1px dashed ${COLORS.break.border};
          z-index: 3;
        }
        .pl-slot-icon { font-size: 12px; }
        .pl-slot.conge {
          left: 0%;
          width: 100%;
          background: repeating-linear-gradient(45deg, ${COLORS.leave.light}, ${COLORS.leave.light} 5px, ${COLORS.leave.border} 5px, ${COLORS.leave.border} 10px);
          color: ${COLORS.leave.label};
          font-size: 11px;
          font-weight: 700;
          border: 1px solid ${COLORS.leave.border};
          z-index: 5;
        }

        .pl-empty-row {
          padding: 12px;
          text-align: center;
          color: ${TXT.muted};
          font-size: 11px;
        }

        /* ====== Edit Panel ====== */
        .pl-panel {
          width: 260px;
          background: ${T.card};
          border-left: 1px solid ${T.border};
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .pl-panel-header {
          padding: 10px 12px;
          border-bottom: 1px solid ${T.border};
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .pl-panel-emp { display: flex; align-items: center; gap: 8px; }
        .pl-panel-avatar {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 11px;
        }
        .pl-panel-name { font-size: 13px; font-weight: 700; margin: 0; color: ${TXT.primary}; }
        .pl-panel-role { font-size: 11px; font-weight: 500; }
        .pl-panel-close {
          width: 22px;
          height: 22px;
          border-radius: 4px;
          border: none;
          background: ${T.borderLt};
          cursor: pointer;
          font-size: 11px;
          color: ${TXT.primary};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pl-panel-close:hover { background: ${T.border}; }
        .pl-panel-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 12px;
          background: ${T.bg};
          border-bottom: 1px solid ${T.border};
          gap: 4px;
        }
        .pl-panel-week { font-size: 11px; font-weight: 600; color: ${TXT.primary}; }
        .pl-panel-actions {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 6px;
          padding: 10px 12px;
          border-bottom: 1px solid ${T.border};
        }
        .pl-action-btn {
          padding: 8px;
          border-radius: 6px;
          border: 1px solid ${T.border};
          background: ${T.card};
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          font-weight: 600;
          color: ${TXT.primary};
          transition: background 0.1s;
        }
        .pl-action-btn:hover { background: ${T.bg}; }
        .pl-action-btn.leave { border-color: ${COLORS.leave.border}; background: ${COLORS.leave.light}; color: ${COLORS.leave.label}; }

        .pl-panel-section { padding: 10px 12px; border-bottom: 1px solid ${T.border}; }
        .pl-panel-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .pl-panel-section-title { font-size: 10px; font-weight: 600; color: ${TXT.muted}; text-transform: uppercase; letter-spacing: 0.04em; }
        .pl-panel-section-count { font-size: 10px; color: ${TXT.muted}; }
        .pl-panel-empty { padding: 10px; border-radius: 6px; border: 1px dashed #e2e8f0; background: #fafafa; text-align: center; color: ${TXT.muted}; font-size: 11px; }
        .pl-panel-empty-big { padding: 20px; text-align: center; color: ${TXT.muted}; font-size: 11px; }
        .pl-panel-empty-big p { margin: 6px 0 0; }
        .pl-panel-list { display: flex; flex-direction: column; gap: 4px; }

        .pl-panel-conge {
          padding: 8px;
          border-radius: 6px;
          background: ${COLORS.leave.light};
          border: 1px solid ${COLORS.leave.border};
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
        }
        .pl-panel-conge-info { min-width: 0; }
        .pl-panel-conge-dates { font-weight: 600; color: ${TXT.primary}; margin: 0; font-size: 11px; }
        .pl-panel-conge-motif { font-size: 10px; color: ${COLORS.leave.label}; }
        .pl-panel-conge-actions { display: flex; gap: 3px; flex-shrink: 0; }

        .pl-panel-slot {
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
        }
        .pl-panel-slot.work { background: ${COLORS.work.light}; border: 1px solid ${COLORS.work.border}; }
        .pl-panel-slot.pause-slot { background: ${COLORS.break.light}; border: 1px solid ${COLORS.break.border}; }
        .pl-panel-slot-info { min-width: 0; }
        .pl-panel-slot-time { font-weight: 600; color: ${TXT.primary}; margin: 0; font-size: 11px; }
        .pl-panel-slot-type { font-size: 10px; font-weight: 500; }

        .pl-mini-btn {
          padding: 3px 6px;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 4px;
          cursor: pointer;
          font-size: 10px;
        }
        .pl-mini-btn:hover { background: ${T.bg}; }
        .pl-mini-btn.danger { background: ${T.dangerLt}; border-color: ${T.dangerBd}; }
        .pl-mini-btn.danger:hover { background: #fecaca; }

        /* ====== Modals ====== */
        .pl-overlay {
          position: fixed;
          inset: 0;
          background: ${T.overlayLt};
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .pl-modal {
          background: ${T.card};
          border-radius: 12px;
          box-shadow: ${T.shadowXl};
          width: 100%;
          max-width: 320px;
          overflow: hidden;
        }
        .pl-modal.sm { max-width: 280px; padding: 16px; }
        .pl-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          border-bottom: 1px solid ${T.border};
        }
        .pl-modal-header h3 { font-size: 15px; font-weight: 700; margin: 0; color: ${TXT.primary}; }
        .pl-modal-close {
          width: 24px;
          height: 24px;
          border-radius: 5px;
          border: none;
          background: ${T.borderLt};
          cursor: pointer;
          font-size: 12px;
          color: ${TXT.primary};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pl-modal-close:hover { background: ${T.border}; }
        .pl-modal-body { padding: 16px; }
        .pl-modal-info {
          padding: 8px;
          background: ${T.bg};
          border-radius: 6px;
          font-size: 12px;
          color: ${TXT.primary};
          font-weight: 500;
          margin-bottom: 12px;
        }
        .pl-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
        .pl-modal-field label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: ${TXT.secondary};
          margin-bottom: 4px;
        }
        .pl-modal-input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid ${T.border};
          border-radius: 6px;
          font-size: 13px;
          color: ${TXT.primary};
          background: ${T.card};
          outline: none;
          box-sizing: border-box;
        }
        .pl-modal-input:focus { border-color: #94a3b8; }

        .pl-duration-btns { display: flex; gap: 6px; margin-top: 6px; }
        .pl-duration-btn {
          flex: 1;
          padding: 8px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          background: ${T.borderLt};
          color: ${TXT.primary};
          transition: all 0.1s;
        }
        .pl-duration-btn.active { background: ${COLORS.break.bg}; color: #fff; }

        .pl-conge-days {
          padding: 8px;
          background: ${COLORS.leave.light};
          border-radius: 6px;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          color: ${COLORS.leave.label};
          margin: 10px 0 12px;
        }

        .pl-modal-btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          transition: opacity 0.1s;
          width: 100%;
        }
        .pl-modal-btn:hover { opacity: 0.9; }
        .pl-modal-btn.primary { background: ${COLORS.work.bg}; color: #fff; }
        .pl-modal-btn.secondary { background: ${T.borderLt}; color: ${TXT.primary}; }
        .pl-modal-btn.danger { background: ${T.danger}; color: #fff; }
        .pl-modal-btn.break { background: ${COLORS.break.bg}; color: #fff; margin-top: 12px; }
        .pl-modal-btn.leave { background: ${COLORS.leave.bg}; color: #fff; }

        .pl-modal-del-title { font-size: 15px; font-weight: 700; margin: 0 0 4px; color: ${TXT.primary}; }
        .pl-modal-del-sub { font-size: 12px; color: ${TXT.muted}; margin: 0 0 14px; }

        /* ====== Toast ====== */
        .pl-toast {
          position: fixed;
          bottom: 16px;
          right: 16px;
          padding: 10px 18px;
          background: ${COLORS.work.bg};
          color: #fff;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          box-shadow: ${T.shadowLg};
          z-index: 1100;
          animation: pl-toast-in 0.25s ease-out;
        }
        @keyframes pl-toast-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* ====== Responsive ====== */
        @media (max-width: 768px) {
          .pl-header { padding: 6px 10px; }
          .pl-week-label { font-size: 12px; min-width: auto; }
          .pl-sidebar-toggle { display: none; }
          .pl-tabs-links { display: none; }
          .pl-tab { padding: 6px 8px; }
          .pl-tab-name { font-size: 11px; }
          .pl-gantt { margin: 0 6px 6px; }
          .pl-panel { width: 100%; position: fixed; inset: 0; z-index: 50; }
          .pl-stat { display: none; }
          .pl-applied-badge { font-size: 10px; padding: 3px 6px; }
        }
      `}</style>
    </div>
  )
}