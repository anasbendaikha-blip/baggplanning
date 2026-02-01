// ============================================================
// 📁 lib/planning.ts
// ============================================================
// Fonctions utilitaires pour le calcul des heures et planning
// ============================================================

/**
 * Calcule le nombre d'heures entre deux horaires avec pause optionnelle
 * @param startTime - Heure de début (format HH:MM)
 * @param endTime - Heure de fin (format HH:MM)
 * @param breakDuration - Durée de pause en minutes (optionnel)
 * @returns Nombre d'heures (décimal)
 */
export function calculateHours(
  startTime: string,
  endTime: string,
  breakDuration: number = 0
): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  
  const totalMinutes = endMinutes - startMinutes - breakDuration
  
  return Math.max(0, totalMinutes / 60)
}

/**
 * Formate un nombre d'heures en chaîne lisible
 * @param hours - Nombre d'heures (décimal)
 * @returns Chaîne formatée (ex: "7h30" ou "8h")
 */
export function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  
  if (m === 0) {
    return `${h}h`
  }
  return `${h}h${m.toString().padStart(2, '0')}`
}

/**
 * Parse un horaire au format "8h30-17h" en objets start/end
 */
export function parseHoraire(horaire: string): { start: string; end: string } | null {
  if (!horaire || horaire === 'non' || horaire === 'variable' || horaire === 'congé') {
    return null
  }
  
  const normalized = horaire.replace(/h/g, ':').replace(/:(\d)(?!\d)/g, ':0$1')
  const parts = normalized.split('-')
  
  if (parts.length !== 2) return null
  
  let start = parts[0].trim()
  let end = parts[1].trim()
  
  // Ajouter :00 si nécessaire
  if (!start.includes(':')) start += ':00'
  if (!end.includes(':')) end += ':00'
  
  // Normaliser le format (ex: 8:30 -> 08:30)
  start = start.split(':').map((p, i) => p.padStart(2, '0')).join(':')
  end = end.split(':').map((p, i) => p.padStart(2, '0')).join(':')
  
  return { start, end }
}

/**
 * Calcule les heures totales d'un employé pour la semaine
 * à partir de ses horaires
 */
export function calculateWeeklyHoursFromHoraires(
  horaires: Record<string, string>,
  pauseMinutes: number = 0
): number {
  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  let total = 0
  
  jours.forEach(jour => {
    const horaire = horaires[jour]
    const parsed = parseHoraire(horaire)
    if (parsed) {
      total += calculateHours(parsed.start, parsed.end, pauseMinutes)
    }
  })
  
  return total
}