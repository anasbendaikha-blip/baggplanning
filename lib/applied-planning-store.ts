// ============================================================
// 📁 lib/applied-planning-store.ts
// ============================================================
// Store partagé pour le planning généré par l'assistant
// Fait le pont entre la preview et la page Gantt
// ============================================================

import { JOURS_SEMAINE, MOCK_EMPLOYEES, type EmployeeRole } from '@/lib/mock-data'

// ============================================================
// Types
// ============================================================

/** Un créneau assigné à un employé pour un jour donné */
export interface AppliedSlot {
  id: string
  employee_id: string
  start_time: string  // HH:MM
  end_time: string    // HH:MM
  type: 'work' | 'pause'
}

/** Planning appliqué complet, par jour de la semaine */
export interface AppliedPlanning {
  id: string
  weekStart: string           // ISO date du lundi
  slots: Record<string, AppliedSlot[]>  // clé = jour (lundi, mardi...)
  metadata: {
    generatedAt: string
    appliedAt: string
    totalHeures: number
    employesCount: number
  }
}

/** Les contraintes telles que sauvées par l'assistant */
interface AssistantConstraints {
  periode: {
    dateDebut: string
    dateFin: string
    joursActifs: boolean[]
  }
  creneaux: {
    creneaux: Array<{
      id: string
      nom: string
      heureDebut: string
      heureFin: string
      joursAppliques: number[]
      besoins: Array<{
        role: EmployeeRole
        min: number
        max: number
      }>
    }>
  }
  employes: {
    contraintes: Array<{
      employeId: string
      employeNom: string
      employeInitiales: string
      role: EmployeeRole
      actif: boolean
      heuresMin: number
      heuresMax: number
    }>
  }
}

interface GeneratedPlanning {
  constraints: AssistantConstraints
  generatedAt: string
}

// ============================================================
// Constantes
// ============================================================

const STORAGE_KEY = 'applied_planning'
const GENERATED_KEY = 'generated_planning'

// ============================================================
// Helpers internes
// ============================================================

/** Convertit un index de jour (0=lundi) en clé JOURS_SEMAINE */
const dayIndexToKey = (index: number): string => {
  return JOURS_SEMAINE[index] || 'lundi'
}

