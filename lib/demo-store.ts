// ============================================================
// 📁 lib/demo-store.ts
// ============================================================
// Store partagé pour les données de démo (localStorage)
// Utilisé par Planning, Équipe, Étudiants
// ============================================================

const STORAGE_KEY = 'baggplanning_store'

// ============================================================
// TYPES
// ============================================================

export interface Leave {
  id: string
  employeeId: string
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  motif?: string
  createdAt: string
}

export interface Shift {
  id: string
  employeeId: string
  date: string // YYYY-MM-DD
  startTime: string
  endTime: string
  type: 'work' | 'pause'
}

export interface StudentAssignment {
  id: string
  studentId: string
  date: string // YYYY-MM-DD
  startTime: string
  endTime: string
  hasPause: boolean
  pauseStart?: string
  pauseDuration?: number
  createdAt: string
}

interface Store {
  leaves: Leave[]
  shifts: Shift[]
  studentAssignments: StudentAssignment[]
}

// ============================================================
// STORE ACCESS
// ============================================================

const getStore = (): Store => {
  if (typeof window === 'undefined') {
    return { leaves: [], shifts: [], studentAssignments: [] }
  }
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      return {
        leaves: parsed.leaves || [],
        shifts: parsed.shifts || [],
        studentAssignments: parsed.studentAssignments || [],
      }
    }
  } catch (e) {
    console.error('Error reading store:', e)
  }
  return { leaves: [], shifts: [], studentAssignments: [] }
}

const saveStore = (store: Store): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch (e) {
    console.error('Error saving store:', e)
  }
}

// ============================================================
// LEAVES (Congés)
// ============================================================

export const addLeave = (leave: Omit<Leave, 'id' | 'createdAt'>): Leave => {
  const store = getStore()
  const newLeave: Leave = {
    ...leave,
    id: `leave-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  }
  store.leaves.push(newLeave)
  saveStore(store)
  return newLeave
}

export const updateLeave = (id: string, patch: Partial<Omit<Leave, 'id' | 'createdAt'>>): Leave | null => {
  const store = getStore()
  const idx = store.leaves.findIndex(l => l.id === id)
  if (idx === -1) return null
  store.leaves[idx] = { ...store.leaves[idx], ...patch }
  saveStore(store)
  return store.leaves[idx]
}

export const deleteLeave = (id: string): boolean => {
  const store = getStore()
  const idx = store.leaves.findIndex(l => l.id === id)
  if (idx === -1) return false
  store.leaves.splice(idx, 1)
  saveStore(store)
  return true
}

export const getAllLeaves = (): Leave[] => {
  return getStore().leaves
}

export const getLeavesForEmployee = (employeeId: string): Leave[] => {
  return getStore().leaves.filter(l => l.employeeId === employeeId)
}

export const getLeavesForWeek = (weekStart: Date): Leave[] => {
  const start = weekStart.toISOString().split('T')[0]
  const endDate = new Date(weekStart)
  endDate.setDate(weekStart.getDate() + 6)
  const end = endDate.toISOString().split('T')[0]
  return getStore().leaves.filter(l => l.startDate <= end && l.endDate >= start)
}

export const isOnLeave = (employeeId: string, date: string): boolean => {
  return getStore().leaves.some(
    l => l.employeeId === employeeId && date >= l.startDate && date <= l.endDate
  )
}

// ============================================================
// SHIFTS (Créneaux)
// ============================================================

export const addShift = (shift: Omit<Shift, 'id'>): Shift => {
  const store = getStore()
  const newShift: Shift = {
    ...shift,
    id: `shift-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  }
  store.shifts.push(newShift)
  saveStore(store)
  return newShift
}

export const getShiftsForDate = (date: string): Shift[] => {
  return getStore().shifts.filter(s => s.date === date)
}

export const getShiftsForEmployee = (employeeId: string, date: string): Shift[] => {
  return getStore().shifts.filter(s => s.employeeId === employeeId && s.date === date)
}

export const deleteShift = (id: string): boolean => {
  const store = getStore()
  const idx = store.shifts.findIndex(s => s.id === id)
  if (idx === -1) return false
  store.shifts.splice(idx, 1)
  saveStore(store)
  return true
}

// ============================================================
// STUDENT ASSIGNMENTS (Affectations étudiants)
// ============================================================

export const addStudentAssignment = (
  assignment: Omit<StudentAssignment, 'id' | 'createdAt'>
): StudentAssignment => {
  const store = getStore()
  
  // Supprimer l'ancienne affectation pour ce jour si elle existe
  store.studentAssignments = store.studentAssignments.filter(
    a => !(a.studentId === assignment.studentId && a.date === assignment.date)
  )
  
  const newAssignment: StudentAssignment = {
    ...assignment,
    id: `assign-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  }
  store.studentAssignments.push(newAssignment)
  saveStore(store)
  return newAssignment
}

export const removeStudentAssignment = (studentId: string, date: string): boolean => {
  const store = getStore()
  const initialLength = store.studentAssignments.length
  store.studentAssignments = store.studentAssignments.filter(
    a => !(a.studentId === studentId && a.date === date)
  )
  if (store.studentAssignments.length < initialLength) {
    saveStore(store)
    return true
  }
  return false
}

export const getStudentAssignments = (): StudentAssignment[] => {
  return getStore().studentAssignments
}

export const getStudentAssignmentsForDate = (date: string): StudentAssignment[] => {
  return getStore().studentAssignments.filter(a => a.date === date)
}

export const getStudentAssignmentsForWeek = (weekStart: Date): StudentAssignment[] => {
  const start = weekStart.toISOString().split('T')[0]
  const endDate = new Date(weekStart)
  endDate.setDate(weekStart.getDate() + 6)
  const end = endDate.toISOString().split('T')[0]
  return getStore().studentAssignments.filter(a => a.date >= start && a.date <= end)
}

export const getStudentAssignmentForDay = (
  studentId: string, 
  date: string
): StudentAssignment | undefined => {
  return getStore().studentAssignments.find(
    a => a.studentId === studentId && a.date === date
  )
}

// ============================================================
// UTILITIES
// ============================================================

export const clearStore = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export const exportStore = (): string => {
  return JSON.stringify(getStore(), null, 2)
}

export const importStore = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString)
    saveStore({
      leaves: data.leaves || [],
      shifts: data.shifts || [],
      studentAssignments: data.studentAssignments || [],
    })
    return true
  } catch {
    return false
  }
}