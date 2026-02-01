'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import StudentSidebar from '@/components/planning/StudentSidebar'
import { getWeekStart, addWeeks, formatWeekRange, getWeekDates, getWeekDayNames } from '@/lib/date-utils'
import { addLeave, updateLeave, getAllLeaves, isOnLeave, deleteLeave, Leave, addStudentAssignment } from '@/lib/demo-store'
import { MOCK_EMPLOYEES, MOCK_DISPONIBILITES, SEMAINE_REFERENCE, JOURS_SEMAINE, getRoleColor, getRoleIcon, getRoleLabel, EmployeeRole, MockEmployee, JourSemaine } from '@/lib/mock-data'


interface PlanningSlot { id: string; employee_id: string; start_time: string; end_time: string; type: 'work' | 'pause' | 'conge'; congeMotif?: string }
interface StudentCardState { expanded: boolean; startTime: string; endTime: string; hasPause: boolean; pauseStart: string; pauseDuration: number }
type ModalType = 'none' | 'add-slot' | 'edit-slot' | 'add-pause' | 'delete-confirm' | 'add-conge' | 'delete-conge-confirm'
type FilterType = 'all' | 'Pharmacien' | 'Preparateur' | 'Etudiant'

// Plage d'ouverture affichée (planning)
const START_HOUR = 8 // 08:30
const END_HOUR = 21 // 21:00
const SLOT_STEP_HOURS = 1 // 30 minutes
const TOTAL_HOURS = END_HOUR - START_HOUR
const TOTAL_SLOTS = Math.round(TOTAL_HOURS / SLOT_STEP_HOURS) // 24 slots (30 min)

// 08:30 → 20:30 (24 colonnes de 30 min)
const HOURS = Array.from({ length: TOTAL_SLOTS + 1}, (_, i) => START_HOUR + i * SLOT_STEP_HOURS)

const formatHourLabel = (h: number) => {
  const hour = Math.floor(h)
  const mins = Math.round((h - hour) * 60)
  return `${hour}h${mins.toString().padStart(2, '0')}`
}

// Surbrillance déjeuner 12h30–13h30 (2 slots de 30 min)
const isLunchCol = (h: number) => h >= 12.5 && h < 13.5

// Marqueurs importants (changement d'équipe, début/fin)
const REAL_START = 8.5   // 08:30
const REAL_END = 20.5    // 20:30

function isKeyTime(h: number) {
  return h === REAL_START || h === 14 || h === REAL_END
}
const ROLE_ORDER: EmployeeRole[] = ['Pharmacien', 'Preparateur', 'Apprenti', 'Etudiant', 'Conditionneur']
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const ROLE_COLORS: Record<EmployeeRole, string> = { Pharmacien: '#a855f7', Preparateur: '#3b82f6', Apprenti: '#10b981', Etudiant: '#030f5cff', Conditionneur: '#6366f1' }
const EMP_COL_W = 90
const TXT = { primary: '#111827', secondary: '#374151', muted: '#6b7280', link: '#2563eb' }

