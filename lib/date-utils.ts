// ============================================================
// 📁 lib/date-utils.ts
// ============================================================
// Utilitaires pour manipulation des dates et semaines
// ============================================================

/**
 * Retourne le lundi de la semaine contenant la date donnée
 */
export const getWeekStart = (date: Date = new Date()): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Ajuste si dimanche
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Ajoute ou soustrait des semaines à une date
 */
export const addWeeks = (date: Date, weeks: number): Date => {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

/**
 * Formate une plage de semaine "26 jan. - 31 jan."
 */
export const formatWeekRange = (start: Date): string => {
  const end = new Date(start)
  end.setDate(start.getDate() + 5) // Samedi
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${start.toLocaleDateString('fr-FR', opts)} - ${end.toLocaleDateString('fr-FR', opts)}`
}

/**
 * Retourne les 6 dates de la semaine (lundi→samedi) au format YYYY-MM-DD
 */
export const getWeekDates = (weekStart: Date): string[] => {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

/**
 * Retourne les noms des jours de la semaine "Lun 26", "Mar 27", etc.
 */
export const getWeekDayNames = (weekStart: Date): string[] => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return `${days[d.getDay()]} ${d.getDate()}`
  })
}

/**
 * Formate une date en français complet "Jeudi 23 janvier 2026"
 */
export const formatDateFull = (date: Date): string => {
  const opts: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }
  return date.toLocaleDateString('fr-FR', opts)
}

/**
 * Parse une date YYYY-MM-DD en objet Date
 */
export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Vérifie si deux plages de dates se chevauchent
 */
export const datesOverlap = (
  start1: string, end1: string, 
  start2: string, end2: string
): boolean => {
  return start1 <= end2 && end1 >= start2
}

/**
 * Calcule le nombre de jours entre deux dates
 */
export const daysBetween = (start: string, end: string): number => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
}