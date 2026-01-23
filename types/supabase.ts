// ============================================================
// 📁 types/supabase.ts
// ============================================================
// Types TypeScript pour les tables Supabase
// Générés manuellement basés sur le schéma SQL
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      pharmacies: {
        Row: {
          id: string
          nom: string
          adresse: string | null
          telephone: string | null
          email: string | null
          siret: string | null
          horaires_ouverture: string | null
          horaires_fermeture: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nom: string
          adresse?: string | null
          telephone?: string | null
          email?: string | null
          siret?: string | null
          horaires_ouverture?: string | null
          horaires_fermeture?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nom?: string
          adresse?: string | null
          telephone?: string | null
          email?: string | null
          siret?: string | null
          horaires_ouverture?: string | null
          horaires_fermeture?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          pharmacy_id: string
          prenom: string
          nom: string | null
          initiales: string
          email: string | null
          telephone: string | null
          role: 'Pharmacien' | 'Preparateur' | 'Apprenti' | 'Etudiant' | 'Conditionneur'
          planning_type: 'fixe' | 'variable'
          actif: boolean
          date_embauche: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          prenom: string
          nom?: string | null
          initiales: string
          email?: string | null
          telephone?: string | null
          role: 'Pharmacien' | 'Preparateur' | 'Apprenti' | 'Etudiant' | 'Conditionneur'
          planning_type?: 'fixe' | 'variable'
          actif?: boolean
          date_embauche?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pharmacy_id?: string
          prenom?: string
          nom?: string | null
          initiales?: string
          email?: string | null
          telephone?: string | null
          role?: 'Pharmacien' | 'Preparateur' | 'Apprenti' | 'Etudiant' | 'Conditionneur'
          planning_type?: 'fixe' | 'variable'
          actif?: boolean
          date_embauche?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weekly_schedules: {
        Row: {
          id: string
          employee_id: string
          day_of_week: number
          start_time: string | null
          end_time: string | null
          pause_start: string | null
          pause_duration: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          day_of_week: number
          start_time?: string | null
          end_time?: string | null
          pause_start?: string | null
          pause_duration?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          day_of_week?: number
          start_time?: string | null
          end_time?: string | null
          pause_start?: string | null
          pause_duration?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      availabilities: {
        Row: {
          id: string
          employee_id: string
          week_start: string
          day_of_week: number
          start_time: string
          end_time: string
          submitted_at: string
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          week_start: string
          day_of_week: number
          start_time: string
          end_time: string
          submitted_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          week_start?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          submitted_at?: string
          created_at?: string
        }
      }
      requests: {
        Row: {
          id: string
          employee_id: string
          type: 'conge' | 'echange' | 'maladie'
          date: string
          start_time: string | null
          end_time: string | null
          is_full_day: boolean
          motif: string | null
          is_urgent: boolean
          exchange_with_id: string | null
          replacement_id: string | null
          status: 'pending' | 'approved' | 'refused'
          created_at: string
          processed_at: string | null
          processed_by: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          type: 'conge' | 'echange' | 'maladie'
          date: string
          start_time?: string | null
          end_time?: string | null
          is_full_day?: boolean
          motif?: string | null
          is_urgent?: boolean
          exchange_with_id?: string | null
          replacement_id?: string | null
          status?: 'pending' | 'approved' | 'refused'
          created_at?: string
          processed_at?: string | null
          processed_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          type?: 'conge' | 'echange' | 'maladie'
          date?: string
          start_time?: string | null
          end_time?: string | null
          is_full_day?: boolean
          motif?: string | null
          is_urgent?: boolean
          exchange_with_id?: string | null
          replacement_id?: string | null
          status?: 'pending' | 'approved' | 'refused'
          created_at?: string
          processed_at?: string | null
          processed_by?: string | null
        }
      }
      schedule_entries: {
        Row: {
          id: string
          employee_id: string
          date: string
          start_time: string
          end_time: string
          pause_start: string | null
          pause_duration: number | null
          is_published: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          date: string
          start_time: string
          end_time: string
          pause_start?: string | null
          pause_duration?: number | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          date?: string
          start_time?: string
          end_time?: string
          pause_start?: string | null
          pause_duration?: number | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      gardes: {
        Row: {
          id: string
          type: 'soir' | 'nuit' | 'dimanche'
          date: string
          start_time: string
          end_time: string
          pharmacien_id: string | null
          accompagnant_id: string | null
          status: 'a_assigner' | 'assignee' | 'validee'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'soir' | 'nuit' | 'dimanche'
          date: string
          start_time: string
          end_time: string
          pharmacien_id?: string | null
          accompagnant_id?: string | null
          status?: 'a_assigner' | 'assignee' | 'validee'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'soir' | 'nuit' | 'dimanche'
          date?: string
          start_time?: string
          end_time?: string
          pharmacien_id?: string | null
          accompagnant_id?: string | null
          status?: 'a_assigner' | 'assignee' | 'validee'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Types utilitaires pour faciliter l'utilisation
export type Pharmacy = Database['public']['Tables']['pharmacies']['Row']
export type Employee = Database['public']['Tables']['employees']['Row']
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert']
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update']
export type WeeklySchedule = Database['public']['Tables']['weekly_schedules']['Row']
export type Availability = Database['public']['Tables']['availabilities']['Row']
export type Request = Database['public']['Tables']['requests']['Row']
export type ScheduleEntry = Database['public']['Tables']['schedule_entries']['Row']
export type Garde = Database['public']['Tables']['gardes']['Row']

// Types pour les rôles
export type EmployeeRole = 'Pharmacien' | 'Preparateur' | 'Apprenti' | 'Etudiant' | 'Conditionneur'
export type PlanningType = 'fixe' | 'variable'
export type RequestType = 'conge' | 'echange' | 'maladie'
export type RequestStatus = 'pending' | 'approved' | 'refused'
export type GardeType = 'soir' | 'nuit' | 'dimanche'
export type GardeStatus = 'a_assigner' | 'assignee' | 'validee'
