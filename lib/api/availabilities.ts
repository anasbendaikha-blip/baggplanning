// ============================================================
// 📁 lib/api/availabilities.ts
// ============================================================
// Fonctions API pour gérer les disponibilités des étudiants
// ============================================================

import { createClient } from '@/utils/supabase/client'
import { Availability } from '@/types/supabase'

// ============================================================
// TYPES
// ============================================================

export interface AvailabilityWithEmployee extends Availability {
  employee: {
    id: string
    prenom: string
    nom: string | null
    initiales: string
  }
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

/**
 * Récupérer les disponibilités pour une semaine donnée
 * @param weekStart Date du lundi (format YYYY-MM-DD)
 */
export async function getAvailabilitiesForWeek(weekStart: string): Promise<AvailabilityWithEmployee[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('availabilities')
    .select(`
      *,
      employee:employees(id, prenom, nom, initiales)
    `)
    .eq('week_start', weekStart)
    .order('day_of_week')
    .order('start_time')
  
  if (error) {
    console.error('Erreur getAvailabilitiesForWeek:', error)
    throw new Error(error.message)
  }
  
  return (data as unknown as AvailabilityWithEmployee[]) || []
}

/**
 * Récupérer les disponibilités d'un étudiant pour une semaine
 */
export async function getStudentAvailabilities(
  employeeId: string, 
  weekStart: string
): Promise<Availability[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('availabilities')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('week_start', weekStart)
    .order('day_of_week')
    .order('start_time')
  
  if (error) {
    console.error('Erreur getStudentAvailabilities:', error)
    throw new Error(error.message)
  }
  
  return data || []
}

/**
 * Récupérer la matrice des disponibilités (pour la vue titulaire)
 * Retourne un objet structuré par étudiant avec ses dispos par jour
 */
export async function getAvailabilityMatrix(weekStart: string): Promise<WeekAvailability[]> {
  const supabase = createClient()
  
  // 1. Récupérer tous les étudiants
  const { data: students, error: studentsError } = await supabase
    .from('employees')
    .select('id, prenom, nom, initiales')
    .eq('role', 'Etudiant')
    .eq('actif', true)
    .order('prenom')
  
  if (studentsError) {
    console.error('Erreur récupération étudiants:', studentsError)
    throw new Error(studentsError.message)
  }
  
  // 2. Récupérer les disponibilités de la semaine
  const { data: availabilities, error: availError } = await supabase
    .from('availabilities')
    .select('*')
    .eq('week_start', weekStart)
  
  if (availError) {
    console.error('Erreur récupération disponibilités:', availError)
    throw new Error(availError.message)
  }
  
  // 3. Construire la matrice
  const matrix: WeekAvailability[] = (students || []).map(student => {
    const studentAvail = (availabilities || []).filter(a => a.employee_id === student.id)
    
    const days: WeekAvailability['days'] = {}
    for (let d = 0; d <= 5; d++) {
      const dayAvail = studentAvail.filter(a => a.day_of_week === d)
      days[d] = dayAvail.length > 0 
        ? dayAvail.map(a => ({ start_time: a.start_time, end_time: a.end_time }))
        : null
    }
    
    return {
      employee_id: student.id,
      employee_name: student.nom ? `${student.prenom} ${student.nom}` : student.prenom,
      initiales: student.initiales,
      days,
      has_submitted: studentAvail.length > 0,
    }
  })
  
  return matrix
}

/**
 * Récupérer les étudiants disponibles pour un jour donné
 */
export async function getAvailableStudentsForDay(
  weekStart: string,
  dayOfWeek: number
): Promise<AvailabilityWithEmployee[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('availabilities')
    .select(`
      *,
      employee:employees(id, prenom, nom, initiales)
    `)
    .eq('week_start', weekStart)
    .eq('day_of_week', dayOfWeek)
    .order('start_time')
  
  if (error) {
    console.error('Erreur getAvailableStudentsForDay:', error)
    throw new Error(error.message)
  }
  
  return (data as unknown as AvailabilityWithEmployee[]) || []
}

// ============================================================
// CRÉATION / MISE À JOUR
// ============================================================

/**
 * Soumettre les disponibilités d'un étudiant pour une semaine
 * (Supprime les anciennes et insère les nouvelles)
 */
export async function submitAvailabilities(
  employeeId: string,
  weekStart: string,
  availabilities: Array<{
    day_of_week: number
    start_time: string
    end_time: string
  }>
): Promise<void> {
  const supabase = createClient()
  
  // 1. Supprimer les anciennes disponibilités pour cette semaine
  const { error: deleteError } = await supabase
    .from('availabilities')
    .delete()
    .eq('employee_id', employeeId)
    .eq('week_start', weekStart)
  
  if (deleteError) {
    console.error('Erreur suppression anciennes dispos:', deleteError)
    throw new Error(deleteError.message)
  }
  
  // 2. Insérer les nouvelles
  if (availabilities.length > 0) {
    const toInsert = availabilities.map(a => ({
      employee_id: employeeId,
      week_start: weekStart,
      day_of_week: a.day_of_week,
      start_time: a.start_time,
      end_time: a.end_time,
    }))
    
    const { error: insertError } = await supabase
      .from('availabilities')
      .insert(toInsert)
    
    if (insertError) {
      console.error('Erreur insertion nouvelles dispos:', insertError)
      throw new Error(insertError.message)
    }
  }
}

// ============================================================
// SUPPRESSION
// ============================================================

/**
 * Supprimer une disponibilité
 */
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

/**
 * Compter les réponses pour une semaine
 */
export async function getAvailabilityStats(weekStart: string): Promise<{
  total_students: number
  submitted: number
  pending: number
  rate: number
}> {
  const supabase = createClient()
  
  // Compter les étudiants
  const { count: totalStudents, error: countError } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'Etudiant')
    .eq('actif', true)
  
  if (countError) {
    console.error('Erreur comptage étudiants:', countError)
    throw new Error(countError.message)
  }
  
  // Compter les étudiants ayant soumis
  const { data: submittedData, error: submittedError } = await supabase
    .from('availabilities')
    .select('employee_id')
    .eq('week_start', weekStart)
  
  if (submittedError) {
    console.error('Erreur comptage soumissions:', submittedError)
    throw new Error(submittedError.message)
  }
  
  const uniqueSubmitted = new Set(submittedData?.map(d => d.employee_id)).size
  const total = totalStudents || 0
  const pending = total - uniqueSubmitted
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

/**
 * Obtenir le lundi de la semaine courante
 */
export function getCurrentWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Ajuster si dimanche
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0]
}

/**
 * Formater une heure (TIME) pour l'affichage
 */
export function formatTime(time: string): string {
  // "14:00:00" -> "14h00" ou "14:00" -> "14h00"
  const [hours, minutes] = time.split(':')
  return `${hours}h${minutes === '00' ? '' : minutes}`
}

/**
 * Formater un créneau pour l'affichage
 */
export function formatTimeSlot(start: string, end: string): string {
  return `${formatTime(start)}-${formatTime(end)}`
}
