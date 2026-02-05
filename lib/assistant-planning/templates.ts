// ============================================================
// 📁 lib/assistant-planning/templates.ts
// ============================================================
// Templates de créneaux pré-configurés pour l'assistant
// ============================================================

import type { EmployeeRole } from '@/lib/mock-data'

// ============================================================
// Types
// ============================================================

export interface BesoinRole {
  role: EmployeeRole
  min: number
  max: number
}

export interface Creneau {
  id: string
  nom: string
  heureDebut: string  // Format "HH:MM"
  heureFin: string    // Format "HH:MM"
  joursAppliques: number[]  // 0=Lun, 1=Mar, ..., 6=Dim
  besoins: BesoinRole[]
}

export interface CreneauTemplate {
  id: string
  nom: string
  description: string
  icon: string
  creneaux: Omit<Creneau, 'id'>[]
}

// ============================================================
// Templates pré-configurés
// ============================================================

export const CRENEAUX_TEMPLATES: CreneauTemplate[] = [
  {
    id: 'standard',
    nom: 'Horaires standards',
    description: 'Matin (9h-13h) + Après-midi (14h-19h), Lun-Ven',
    icon: '🏪',
    creneaux: [
      {
        nom: 'Matin',
        heureDebut: '09:00',
        heureFin: '13:00',
        joursAppliques: [0, 1, 2, 3, 4], // Lun-Ven
        besoins: [
          { role: 'Pharmacien', min: 1, max: 2 },
          { role: 'Preparateur', min: 1, max: 3 },
        ]
      },
      {
        nom: 'Après-midi',
        heureDebut: '14:00',
        heureFin: '19:00',
        joursAppliques: [0, 1, 2, 3, 4], // Lun-Ven
        besoins: [
          { role: 'Pharmacien', min: 1, max: 2 },
          { role: 'Preparateur', min: 1, max: 3 },
        ]
      }
    ]
  },
  {
    id: 'standard-samedi',
    nom: 'Standards + Samedi',
    description: 'Matin + Après-midi, Lun-Sam (samedi matin uniquement)',
    icon: '📅',
    creneaux: [
      {
        nom: 'Matin',
        heureDebut: '09:00',
        heureFin: '13:00',
        joursAppliques: [0, 1, 2, 3, 4, 5], // Lun-Sam
        besoins: [
          { role: 'Pharmacien', min: 1, max: 2 },
          { role: 'Preparateur', min: 1, max: 3 },
        ]
      },
      {
        nom: 'Après-midi',
        heureDebut: '14:00',
        heureFin: '19:00',
        joursAppliques: [0, 1, 2, 3, 4], // Lun-Ven (pas samedi AM)
        besoins: [
          { role: 'Pharmacien', min: 1, max: 2 },
          { role: 'Preparateur', min: 1, max: 3 },
        ]
      }
    ]
  },
  {
    id: 'journee-continue',
    nom: 'Journée continue',
    description: 'Service continu 9h-19h sans pause méridienne',
    icon: '⏰',
    creneaux: [
      {
        nom: 'Journée',
        heureDebut: '09:00',
        heureFin: '19:00',
        joursAppliques: [0, 1, 2, 3, 4, 5], // Lun-Sam
        besoins: [
          { role: 'Pharmacien', min: 1, max: 2 },
          { role: 'Preparateur', min: 2, max: 4 },
        ]
      }
    ]
  },
  {
    id: 'garde',
    nom: 'Pharmacie de garde',
    description: 'Service 24h/24, 7j/7 avec rotations',
    icon: '🌙',
    creneaux: [
      {
        nom: 'Matin',
        heureDebut: '08:00',
        heureFin: '14:00',
        joursAppliques: [0, 1, 2, 3, 4, 5, 6], // Tous les jours
        besoins: [
          { role: 'Pharmacien', min: 1, max: 1 },
          { role: 'Preparateur', min: 1, max: 2 },
        ]
      },
      {
        nom: 'Après-midi',
        heureDebut: '14:00',
        heureFin: '20:00',
        joursAppliques: [0, 1, 2, 3, 4, 5, 6],
        besoins: [
          { role: 'Pharmacien', min: 1, max: 1 },
          { role: 'Preparateur', min: 1, max: 2 },
        ]
      },
      {
        nom: 'Nuit',
        heureDebut: '20:00',
        heureFin: '08:00',
        joursAppliques: [0, 1, 2, 3, 4, 5, 6],
        besoins: [
          { role: 'Pharmacien', min: 1, max: 1 },
        ]
      }
    ]
  },
  {
    id: 'custom',
    nom: 'Configuration personnalisée',
    description: 'Créez vos propres créneaux',
    icon: '✏️',
    creneaux: []
  }
]

// ============================================================
// Helpers
// ============================================================

/**
 * Génère un ID unique pour un créneau
 */
export const generateCreneauId = (): string => {
  return `creneau_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Crée un créneau vide avec des valeurs par défaut
 */
export const createEmptyCreneau = (): Creneau => ({
  id: generateCreneauId(),
  nom: 'Nouveau créneau',
  heureDebut: '09:00',
  heureFin: '17:00',
  joursAppliques: [0, 1, 2, 3, 4], // Lun-Ven par défaut
  besoins: [
    { role: 'Pharmacien', min: 1, max: 1 },
  ]
})

/**
 * Applique un template et génère les IDs
 */
export const applyTemplate = (templateId: string): Creneau[] => {
  const template = CRENEAUX_TEMPLATES.find(t => t.id === templateId)
  if (!template || template.id === 'custom') {
    return [createEmptyCreneau()]
  }

  return template.creneaux.map(c => ({
    ...c,
    id: generateCreneauId()
  }))
}

/**
 * Calcule la durée d'un créneau en heures
 */
export const getCreneauDuration = (creneau: Creneau): number => {
  const [startH, startM] = creneau.heureDebut.split(':').map(Number)
  const [endH, endM] = creneau.heureFin.split(':').map(Number)

  let startMinutes = startH * 60 + startM
  let endMinutes = endH * 60 + endM

  // Gestion du passage à minuit (ex: 20:00 -> 08:00)
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }

  return (endMinutes - startMinutes) / 60
}

/**
 * Formate une durée en heures lisible
 */
export const formatDuration = (hours: number): string => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h${m.toString().padStart(2, '0')}`
}

/**
 * Vérifie si un créneau est valide
 */
export const isCreneauValid = (creneau: Creneau): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!creneau.nom.trim()) {
    errors.push('Le nom du créneau est requis')
  }

  if (!creneau.heureDebut || !creneau.heureFin) {
    errors.push('Les horaires sont requis')
  }

  if (creneau.joursAppliques.length === 0) {
    errors.push('Sélectionnez au moins un jour')
  }

  const hasPharmacien = creneau.besoins.some(b => b.role === 'Pharmacien' && b.min > 0)
  if (!hasPharmacien) {
    errors.push('Un pharmacien est obligatoire (légal)')
  }

  creneau.besoins.forEach(b => {
    if (b.min > b.max) {
      errors.push(`${b.role}: min (${b.min}) > max (${b.max})`)
    }
  })

  return { valid: errors.length === 0, errors }
}

// ============================================================
// Constantes
// ============================================================

export const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
export const JOURS_SEMAINE_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export const ROLES_DISPONIBLES: EmployeeRole[] = [
  'Pharmacien',
  'Preparateur',
  'Apprenti',
  'Etudiant',
  'Conditionneur'
]
