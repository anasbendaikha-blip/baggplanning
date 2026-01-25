// ============================================================
// 📁 lib/api/availabilities.ts
// ============================================================
// Fonctions API pour gérer les disponibilités (table: availabilities)
// Compatible avec client Supabase non typé
// ============================================================

import { createClient } from '@/utils/supabase/client'

// ============================================================
// TYPES LOCAUX
// ============================================================

export type StudentRow = {
  id: string
  prenom: string
  nom: string | null
  initiales: string
}

export type AvailabilityRow = {
  id: string
  employee_id: string
  week_start: string
  day_of_week: number
  start_time: string
  end_time: string
  submitted_at: string | null
  created_at: string | null
}

export type AvailabilityWithEmployee = AvailabilityRow & {
  employee: StudentRow | null
}

export interface WeekAvailability {
  employee_id: string
  employee_name: string
  initiales: string
  days: {
    [day: number]: { start_time: string; end_time: string }[] | null
  }
  has_submitted: boolean
}

// ============================================================
// LECTURE
// ============================================================

export async function getAvailabilitiesForWeek(
  weekStart: string
): Promise<AvailabilityWithEmployee[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('availabilities')
    .select(
      `
      id,
      employee_id,
      week_start,
      day_of_week,
      start_time,
      end_time,
      submitted_at,
      created_at,
      employee:employees(id, prenom, nom, initiales)
    `
    )
    .eq('week_start', weekStart)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Erreur getAvailabilitiesForWeek:', error)
    throw new Error(error.message)
  }

  return (data ?? []) as AvailabilityWithEmployee[]
}

export async function getStudentAvailabilities(
  employeeId: string,
  weekStart: string
): Promise<AvailabilityRow[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('availabilities')
    .select(
      `
      id,
      employee_id,
      week_start,
      day_of_week,
      start_time,
      end_time,
      submitted_at,
      created_at
    `
    )
    .eq('employee_id', employeeId)
    .eq('week_start', weekStart)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Erreur getStudentAvailabilities:', error)
    throw new Error(error.message)
  }

  return (data ?? []) as AvailabilityRow[]
}

export async function getAvailabilityMatrix(
  weekStart: string
): Promise<WeekAvailability[]> {
  const supabase = createClient()

  // 1) Étudiants actifs
  const { data: studentsRaw, error: studentsError } = await supabase
    .from('employees')
    .select('id, prenom, nom, initiales')
    .eq('role', 'Etudiant')
    .eq('actif', true)
    .order('prenom', { ascending: true })

  if (studentsError) {
    console.error('Erreur récupération étudiants:', studentsError)
    throw new Error(studentsError.message)
  }

  const students = (studentsRaw ?? []) as StudentRow[]

  // 2) Disponibilités de la semaine
  const { data: availsRaw, error: availError } = await supabase
    .from('availabilities')
    .select(
      `
      id,
      employee_id,
      week_start,
      day_of_week,
      start_time,
      end_time,
      submitted_at,
      created_at
    `
    )
    .eq('week_start', weekStart)

  if (availError) {
    console.error('Erreur récupération disponibilités:', availError)
    throw new Error(availError.message)
  }

  const availabilities = (availsRaw ?? []) as AvailabilityRow[]

  // 3) Construire la matrice
  const matrix: WeekAvailability[] = students.map((student) => {
    const studentAvail = availabilities.filter(
      (a) => a.employee_id === student.id
    )

    const days: WeekAvailability['days'] = {}
    for (let d = 0; d <= 5; d++) {
      const dayAvail = studentAvail.filter((a) => a.day_of_week === d)
      days[d] =
        dayAvail.length > 0
          ? dayAvail.map((a) => ({
              start_time: normalizeTime(a.start_time),
              end_time: normalizeTime(a.end_time),
            }))
          : null
    }

    return {
      employee_id: student.id,
      employee_name: student.nom
        ? `${student.prenom} ${student.nom}`
        : student.prenom,
      initiales: student.initiales,
      days,
      has_submitted: studentAvail.length > 0,
    }
  })

  return matrix
}