/** Parse "HH:MM" ou "HHhMM" en minutes depuis minuit */
const parseTimeToMinutes = (time: string): number => {
  const normalized = time.replace('h', ':')
  const [h, m] = normalized.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/** Formate des minutes en "HH:MM" */
const minutesToTime = (mins: number): string => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/** Génère un ID unique */
const uid = (): string => `slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

// ============================================================
// Algorithme d'assignation
// ============================================================

/**
 * Convertit les contraintes de l'assistant en slots concrets
 * assignés à des employés réels.
 * 
 * Logique :
 * 1. Pour chaque jour actif de la période
 * 2. Pour chaque créneau applicable ce jour-là
 * 3. Pour chaque besoin par rôle dans ce créneau
 * 4. Assigner les employés actifs de ce rôle (round-robin)
 * 5. Ajouter une pause automatique si le créneau > 6h
 */
function generateSlots(constraints: AssistantConstraints): Record<string, AppliedSlot[]> {
  const result: Record<string, AppliedSlot[]> = {}
  JOURS_SEMAINE.forEach(j => { result[j] = [] })

  const { periode, creneaux, employes } = constraints

  // Employés actifs groupés par rôle
  const employesByRole: Record<EmployeeRole, typeof employes.contraintes> = {
    Pharmacien: [],
    Preparateur: [],
    Apprenti: [],
    Etudiant: [],
    Conditionneur: []
  }
  employes.contraintes
    .filter(e => e.actif)
    .forEach(e => {
      employesByRole[e.role].push(e)
    })

  // Compteur d'heures par employé (pour équilibrage)
  const heuresAttribuees: Record<string, number> = {}
  employes.contraintes.forEach(e => { heuresAttribuees[e.employeId] = 0 })

  // Pour chaque jour de la semaine (0=lundi → 5=samedi)
  for (let dayIdx = 0; dayIdx < 6; dayIdx++) {
    if (!periode.joursActifs[dayIdx]) continue

    const dayKey = dayIndexToKey(dayIdx)
    const daySlots: AppliedSlot[] = []

    // Créneaux applicables ce jour
    const creneauxJour = creneaux.creneaux.filter(c =>
      c.joursAppliques.includes(dayIdx)
    )

    for (const creneau of creneauxJour) {
      const startMins = parseTimeToMinutes(creneau.heureDebut)
      const endMins = parseTimeToMinutes(creneau.heureFin)
      const durationH = (endMins - startMins) / 60

      for (const besoin of creneau.besoins) {
        if (besoin.min <= 0) continue

        const candidats = employesByRole[besoin.role] || []
        if (candidats.length === 0) continue

        // Trier par heures attribuées (le moins chargé en premier)
        const sorted = [...candidats].sort((a, b) =>
          (heuresAttribuees[a.employeId] || 0) - (heuresAttribuees[b.employeId] || 0)
        )

        // Assigner min personnes
        const toAssign = Math.min(besoin.min, sorted.length)

        for (let i = 0; i < toAssign; i++) {
          const emp = sorted[i]

          // Vérifier qu'il n'est pas déjà assigné à ce créneau ce jour
          const alreadyAssigned = daySlots.some(s =>
            s.employee_id === emp.employeId &&
            s.type === 'work' &&
            parseTimeToMinutes(s.start_time) < endMins &&
            parseTimeToMinutes(s.end_time) > startMins
          )
          if (alreadyAssigned) continue

          // Vérifier qu'on ne dépasse pas le max hebdo
          const weekMax = emp.heuresMax * 1 // Pour 1 semaine
          if ((heuresAttribuees[emp.employeId] || 0) + durationH > weekMax * 1.1) continue

          // Créer le slot de travail
          daySlots.push({
            id: uid(),
            employee_id: emp.employeId,
            start_time: creneau.heureDebut,
            end_time: creneau.heureFin,
            type: 'work'
          })

          // Ajouter une pause automatique si créneau > 6h
          if (durationH > 6) {
            const pauseStart = startMins + Math.floor((endMins - startMins) / 2) - 15
            daySlots.push({
              id: uid(),
              employee_id: emp.employeId,
              start_time: minutesToTime(pauseStart),
              end_time: minutesToTime(pauseStart + 30),
              type: 'pause'
            })
          }

          // Mettre à jour le compteur
          heuresAttribuees[emp.employeId] = (heuresAttribuees[emp.employeId] || 0) + durationH
        }
      }
    }

    result[dayKey] = daySlots
  }

  return result
}

// ============================================================
// API publique
// ============================================================

/**
 * Convertit le planning généré par l'assistant en planning appliqué
 * et le sauvegarde dans le localStorage.
 * 
 * @returns Le planning appliqué, ou null si échec
 */
export function applyGeneratedPlanning(): AppliedPlanning | null {
  try {
    const raw = localStorage.getItem(GENERATED_KEY)
    if (!raw) return null

    const generated: GeneratedPlanning = JSON.parse(raw)
    const slots = generateSlots(generated.constraints)

    // Compter les heures et employés
    let totalMinutes = 0
    const uniqueEmployees = new Set<string>()
    Object.values(slots).forEach(daySlots => {
      daySlots.forEach(s => {
        if (s.type === 'work') {
          totalMinutes += parseTimeToMinutes(s.end_time) - parseTimeToMinutes(s.start_time)
          uniqueEmployees.add(s.employee_id)
        }
      })
    })

    // Calculer le lundi de la semaine de début
    const startDate = new Date(generated.constraints.periode.dateDebut)
    const dayOfWeek = startDate.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(startDate)
    monday.setDate(monday.getDate() + mondayOffset)
    const weekStart = monday.toISOString().split('T')[0]

    const applied: AppliedPlanning = {
      id: `planning-${Date.now()}`,
      weekStart,
      slots,
      metadata: {
        generatedAt: generated.generatedAt,
        appliedAt: new Date().toISOString(),
        totalHeures: Math.round(totalMinutes / 60),
        employesCount: uniqueEmployees.size
      }
    }

    // Sauvegarder
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applied))

    // Nettoyer le brouillon
    localStorage.removeItem(GENERATED_KEY)
    localStorage.removeItem('assistant_planning_draft')

    return applied
  } catch (err) {
    console.error('[applied-planning-store] Erreur:', err)
    return null
  }
}

/**
 * Charge le planning appliqué depuis le localStorage.
 * @returns Le planning appliqué, ou null si aucun
 */
export function getAppliedPlanning(): AppliedPlanning | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Vérifie si un planning appliqué existe pour une semaine donnée.
 * @param weekStart ISO date du lundi (YYYY-MM-DD)
 */
export function hasAppliedPlanning(weekStart?: string): boolean {
  const applied = getAppliedPlanning()
  if (!applied) return false
  if (weekStart && applied.weekStart !== weekStart) return false
  return true
}

/**
 * Récupère les slots d'un jour donné depuis le planning appliqué.
 * @param dayKey Clé du jour (lundi, mardi, etc.)
 * @returns Les slots du jour, ou un tableau vide
 */
export function getAppliedSlotsForDay(dayKey: string): AppliedSlot[] {
  const applied = getAppliedPlanning()
  if (!applied) return []
  return applied.slots[dayKey] || []
}

/**
 * Supprime le planning appliqué du localStorage.
 */
export function clearAppliedPlanning(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Met à jour les slots d'un jour dans le planning appliqué.
 * Utilisé quand l'utilisateur modifie manuellement le Gantt.
 */
export function updateAppliedDay(dayKey: string, slots: AppliedSlot[]): void {
  const applied = getAppliedPlanning()
  if (!applied) return
  applied.slots[dayKey] = slots
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applied))
}