// ============================================================
// 📁 lib/api/schedule.ts
// ============================================================
// Fonctions API pour gérer le planning
// ============================================================

import { createClient } from '@/utils/supabase/client'
import { ScheduleEntry, Employee } from '@/types/supabase'

// ============================================================
// TYPES
// ============================================================

export interface ScheduleEntryWithEmployee extends ScheduleEntry {
  employee: {
    id: string
    prenom: string
    nom: string | null
    initiales: string
    role: string
  }
}

export interface DaySchedule {
  date: string
  entries: ScheduleEntryWithEmployee[]
  by_role: {
    Pharmacien: ScheduleEntryWithEmployee[]
    Preparateur: ScheduleEntryWithEmployee[]
    Apprenti: ScheduleEntryWithEmployee[]
    Etudiant: ScheduleEntryWithEmployee[]
    Conditionneur: ScheduleEntryWithEmployee[]
  }
}

// ============================================================
// LECTURE
// ============================================================

/**
 * Récupérer le planning pour une date
 */
export async function getScheduleForDate(date: string): Promise<ScheduleEntryWithEmployee[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('schedule_entries')
    .select(`
      *,
      employee:employees(id, prenom, nom, initiales, role)
    `)
    .eq('date', date)
    .order('start_time')
  
  if (error) {
    console.error('Erreur getScheduleForDate:', error)
    throw new Error(error.message)
  }
  
  return (data as unknown as ScheduleEntryWithEmployee[]) || []
}

/**
 * Récupérer le planning pour une semaine
 */