export async function getAvailableStudentsForDay(
  weekStart: string,
  dayOfWeek: number
): Promise<AvailabilityWithEmployee[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('availabilities')
    .select(
      `
      id,
      employee_id,
      week_start,
      day_of_week,
      start_time,
      end_time,
      submitted_at,
      created_at,
      employee:employees(id, prenom, nom, initiales)
    `
    )
    .eq('week_start', weekStart)
    .eq('day_of_week', dayOfWeek)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Erreur getAvailableStudentsForDay:', error)
    throw new Error(error.message)
  }

  return (data ?? []) as AvailabilityWithEmployee[]
}

// ============================================================
// CRÉATION / MISE À JOUR
// ============================================================

export async function submitAvailabilities(
  employeeId: string,
  weekStart: string,
  slots: Array<{ day_of_week: number; start_time: string; end_time: string }>
): Promise<void> {
  const supabase = createClient()

  // 1) Supprimer les anciennes disponibilités
  const { error: deleteError } = await supabase
    .from('availabilities')
    .delete()
    .eq('employee_id', employeeId)
    .eq('week_start', weekStart)

  if (deleteError) {
    console.error('Erreur suppression anciennes dispos:', deleteError)
    throw new Error(deleteError.message)
  }

  // 2) Si pas de nouveaux slots, on s'arrête
  if (!slots || slots.length === 0) {
    return
  }

  // 3) Préparer et insérer les nouvelles disponibilités
  const rowsToInsert = slots.map((s) => ({
    employee_id: employeeId,
    week_start: weekStart,
    day_of_week: s.day_of_week,
    start_time: normalizeTime(s.start_time),
    end_time: normalizeTime(s.end_time),
  }))

  const { error: insertError } = await supabase
    .from('availabilities')
    .insert(rowsToInsert)

  if (insertError) {
    console.error('Erreur insertion nouvelles dispos:', insertError)
    throw new Error(insertError.message)
  }
}

// ============================================================
// SUPPRESSION
// ============================================================

export async function deleteAvailability(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('availabilities')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erreur deleteAvailability:', error)
    throw new Error(error.message)
  }
}

// ============================================================
// STATISTIQUES
// ============================================================

export async function getAvailabilityStats(weekStart: string): Promise<{
  total_students: number
  submitted: number
  pending: number
  rate: number
}> {
  const supabase = createClient()

  // Compter les étudiants actifs
  const { count: totalStudents, error: countError } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'Etudiant')
    .eq('actif', true)

  if (countError) {
    console.error('Erreur comptage étudiants:', countError)
    throw new Error(countError.message)
  }

  // Récupérer les soumissions
  const { data: submittedRaw, error: submittedError } = await supabase
    .from('availabilities')
    .select('employee_id')
    .eq('week_start', weekStart)

  if (submittedError) {
    console.error('Erreur comptage soumissions:', submittedError)
    throw new Error(submittedError.message)
  }

  const submittedData = (submittedRaw ?? []) as Array<{ employee_id: string }>
  const uniqueSubmitted = new Set(submittedData.map((d) => d.employee_id)).size

  const total = totalStudents ?? 0
  const pending = Math.max(0, total - uniqueSubmitted)
  const rate = total > 0 ? Math.round((uniqueSubmitted / total) * 100) : 0

  return {
    total_students: total,
    submitted: uniqueSubmitted,
    pending,
    rate,
  }
}

// ============================================================
// UTILITAIRES
// ============================================================

export function getCurrentWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0]
}

export function formatTime(time: string): string {
  const t = normalizeTime(time)
  const [hours, minutes] = t.split(':')
  return `${hours}h${minutes === '00' ? '' : minutes}`
}

export function formatTimeSlot(start: string, end: string): string {
  return `${formatTime(start)}-${formatTime(end)}`
}

function normalizeTime(time: string): string {
  if (!time) return '00:00'
  const parts = time.split(':')
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
  }
  return time
}
