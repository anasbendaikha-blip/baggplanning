// ============================================================
// types/supabase.ts
// Types alignés avec le schéma SQL actuel (pharmacies/employees/...)
// ============================================================

export type EmployeeRole =
  | 'Pharmacien'
  | 'Preparateur'
  | 'Apprenti'
  | 'Etudiant'
  | 'Conditionneur'

export type PlanningType = 'fixe' | 'variable'

export type RequestType = 'conge' | 'echange' | 'maladie' | 'autre'
export type RequestStatus = 'pending' | 'approved' | 'refused'

export type GardeType = 'soir' | 'nuit' | 'dimanche'
export type GardeStatus = 'a_assigner' | 'assignee' | 'validee'

// =======================
// Row types (DB tables)
// =======================

export interface Pharmacy {
  id: string
  nom: string
  adresse: string | null
  telephone: string | null
  email: string | null
  siret: string | null
  horaires_ouverture: string | null // TIME -> string
  horaires_fermeture: string | null // TIME -> string
  created_at: string | null
  updated_at: string | null
}

export interface Employee {
  id: string
  pharmacy_id: string
  prenom: string
  nom: string | null
  initiales: string
  email: string | null
  telephone: string | null
  role: EmployeeRole
  planning_type: PlanningType
  actif: boolean
  date_embauche: string | null // DATE -> string
  created_at: string | null
  updated_at: string | null
}

export type EmployeeInsert = Omit<Employee, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type EmployeeUpdate = Partial<EmployeeInsert>

export interface Availability {
  id: string
  employee_id: string
  week_start: string // DATE -> string
  day_of_week: number
  start_time: string // TIME -> string
  end_time: string // TIME -> string
  submitted_at: string | null
  created_at: string | null
}

export type AvailabilityInsert = Omit<Availability, 'id' | 'submitted_at' | 'created_at'> & {
  id?: string
  submitted_at?: string
  created_at?: string
}

export interface WeeklySchedule {
  id: string
  employee_id: string
  day_of_week: number
  start_time: string | null
  end_time: string | null
  pause_start: string | null
  pause_duration: number | null
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export interface ScheduleEntry {
  id: string
  employee_id: string
  date: string // DATE -> string
  start_time: string
  end_time: string
  pause_start: string | null
  pause_duration: number | null
  is_published: boolean
  created_at: string | null
  updated_at: string | null
  created_by: string | null
}

export interface Request {
  id: string
  employee_id: string
  type: RequestType
  date: string
  start_time: string | null
  end_time: string | null
  is_full_day: boolean
  motif: string | null
  is_urgent: boolean
  exchange_with_id: string | null
  replacement_id: string | null
  status: RequestStatus
  created_at: string | null
  processed_at: string | null
  processed_by: string | null
}

export interface Garde {
  id: string
  type: GardeType
  date: string
  start_time: string
  end_time: string
  pharmacien_id: string | null
  accompagnant_id: string | null
  status: GardeStatus
  created_at: string | null
  updated_at: string | null
}

// =======================
// Database type for Supabase client typing
// =======================

export type Database = {
  public: {
    Tables: {
      pharmacies: {
        Row: Pharmacy
        Insert: Omit<Pharmacy, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Pharmacy>
        Relationships: []
      }
      employees: {
        Row: Employee
        Insert: EmployeeInsert
        Update: EmployeeUpdate
        Relationships: []
      }
      availabilities: {
        Row: Availability
        Insert: AvailabilityInsert
        Update: Partial<AvailabilityInsert>
        Relationships: []
      }
      weekly_schedules: {
        Row: WeeklySchedule
        Insert: Partial<WeeklySchedule>
        Update: Partial<WeeklySchedule>
        Relationships: []
      }
      schedule_entries: {
        Row: ScheduleEntry
        Insert: Partial<ScheduleEntry>
        Update: Partial<ScheduleEntry>
        Relationships: []
      }
      requests: {
        Row: Request
        Insert: Partial<Request>
        Update: Partial<Request>
        Relationships: []
      }
      gardes: {
        Row: Garde
        Insert: Partial<Garde>
        Update: Partial<Garde>
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}