export async function getScheduleForWeek(
  startDate: string,
  endDate: string
): Promise<ScheduleEntryWithEmployee[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('schedule_entries')
    .select(`
      *,
      employee:employees(id, prenom, nom, initiales, role)
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
    .order('start_time')
  
  if (error) {
    console.error('Erreur getScheduleForWeek:', error)
    throw new Error(error.message)
  }
  
  return (data as unknown as ScheduleEntryWithEmployee[]) || []
}

/**
 * Récupérer le planning structuré par jour pour une semaine
 */
export async function getWeekScheduleByDay(weekStart: string): Promise<DaySchedule[]> {
  const days: DaySchedule[] = []
  
  // Générer les 6 jours (Lundi à Samedi)
  for (let i = 0; i < 6; i++) {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    
    const entries = await getScheduleForDate(dateStr)
    
    days.push({
      date: dateStr,
      entries,
      by_role: {
        Pharmacien: entries.filter(e => e.employee.role === 'Pharmacien'),
        Preparateur: entries.filter(e => e.employee.role === 'Preparateur'),
        Apprenti: entries.filter(e => e.employee.role === 'Apprenti'),
        Etudiant: entries.filter(e => e.employee.role === 'Etudiant'),
        Conditionneur: entries.filter(e => e.employee.role === 'Conditionneur'),
      },
    })
  }
  
  return days
}

/**
 * Récupérer le planning d'un employé pour une semaine
 */
export async function getEmployeeSchedule(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<ScheduleEntry[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('schedule_entries')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
  
  if (error) {
    console.error('Erreur getEmployeeSchedule:', error)
    throw new Error(error.message)
  }
  
  return data || []
}

// ============================================================
// CRÉATION
// ============================================================

/**
 * Ajouter une entrée de planning
 */
export async function createScheduleEntry(entry: {
  employee_id: string
  date: string
  start_time: string
  end_time: string
  pause_start?: string
  pause_duration?: number
}): Promise<ScheduleEntry> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('schedule_entries')
    .insert({
      employee_id: entry.employee_id,
      date: entry.date,
      start_time: entry.start_time,
      end_time: entry.end_time,
      pause_start: entry.pause_start || null,
      pause_duration: entry.pause_duration || null,
      is_published: false,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Erreur createScheduleEntry:', error)
    throw new Error(error.message)
  }
  
  return data
}

/**
 * Assigner un étudiant au planning (avec gestion des créneaux multiples)
 */
export async function assignStudentToSchedule(
  employeeId: string,
  date: string,
  slots: Array<{ start_time: string; end_time: string }>,
  pauseInfo?: { start: string; duration: number }
): Promise<ScheduleEntry[]> {
  const supabase = createClient()
  
  // Supprimer les anciennes entrées pour cet employé ce jour
  await supabase
    .from('schedule_entries')
    .delete()
    .eq('employee_id', employeeId)
    .eq('date', date)
  
  // Insérer les nouveaux créneaux
  const entries = slots.map((slot, index) => ({
    employee_id: employeeId,
    date,
    start_time: slot.start_time,
    end_time: slot.end_time,
    pause_start: index === 0 && pauseInfo ? pauseInfo.start : null,
    pause_duration: index === 0 && pauseInfo ? pauseInfo.duration : null,
    is_published: false,
  }))
  
  const { data, error } = await supabase
    .from('schedule_entries')
    .insert(entries)
    .select()
  
  if (error) {
    console.error('Erreur assignStudentToSchedule:', error)
    throw new Error(error.message)
  }
  
  return data || []
}

// ============================================================
// MISE À JOUR
// ============================================================

/**
 * Modifier une entrée de planning
 */
export async function updateScheduleEntry(
  id: string,
  updates: Partial<ScheduleEntry>
): Promise<ScheduleEntry> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('schedule_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Erreur updateScheduleEntry:', error)
    throw new Error(error.message)
  }
  
  return data
}

/**
 * Publier le planning pour une date
 */
export async function publishScheduleForDate(date: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('schedule_entries')
    .update({ is_published: true })
    .eq('date', date)
  
  if (error) {
    console.error('Erreur publishScheduleForDate:', error)
    throw new Error(error.message)
  }
}

/**
 * Publier le planning pour une semaine
 */
export async function publishScheduleForWeek(
  startDate: string,
  endDate: string
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('schedule_entries')
    .update({ is_published: true })
    .gte('date', startDate)
    .lte('date', endDate)
  
  if (error) {
    console.error('Erreur publishScheduleForWeek:', error)
    throw new Error(error.message)
  }
}

// ============================================================
// SUPPRESSION
// ============================================================

/**
 * Supprimer une entrée de planning
 */
export async function deleteScheduleEntry(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('schedule_entries')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Erreur deleteScheduleEntry:', error)
    throw new Error(error.message)
  }
}

/**
 * Supprimer toutes les entrées d'un employé pour une date
 */
export async function clearEmployeeScheduleForDate(
  employeeId: string,
  date: string
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('schedule_entries')
    .delete()
    .eq('employee_id', employeeId)
    .eq('date', date)
  
  if (error) {
    console.error('Erreur clearEmployeeScheduleForDate:', error)
    throw new Error(error.message)
  }
}

// ============================================================
// UTILITAIRES
// ============================================================

/**
 * Calculer le nombre d'heures travaillées
 */
export function calculateWorkedHours(
  startTime: string,
  endTime: string,
  pauseDuration?: number | null
): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  
  let totalMinutes = endMinutes - startMinutes
  if (pauseDuration) {
    totalMinutes -= pauseDuration
  }
  
  return totalMinutes / 60
}

/**
 * Calculer les heures totales pour une liste d'entrées
 */
export function calculateTotalHours(entries: ScheduleEntry[]): number {
  return entries.reduce((total, entry) => {
    return total + calculateWorkedHours(
      entry.start_time,
      entry.end_time,
      entry.pause_duration
    )
  }, 0)
}

/**
 * Vérifier si un créneau chevauche un autre
 */
export function hasOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }
  
  const s1 = toMinutes(start1)
  const e1 = toMinutes(end1)
  const s2 = toMinutes(start2)
  const e2 = toMinutes(end2)
  
  return s1 < e2 && s2 < e1
}
