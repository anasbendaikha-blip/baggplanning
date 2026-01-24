// ============================================================
// 📁 types/database.ts
// ============================================================
// Types "legacy" utilisés par certaines pages (employe/titulaire)
// pour éviter de casser l'app pendant la migration Supabase.
//
// ⚠️ Ces types sont temporaires et seront progressivement
// remplacés par les types de types/supabase.ts
// ============================================================

// ============================================================
// ENUMS / TYPES DE BASE
// ============================================================

export type Role =
  | 'Pharmacien'
  | 'Preparateur'
  | 'Apprenti'
  | 'Etudiant'
  | 'Conditionneur'

export type UserType = 'titulaire' | 'employe'

export type DemandeType = 'conge' | 'echange' | 'maladie' | 'autre'
export type DemandeStatus = 'en_attente' | 'approuve' | 'refuse'

export type PlanningType = 'fixe' | 'variable'

// ============================================================
// INTERFACES PRINCIPALES
// ============================================================

export interface Employee {
  id: number | string
  pharmacy_id?: string
  prenom: string
  nom: string
  initiales?: string
  email: string
  tel?: string
  telephone?: string
  role: Role
  planning_type?: PlanningType
  actif?: boolean
  user_id?: string
  date_embauche?: string
  created_at?: string
  updated_at?: string
}

export interface Disponibilite {
  id: number | string
  employee_id: number | string
  semaine_debut: string
  // Lundi
  lundi_debut?: string
  lundi_fin?: string
  lundi_disponible: boolean
  // Mardi
  mardi_debut?: string
  mardi_fin?: string
  mardi_disponible: boolean
  // Mercredi
  mercredi_debut?: string
  mercredi_fin?: string
  mercredi_disponible: boolean
  // Jeudi
  jeudi_debut?: string
  jeudi_fin?: string
  jeudi_disponible: boolean
  // Vendredi
  vendredi_debut?: string
  vendredi_fin?: string
  vendredi_disponible: boolean
  // Samedi
  samedi_debut?: string
  samedi_fin?: string
  samedi_disponible: boolean
  // Métadonnées
  created_at?: string
  updated_at?: string
  // Relations
  employees?: Employee
}

export interface Planning {
  id: number | string
  employee_id: number | string
  date: string
  debut: string
  fin: string
  pause_debut?: string
  pause_duree?: number
  valide: boolean
  is_published?: boolean
  created_at?: string
  updated_at?: string
  created_by?: string
  // Relations
  employees?: Employee
}

export interface Demande {
  id: number | string
  employee_id: number | string
  type: DemandeType
  date_debut: string
  date_fin: string
  date?: string
  creneau: 'journee' | 'matin' | 'apres-midi'
  start_time?: string
  end_time?: string
  is_full_day?: boolean
  motif: string
  status: DemandeStatus
  urgent: boolean
  is_urgent?: boolean
  remplacant_id?: number | string
  replacement_id?: string
  exchange_with_id?: string
  processed_at?: string
  processed_by?: string
  created_at?: string
  updated_at?: string
  // Relations
  employees?: Employee
}

export interface AppUser {
  id: string
  email: string
  user_type: UserType
  employee_id?: number | string
}

// ============================================================
// TYPES POUR DISPONIBILITÉS (nouveau format)
// ============================================================

export interface Availability {
  id: string
  employee_id: string
  week_start: string
  day_of_week: number
  start_time: string
  end_time: string
  submitted_at?: string
  created_at?: string
}

// ============================================================
// TYPES POUR PLANNING (nouveau format)
// ============================================================

export interface ScheduleEntry {
  id: string
  employee_id: string
  date: string
  start_time: string
  end_time: string
  pause_start?: string
  pause_duration?: number
  is_published: boolean
  created_at?: string
  updated_at?: string
  created_by?: string
}

// ============================================================
// TYPES POUR DEMANDES (nouveau format)
// ============================================================

export interface Request {
  id: string
  employee_id: string
  type: 'conge' | 'echange' | 'maladie'
  date: string
  start_time?: string
  end_time?: string
  is_full_day: boolean
  motif?: string
  is_urgent: boolean
  exchange_with_id?: string
  replacement_id?: string
  status: 'pending' | 'approved' | 'refused'
  created_at?: string
  processed_at?: string
  processed_by?: string
}

// ============================================================
// TYPES POUR GARDES
// ============================================================

export interface Garde {
  id: string
  type: 'soir' | 'nuit' | 'dimanche'
  date: string
  start_time: string
  end_time: string
  pharmacien_id?: string
  accompagnant_id?: string
  status: 'a_assigner' | 'assignee' | 'validee'
  created_at?: string
  updated_at?: string
}

// ============================================================
// ALIAS POUR COMPATIBILITÉ
// ============================================================

// Ces alias permettent d'utiliser les anciens noms de types
export type EmployeeRole = Role
export type RequestType = DemandeType
export type RequestStatus = 'pending' | 'approved' | 'refused'