const toPct = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return ((h + m / 60 - START_HOUR) / TOTAL_HOURS) * 100
}
const addMins = (t: string, mins: number) => { const [h, m] = t.split(':').map(Number); const tot = h * 60 + m + mins; return `${Math.floor(tot / 60).toString().padStart(2, '0')}:${(tot % 60).toString().padStart(2, '0')}` }
const normTime = (t: string) => t.replace('h', ':').replace(/:(\d)(?!\d)/g, ':0$1').padStart(5, '0')
const initPlanning = (): Record<string, PlanningSlot[]> => {
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

export default function PlanningPage() {
  const [selectedDay, setSelectedDay] = useState(0)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const currentWeekDates = getWeekDates(weekStart)
  const currentWeekDayNames = getWeekDayNames(weekStart)
  const goToPrevWeek = () => setWeekStart(prev => addWeeks(prev, -1))
  const goToNextWeek = () => setWeekStart(prev => addWeeks(prev, 1))
  const goToToday = () => { setWeekStart(getWeekStart(new Date())); setSelectedDay(0) }
  const [activeView, setActiveView] = useState<'day'>('day')
  const [slots, setSlots] = useState<Record<string, PlanningSlot[]>>(() => initPlanning())
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
  const [collapsedRoles, setCollapsedRoles] = useState<Set<EmployeeRole>>(new Set(['Conditionneur']))
  const [filter, setFilter] = useState<FilterType>('all')
  const [showSidebar, setShowSidebar] = useState(true)

  const dayKey = JOURS_SEMAINE[selectedDay]
  const daySlots = slots[dayKey] || []
  const empByRole = useMemo(() => {
    const g: Record<EmployeeRole, MockEmployee[]> = { Pharmacien: [], Preparateur: [], Apprenti: [], Etudiant: [], Conditionneur: [] }
    MOCK_EMPLOYEES.forEach(e => e.actif && g[e.fonction]?.push(e))
    return g
  }, [])
  const students = useMemo(() => MOCK_DISPONIBILITES.filter(d => MOCK_EMPLOYEES.find(e => e.id === d.employee_id)?.fonction === 'Etudiant' && d.has_submitted), [])
  const assignedIds = daySlots.filter(s => MOCK_EMPLOYEES.find(e => e.id === s.employee_id)?.fonction === 'Etudiant').map(s => s.employee_id)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }
  const openEdit = (emp: MockEmployee) => { setSelectedEmp(emp); setEditPanelOpen(true) }
  const closeEdit = () => { setSelectedEmp(null); setEditPanelOpen(false); setModalType('none'); setEditingSlot(null) }
  const getEmpSlots = (id: string) => daySlots.filter(s => s.employee_id === id)
  const toggleRole = (r: EmployeeRole) => setCollapsedRoles(p => { const n = new Set(p); n.has(r) ? n.delete(r) : n.add(r); return n })
  const filteredRoles = filter === 'all' ? ROLE_ORDER : ROLE_ORDER.filter(r => filter === 'Etudiant' ? (r === 'Etudiant' || r === 'Apprenti') : r === filter)

  const handleSidebarAssign = (assignment: any) => {
    try {
      const dayIndex = typeof assignment?.dayIndex === 'number' ? assignment.dayIndex : selectedDay
      const date = currentWeekDates[dayIndex]
      const slot0 = assignment?.slots?.[0]
      if (!date || !slot0?.startTime || !slot0?.endTime) return

      // Persist in shared store (if available)
      addStudentAssignment({
        studentId: assignment.studentId,
        date,
        ...slot0,
      } as any)

      // Reflect immediately in local planning grid
      const targetDayKey = JOURS_SEMAINE[dayIndex]
      const ns: PlanningSlot[] = [
        {
          id: `slot-${Date.now()}`,
          employee_id: assignment.studentId,
          start_time: slot0.startTime,
          end_time: slot0.endTime,
          type: 'work',
        },
      ]

      if (slot0.hasPause && slot0.pauseStart && slot0.pauseDuration) {
        ns.push({
          id: `pause-${Date.now() + 1}`,
          employee_id: assignment.studentId,
          start_time: slot0.pauseStart,
          end_time: addMins(slot0.pauseStart, slot0.pauseDuration),
          type: 'pause',
        })
      }

      setSlots(prev => ({
        ...prev,
        [targetDayKey]: [...(prev[targetDayKey] || []).filter(s => s.employee_id !== assignment.studentId), ...ns],
      }))

      const stu = MOCK_DISPONIBILITES.find(x => x.employee_id === assignment.studentId)
      showToast(`✓ ${stu?.employee_name || 'Étudiant'} ajouté`)
    } catch {
      // no-op
    }
  }

  const handleAddSlot = () => { if (!selectedEmp) return; setSlots(p => ({ ...p, [dayKey]: [...(p[dayKey] || []), { id: `slot-${Date.now()}`, employee_id: selectedEmp.id, start_time: newSlot.startTime, end_time: newSlot.endTime, type: 'work' }] })); setModalType('none'); showToast('✓ Créneau ajouté') }
  const handleEditSlot = () => { if (!editingSlot) return; setSlots(p => ({ ...p, [dayKey]: (p[dayKey] || []).map(s => s.id === editingSlot.id ? editingSlot : s) })); setModalType('none'); setEditingSlot(null); showToast('✓ Modifié') }
  const handleDeleteSlot = () => { if (!editingSlot) return; setSlots(p => ({ ...p, [dayKey]: (p[dayKey] || []).filter(s => s.id !== editingSlot.id) })); setModalType('none'); setEditingSlot(null); showToast('✓ Supprimé') }
  const handleAddPause = () => { if (!selectedEmp) return; setSlots(p => ({ ...p, [dayKey]: [...(p[dayKey] || []), { id: `pause-${Date.now()}`, employee_id: selectedEmp.id, start_time: pauseData.startTime, end_time: addMins(pauseData.startTime, pauseData.duration), type: 'pause' }] })); setModalType('none'); showToast('✓ Pause ajoutée') }
  const handleAddConge = () => {
    if (!selectedEmp || !congeData.dateDebut || !congeData.dateFin) return

    // EDIT
    if (editingCongeId) {
      updateLeave(editingCongeId, {
        startDate: congeData.dateDebut,
        endDate: congeData.dateFin,
        motif: congeData.motif || undefined,
      })
      refreshLeaves()
      setModalType('none')
      setEditingCongeId(null)
      setCongeData({ dateDebut: currentWeekDates[selectedDay] || '', dateFin: currentWeekDates[selectedDay] || '', motif: '' })
      showToast('✓ Congé mis à jour')
      return
    }

    // CREATE
    addLeave({
      employeeId: selectedEmp.id,
      startDate: congeData.dateDebut,
      endDate: congeData.dateFin,
      motif: congeData.motif || undefined,
    })
    refreshLeaves()
    setModalType('none')
    setCongeData({ dateDebut: currentWeekDates[selectedDay] || '', dateFin: currentWeekDates[selectedDay] || '', motif: '' })
    showToast('✓ Congé enregistré')
  }

  const isEmployeeOnConge = (empId: string, dateStr: string) => isOnLeave(empId, dateStr)

  const handleDeleteConge = () => {
    if (!congeToDelete) return
    deleteLeave(congeToDelete.id)
    refreshLeaves()
    setModalType('none')
    setCongeToDelete(null)
    setEditingCongeId(null)
    showToast('✓ Congé supprimé')
  }

  const weekStartStr = currentWeekDates[0]
  const weekEndStr = currentWeekDates[5]
  const getEmpCongesForWeek = (empId: string) =>
    leaves.filter(l => l.employeeId === empId && l.startDate <= weekEndStr && l.endDate >= weekStartStr)

  const getStudentState = (id: string): StudentCardState => { if (studentStates[id]) return studentStates[id]; const d = MOCK_DISPONIBILITES.find(x => x.employee_id === id)?.[dayKey]; let st = '08:00', et = '14:00'; if (d) { const p = d.split('-'); if (p.length === 2) { st = normTime(p[0]); et = normTime(p[1]) } }; return { expanded: false, startTime: st, endTime: et, hasPause: false, pauseStart: '12:00', pauseDuration: 30 } }
  const updStudentState = (id: string, u: Partial<StudentCardState>) => setStudentStates(p => ({ ...p, [id]: { ...getStudentState(id), ...u } }))
  const assignStudent = (id: string) => { const st = getStudentState(id), stu = MOCK_DISPONIBILITES.find(x => x.employee_id === id); if (!stu) return; const ns: PlanningSlot[] = [{ id: `slot-${Date.now()}`, employee_id: id, start_time: st.startTime, end_time: st.endTime, type: 'work' }]; if (st.hasPause) ns.push({ id: `pause-${Date.now()+1}`, employee_id: id, start_time: st.pauseStart, end_time: addMins(st.pauseStart, st.pauseDuration), type: 'pause' }); setSlots(p => ({ ...p, [dayKey]: [...(p[dayKey] || []).filter(s => s.employee_id !== id), ...ns] })); showToast(`✓ ${stu.employee_name} ajouté`); updStudentState(id, { expanded: false }) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={goToPrevWeek} style={{ padding: '4px 8px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', color: TXT.primary, fontWeight: '600' }}>←</button>
          <span style={{ fontWeight: '600', fontSize: '13px', color: TXT.primary, minWidth: '140px', textAlign: 'center' }}>{formatWeekRange(weekStart)}</span>
          <button onClick={goToNextWeek} style={{ padding: '4px 8px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', color: TXT.primary, fontWeight: '600' }}>→</button>
          <button onClick={goToToday} style={{ padding: '4px 8px', background: '#dbeafe', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#2563eb', fontSize: '11px', fontWeight: '500' }}>Aujourd'hui</button>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <select value={filter} onChange={e => setFilter(e.target.value as FilterType)} style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '11px', color: TXT.primary, background: 'white' }}>
            <option value="all">Tous</option>
            <option value="Pharmacien">Pharmaciens</option>
            <option value="Preparateur">Préparateurs</option>
            <option value="Etudiant">Étudiants</option>
          </select>
          <button
            onClick={() => setShowSidebar(prev => !prev)}
            style={{
              padding: '4px 8px',
              background: showSidebar ? '#dbeafe' : '#f1f5f9',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              color: TXT.primary,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '600',
            }}
          >
            🎓 Étudiants
          </button>
          <button
            onClick={() => setShowSidebar(prev => !prev)}
            style={{
              padding: '4px 8px',
              background: showSidebar ? '#dbeafe' : '#f1f5f9',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              color: TXT.primary,
            }}
          >
            {showSidebar ? '◀' : '▶'}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', padding: '0 16px' }}>
        <div style={{ display: 'flex', flex: 1 }}>
          {currentWeekDayNames.map((dayName, i) => {
            const active = activeView === 'day' && selectedDay === i
            const [name, num] = dayName.split(' ')
            return <button key={i} onClick={() => { setSelectedDay(i) }} style={{ padding: '6px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: active ? '#eff6ff' : 'transparent', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontWeight: '600', color: active ? '#2563eb' : TXT.primary, fontSize: '12px' }}>{name}</span>
              <span style={{ fontSize: '10px', color: active ? '#3b82f6' : TXT.secondary }}>{num}</span>
            </button>
          })}
        </div>
        <div style={{ display: 'flex', gap: '4px', alignSelf: 'center' }}>
          <Link
            href="/titulaire/planning/recap"
            style={{
              padding: '4px 10px',
              background: 'transparent',
              color: TXT.primary,
              border: 'none',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '11px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📊 Récap
          </Link>
          <Link
            href="/titulaire/gardes"
            style={{
              padding: '4px 10px',
              background: 'transparent',
              color: TXT.primary,
              border: 'none',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '11px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🌙 Gardes
          </Link>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
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
        <main style={{ flex: 1, overflow: 'auto', background: 'white' }}>
          <div style={{ padding: '8px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: '600', margin: 0, color: TXT.primary }}>📅 {currentWeekDayNames[selectedDay]} {weekStart.getFullYear()}</h2>
              <div style={{ display: 'flex', gap: '4px' }}>
                <Link
                  href={`/titulaire/planning/print?weekStart=${encodeURIComponent(currentWeekDates[0] || '')}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: '4px 8px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: TXT.primary,
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  🖨️ PDF
                </Link>
                <button onClick={() => showToast('✓ Enregistré')} style={{ padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '3px', fontWeight: '600', cursor: 'pointer', fontSize: '10px' }}>💾 Sauver</button>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
              {/* Header heures */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f9fafb', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ width: `${EMP_COL_W}px`, padding: '4px 6px', fontWeight: '600', color: TXT.secondary, fontSize: '9px', borderRight: '1px solid #e2e8f0', textTransform: 'uppercase' }}>Employé</div>
                <div style={{ flex: 1, display: 'flex' }}>
                  {HOURS.slice(0, -1).map(h => (
                    <div
                      key={h}
                      style={{
                        flex: 1,
                        padding: '4px 0',
                        textAlign: 'left',
                        paddingLeft: '4px',
                        fontSize: '9px',
                        color: TXT.secondary,
                        fontWeight: isKeyTime(h) ? '800' : '500',
                        borderRight: '1px solid #f1f5f9',
                        background: isLunchCol(h) ? '#fef9c3' : 'transparent',
                        lineHeight: '1',
                      }}
                    >
                      {(isKeyTime(h) || Math.round((h % 1) * 60) === 0)
                        ? (h === REAL_START ? '8h30' : h === REAL_END ? '20h30' : formatHourLabel(h))
                        : ''}
                    </div>
                  ))}
                  <div
                    style={{
                      width: 0,
                      position: 'relative',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: '100%',
                        top: 0,
                        transform: 'translateX(-50%)',
                        fontSize: '9px',
                        color: TXT.secondary,
                        fontWeight: '800',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatHourLabel(END_HOUR)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rows */}
              {filteredRoles.map(role => {
                const emps = empByRole[role]
                if (emps.length === 0 && role !== 'Etudiant') return null
                const isCollapsed = collapsedRoles.has(role)
                return (
                  <div key={role}>
                    <div onClick={() => toggleRole(role)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 6px', background: '#f3f4f6', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', userSelect: 'none' }}>
                      <span style={{ fontSize: '9px', color: TXT.muted }}>{isCollapsed ? '▶' : '▼'}</span>
                      <span style={{ fontSize: '12px' }}>{getRoleIcon(role)}</span>
                      <span style={{ fontWeight: '600', color: TXT.primary, fontSize: '11px' }}>{getRoleLabel(role)}s</span>
                      <span style={{ padding: '1px 5px', background: 'white', borderRadius: '8px', fontSize: '9px', color: TXT.secondary, border: '1px solid #e2e8f0' }}>{emps.length}</span>
                    </div>
                    {!isCollapsed && emps.map(emp => {
                      const empSlots = getEmpSlots(emp.id), workSlots = empSlots.filter(s => s.type === 'work'), pauseSlots = empSlots.filter(s => s.type === 'pause'), isWorking = workSlots.length > 0, color = (emp.fonction === 'Etudiant' ? '#122041ff' : ROLE_COLORS[emp.fonction])
                      return (
                        <div key={emp.id} onClick={() => openEdit(emp)} style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <div style={{ width: `${EMP_COL_W}px`, padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', borderRight: '1px solid #f1f5f9' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '4px', background: isWorking ? color : '#e5e7eb', color: isWorking ? 'white' : TXT.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '9px', flexShrink: 0 }}>{emp.initiales}</div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: '700', color: TXT.primary, fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.prenom}</div>
                              <div style={{ fontSize: '9px', color: isWorking ? TXT.secondary : TXT.link, fontWeight: isWorking ? '600' : '700' }}>{isWorking ? `${workSlots[0].start_time}→${workSlots[0].end_time}` : 'Éditer'}</div>
                            </div>
                          </div>
                          <div style={{ flex: 1, position: 'relative', height: '36px' }}>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                              {HOURS.slice(0, -1).map(h => (
                                <div
                                  key={h}
                                  style={{
                                    flex: 1,
                                    borderRight: '1px solid #f5f5f5',
                                    background: isLunchCol(h) ? 'rgba(254,249,195,0.3)' : 'transparent',
                                  }}
                                />
                              ))}
                            </div>
                            {workSlots.map(s => <div key={s.id} style={{ position: 'absolute', top: '3px', bottom: '3px', left: `${toPct(s.start_time)}%`, width: `${Math.max(toPct(s.end_time) - toPct(s.start_time), 4)}%`, background: color, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: '600', boxShadow: '0 1px 2px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>{toPct(s.end_time) - toPct(s.start_time) > 10 && `${s.start_time}-${s.end_time}`}</div>)}
                            {pauseSlots.map(s => <div key={s.id} style={{ position: 'absolute', top: '3px', bottom: '3px', left: `${toPct(s.start_time)}%`, width: `${Math.max(toPct(s.end_time) - toPct(s.start_time), 3)}%`, background: '#f59e0b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: '600', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>☕</div>)}
                          {isEmployeeOnConge(emp.id, currentWeekDates[selectedDay]) && <div style={{ position: 'absolute', top: '3px', bottom: '3px', left: '0%', width: '100%', background: 'repeating-linear-gradient(45deg, #fecaca, #fecaca 5px, #fca5a5 5px, #fca5a5 10px)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b', fontSize: '11px', fontWeight: '700', border: '1px solid #f87171', zIndex: 5 }}>🏖️ Congé</div>}
                          </div>
                        </div>
                      )
                    })}
                    {!isCollapsed && emps.length === 0 && role === 'Etudiant' && <div style={{ padding: '10px', textAlign: 'center', color: TXT.muted, fontSize: '10px' }}>👈 Assignez depuis la sidebar</div>}
                  </div>
                )
              })}
            </div>

            {/* Légende */}
            <div style={{ marginTop: '6px', padding: '4px 8px', background: '#f9fafb', borderRadius: '4px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {ROLE_ORDER.map(r => <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><div style={{ width: '10px', height: '5px', background: ROLE_COLORS[r], borderRadius: '1px' }} /><span style={{ fontSize: '9px', color: TXT.secondary }}>{getRoleLabel(r)}</span></div>)}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><div style={{ width: '10px', height: '5px', background: '#f59e0b', borderRadius: '1px' }} /><span style={{ fontSize: '9px', color: TXT.secondary }}>Pause</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><div style={{ width: '10px', height: '5px', background: '#fca5a5', borderRadius: '1px' }} /><span style={{ fontSize: '9px', color: TXT.secondary }}>Congé</span></div>
            </div>
          </div>
        </main>

        {/* Panel */}
        {editPanelOpen && selectedEmp && (
          <aside style={{ width: '240px', background: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            <header style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '5px', background: getRoleColor(selectedEmp.fonction), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '10px' }}>{selectedEmp.initiales}</div>
                  <div>
                    <h3 style={{ fontSize: '12px', fontWeight: '600', margin: 0, color: TXT.primary }}>{selectedEmp.prenom} {selectedEmp.nom}</h3>
                    <span style={{ fontSize: '9px', color: getRoleColor(selectedEmp.fonction), fontWeight: '500' }}>{getRoleLabel(selectedEmp.fonction)}</span>
                  </div>
                </div>
                <button onClick={closeEdit} style={{ width: '20px', height: '20px', borderRadius: '3px', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: '10px', color: TXT.primary }}>✕</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px', background: '#f9fafb', borderRadius: '4px' }}>
                <button onClick={goToPrevWeek} style={{ padding: '2px 6px', background: 'white', border: '1px solid #d1d5db', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}>←</button>
                <span style={{ fontSize: '10px', fontWeight: '500', color: TXT.primary }}>{formatWeekRange(weekStart)}</span>
                <button onClick={goToToday} style={{ padding: '2px 6px', background: '#dbeafe', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '9px', color: '#2563eb' }}>Auj.</button>
                <button onClick={goToNextWeek} style={{ padding: '2px 6px', background: 'white', border: '1px solid #d1d5db', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}>→</button>
              </div>
            </header>
            <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                <button onClick={() => setModalType('add-slot')} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><span style={{ fontSize: '14px' }}>➕</span><span style={{ fontSize: '9px', fontWeight: '500', color: TXT.primary }}>Créneau</span></button>
                <button onClick={() => setModalType('add-pause')} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><span style={{ fontSize: '14px' }}>☕</span><span style={{ fontSize: '9px', fontWeight: '500', color: TXT.primary }}>Pause</span></button>
                <button
                  onClick={() => {
                    setEditingCongeId(null)
                    setCongeToDelete(null)
                    setCongeData({ dateDebut: currentWeekDates[selectedDay], dateFin: currentWeekDates[selectedDay], motif: '' })
                    setModalType('add-conge')
                  }}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #fca5a5', background: '#fef2f2', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
                >
                  <span style={{ fontSize: '14px' }}>🏖️</span>
                  <span style={{ fontSize: '9px', fontWeight: '500', color: '#dc2626' }}>Congé</span>
                </button>
              </div>
            {/* Congés enregistrés */}
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <p style={{ fontSize: '9px', fontWeight: '600', color: TXT.secondary, margin: 0, textTransform: 'uppercase' }}>Congés enregistrés</p>
                <span style={{ fontSize: '9px', color: TXT.muted }}>
                  {getEmpCongesForWeek(selectedEmp.id).length}/{leaves.filter(l => l.employeeId === selectedEmp.id).length}
                </span>
              </div>

              {getEmpCongesForWeek(selectedEmp.id).length === 0 ? (
                <div style={{ padding: '10px', borderRadius: '6px', border: '1px dashed #e2e8f0', background: '#fafafa', textAlign: 'center', color: TXT.muted, fontSize: '10px' }}>
                  Aucun congé sur cette semaine
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {getEmpCongesForWeek(selectedEmp.id).map(c => (
                    <div key={c.id} style={{ padding: '8px', borderRadius: '4px', background: '#fef2f2', border: '1px solid #fca5a5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: '600', color: TXT.primary, margin: 0, fontSize: '11px' }}>Du {c.startDate} au {c.endDate}</p>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                            <span style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', borderRadius: '999px', fontSize: '9px', fontWeight: '600' }}>🏖️ Congé</span>
                            {c.motif && (
                              <span style={{ fontSize: '9px', color: '#991b1b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.motif}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingCongeId(c.id)
                              setCongeToDelete(null)
                              setCongeData({ dateDebut: c.startDate, dateFin: c.endDate, motif: c.motif || '' })
                              setModalType('add-conge')
                            }}
                            style={{ padding: '3px 5px', background: 'white', border: '1px solid #d1d5db', borderRadius: '2px', cursor: 'pointer', fontSize: '9px' }}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setCongeToDelete(c); setModalType('delete-conge-confirm') }}
                            style={{ padding: '3px 5px', background: '#fee2e2', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '9px' }}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
              <p style={{ fontSize: '9px', fontWeight: '600', color: TXT.secondary, margin: '0 0 6px 0', textTransform: 'uppercase' }}>Créneaux {DAYS_SHORT[selectedDay]}</p>
              {getEmpSlots(selectedEmp.id).length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', background: '#f9fafb', borderRadius: '6px', border: '1px dashed #e2e8f0' }}><span style={{ fontSize: '20px' }}>📭</span><p style={{ color: TXT.muted, margin: '6px 0 0 0', fontSize: '10px' }}>Aucun</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {getEmpSlots(selectedEmp.id).filter(s => s.type === 'work').map(slot => (
                    <div key={slot.id} onClick={() => { setEditingSlot(slot); setModalType('edit-slot') }} style={{ padding: '8px', borderRadius: '4px', background: '#eff6ff', border: '1px solid #bfdbfe', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><p style={{ fontWeight: '600', color: TXT.primary, margin: 0, fontSize: '11px' }}>{slot.start_time} - {slot.end_time}</p><p style={{ fontSize: '9px', color: '#2563eb', margin: '1px 0 0 0', fontWeight: '500' }}>🏢 Travail</p></div>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          <button onClick={e => { e.stopPropagation(); setEditingSlot(slot); setModalType('edit-slot') }} style={{ padding: '3px 5px', background: 'white', border: '1px solid #d1d5db', borderRadius: '2px', cursor: 'pointer', fontSize: '9px' }}>✏️</button>
                          <button onClick={e => { e.stopPropagation(); setEditingSlot(slot); setModalType('delete-confirm') }} style={{ padding: '3px 5px', background: '#fee2e2', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '9px' }}>🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getEmpSlots(selectedEmp.id).filter(s => s.type === 'pause').map(slot => (
                    <div key={slot.id} style={{ padding: '8px', borderRadius: '4px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><p style={{ fontWeight: '600', color: TXT.primary, margin: 0, fontSize: '11px' }}>{slot.start_time} - {slot.end_time}</p><p style={{ fontSize: '9px', color: '#d97706', margin: '1px 0 0 0', fontWeight: '500' }}>☕ Pause</p></div>
                        <button onClick={() => { setEditingSlot(slot); setModalType('delete-confirm') }} style={{ padding: '3px 5px', background: '#fee2e2', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '9px' }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                  {getEmpSlots(selectedEmp.id).filter(s => s.type === 'conge').map(slot => (
                    <div key={slot.id} style={{ padding: '8px', borderRadius: '4px', background: '#fef2f2', border: '1px solid #fca5a5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><p style={{ fontWeight: '600', color: TXT.primary, margin: 0, fontSize: '11px' }}>{slot.start_time} - {slot.end_time}</p><p style={{ fontSize: '9px', color: '#dc2626', margin: '1px 0 0 0', fontWeight: '500' }}>🏖️ Congé</p></div>
                        <button onClick={() => { setEditingSlot(slot); setModalType('delete-confirm') }} style={{ padding: '3px 5px', background: '#fee2e2', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '9px' }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Modals */}
      {modalType === 'add-slot' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalType('none')}>
          <div style={{ background: 'white', borderRadius: '10px', padding: '14px', width: '280px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: TXT.primary }}>➕ Nouveau créneau</h3><button onClick={() => setModalType('none')} style={{ width: '20px', height: '20px', borderRadius: '3px', border: 'none', background: '#f1f5f9', cursor: 'pointer', color: TXT.primary, fontSize: '10px' }}>✕</button></div>
            <div style={{ marginBottom: '8px' }}><label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: TXT.secondary, marginBottom: '3px' }}>Jour</label><div style={{ padding: '6px 8px', background: '#f9fafb', borderRadius: '3px', fontSize: '11px', color: TXT.primary }}>{SEMAINE_REFERENCE.jours[selectedDay]}</div></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
              <div><label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: TXT.secondary, marginBottom: '3px' }}>Début</label><input type="time" value={newSlot.startTime} onChange={e => setNewSlot(p => ({ ...p, startTime: e.target.value }))} style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '11px', color: TXT.primary }} /></div>
              <div><label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: TXT.secondary, marginBottom: '3px' }}>Fin</label><input type="time" value={newSlot.endTime} onChange={e => setNewSlot(p => ({ ...p, endTime: e.target.value }))} style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '11px', color: TXT.primary }} /></div>
            </div>
            <button onClick={handleAddSlot} style={{ width: '100%', padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', fontWeight: '600', cursor: 'pointer', fontSize: '11px' }}>Enregistrer</button>
          </div>
        </div>
      )}

      {modalType === 'edit-slot' && editingSlot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setModalType('none'); setEditingSlot(null) }}>
          <div style={{ background: 'white', borderRadius: '10px', padding: '14px', width: '280px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: TXT.primary }}>✏️ Modifier</h3><button onClick={() => { setModalType('none'); setEditingSlot(null) }} style={{ width: '20px', height: '20px', borderRadius: '3px', border: 'none', background: '#f1f5f9', cursor: 'pointer', color: TXT.primary, fontSize: '10px' }}>✕</button></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
              <div><label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: TXT.secondary, marginBottom: '3px' }}>Début</label><input type="time" value={editingSlot.start_time} onChange={e => setEditingSlot(p => p ? { ...p, start_time: e.target.value } : p)} style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '11px', color: TXT.primary }} /></div>
              <div><label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: TXT.secondary, marginBottom: '3px' }}>Fin</label><input type="time" value={editingSlot.end_time} onChange={e => setEditingSlot(p => p ? { ...p, end_time: e.target.value } : p)} style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '11px', color: TXT.primary }} /></div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setModalType('delete-confirm')} style={{ flex: 1, padding: '8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '5px', fontWeight: '600', cursor: 'pointer', fontSize: '11px' }}>🗑️</button>
              <button onClick={handleEditSlot} style={{ flex: 2, padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', fontWeight: '600', cursor: 'pointer', fontSize: '11px' }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'add-pause' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalType('none')}>
          <div style={{ background: 'white', borderRadius: '10px', padding: '14px', width: '280px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: TXT.primary }}>☕ Pause</h3><button onClick={() => setModalType('none')} style={{ width: '20px', height: '20px', borderRadius: '3px', border: 'none', background: '#f1f5f9', cursor: 'pointer', color: TXT.primary, fontSize: '10px' }}>✕</button></div>
            <div style={{ marginBottom: '8px' }}><label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: TXT.secondary, marginBottom: '3px' }}>Début</label><input type="time" value={pauseData.startTime} onChange={e => setPauseData(p => ({ ...p, startTime: e.target.value }))} style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '11px', color: TXT.primary }} /></div>
            <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: TXT.secondary, marginBottom: '4px' }}>Durée</label><div style={{ display: 'flex', gap: '4px' }}>{[15, 30, 45, 60].map(d => <button key={d} onClick={() => setPauseData(p => ({ ...p, duration: d }))} style={{ flex: 1, padding: '6px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '10px', background: pauseData.duration === d ? '#f59e0b' : '#f3f4f6', color: pauseData.duration === d ? 'white' : TXT.primary }}>{d}m</button>)}</div></div>
            <button onClick={handleAddPause} style={{ width: '100%', padding: '8px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '5px', fontWeight: '600', cursor: 'pointer', fontSize: '11px' }}>☕ Ajouter</button>
          </div>
        </div>
      )}

      {modalType === 'delete-confirm' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalType('none')}>
          <div style={{ background: 'white', borderRadius: '10px', padding: '14px', width: '260px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 6px 0', color: TXT.primary }}>🗑️ Supprimer ?</h3>
            <p style={{ color: TXT.secondary, margin: '0 0 12px 0', fontSize: '11px' }}>Irréversible</p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setModalType('none')} style={{ flex: 1, padding: '8px', background: '#f3f4f6', color: TXT.primary, border: 'none', borderRadius: '5px', fontWeight: '600', cursor: 'pointer', fontSize: '11px' }}>Annuler</button>
              <button onClick={handleDeleteSlot} style={{ flex: 1, padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', fontWeight: '600', cursor: 'pointer', fontSize: '11px' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'add-conge' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalType('none')}>
          <div style={{ background: 'white', borderRadius: '10px', padding: '14px', width: '300px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: TXT.primary }}>{editingCongeId ? '✏️ Modifier un congé' : '🏖️ Déclarer un congé'}</h3>
              <button onClick={() => { setModalType('none'); setEditingCongeId(null) }} style={{ width: '20px', height: '20px', borderRadius: '3px', border: 'none', background: '#f1f5f9', cursor: 'pointer', color: TXT.primary, fontSize: '10px' }}>✕</button>
            </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: '#374151', marginBottom: '3px' }}>Du (début)</label>
            <input type="date" value={congeData.dateDebut} onChange={e => setCongeData(p => ({ ...p, dateDebut: e.target.value, dateFin: p.dateFin < e.target.value ? e.target.value : p.dateFin }))} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '11px', color: TXT.primary }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: '#374151', marginBottom: '3px' }}>Au (fin)</label>
            <input type="date" value={congeData.dateFin} min={congeData.dateDebut} onChange={e => setCongeData(p => ({ ...p, dateFin: e.target.value }))} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '11px', color: TXT.primary }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: '#374151', marginBottom: '3px' }}>Motif (optionnel)</label>
            <input type="text" value={congeData.motif} onChange={e => setCongeData(p => ({ ...p, motif: e.target.value }))} placeholder="Ex: Vacances, RDV médical..." style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '11px', color: TXT.primary }} />
          </div>
          <div style={{ padding: '8px', background: '#fef2f2', borderRadius: '4px', marginBottom: '12px', fontSize: '10px', color: '#991b1b' }}>
            📅 {congeData.dateDebut === congeData.dateFin ? '1 jour' : `${Math.ceil((new Date(congeData.dateFin).getTime() - new Date(congeData.dateDebut).getTime()) / 86400000) + 1} jours`}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => { setModalType('none'); setEditingCongeId(null) }} style={{ flex: 1, padding: '8px', background: '#f3f4f6', color: TXT.primary, border: 'none', borderRadius: '5px', fontWeight: '600', cursor: 'pointer', fontSize: '11px' }}>Annuler</button>
            {editingCongeId && (
              <button
                onClick={() => {
                  if (!selectedEmp) return
                  const c = leaves.find(x => x.id === editingCongeId)
                  if (!c) return
                  setCongeToDelete(c)
                  setModalType('delete-conge-confirm')
                }}
                style={{ flex: 1, padding: '8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '5px', fontWeight: '700', cursor: 'pointer', fontSize: '11px' }}
              >
                🗑️ Supprimer
              </button>
            )}
            <button onClick={handleAddConge} style={{ flex: 2, padding: '8px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', fontWeight: '700', cursor: 'pointer', fontSize: '11px' }}>
              {editingCongeId ? 'Enregistrer' : '🏖️ Valider'}
            </button>
          </div>
        </div>
        </div>
      )}

      {modalType === 'delete-conge-confirm' && congeToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalType('none')}>
          <div style={{ background: 'white', borderRadius: '10px', padding: '14px', width: '260px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 6px 0', color: TXT.primary }}>🗑️ Supprimer ce congé ?</h3>
            <p style={{ color: TXT.secondary, margin: '0 0 12px 0', fontSize: '11px' }}>Du {congeToDelete.startDate} au {congeToDelete.endDate}</p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => { setModalType('none'); setCongeToDelete(null) }} style={{ flex: 1, padding: '8px', background: '#f3f4f6', color: TXT.primary, border: 'none', borderRadius: '5px', fontWeight: '600', cursor: 'pointer', fontSize: '11px' }}>Annuler</button>
              <button onClick={handleDeleteConge} style={{ flex: 1, padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', fontWeight: '700', cursor: 'pointer', fontSize: '11px' }}>Oui, supprimer</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: '12px', right: '12px', padding: '8px 14px', background: '#10b981', color: 'white', borderRadius: '6px', fontWeight: '600', fontSize: '11px', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', zIndex: 1000 }}>{toast}</div>}
    </div>
  )
}