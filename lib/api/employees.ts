// ============================================================
// 📁 types/supabase.ts
// ============================================================
// Types alignés avec ton SQL (UUID, pharmacy_id, actif, etc.)
// ============================================================

export type EmployeeRole =
  | 'Pharmacien'
  | 'Preparateur'
  | 'Apprenti'
  | 'Etudiant'
  | 'Conditionneur'

export type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          pharmacy_id: string
          prenom: string
          nom: string | null
          initiales: string
          email: string | null
          telephone: string | null
          role: EmployeeRole
          planning_type: 'fixe' | 'variable'
          actif: boolean
          date_embauche: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          pharmacy_id: string
          prenom: string
          nom?: string | null
          initiales: string
          email?: string | null
          telephone?: string | null
          role: EmployeeRole
          planning_type?: 'fixe' | 'variable'
          actif?: boolean
          date_embauche?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          pharmacy_id?: string
          prenom?: string
          nom?: string | null
          initiales?: string
          email?: string | null
          telephone?: string | null
          role?: EmployeeRole
          planning_type?: 'fixe' | 'variable'
          actif?: boolean
          date_embauche?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      availabilities: {
        Row: {
          id: string
          employee_id: string
          week_start: string
          day_of_week: number
          start_time: string
          end_time: string
          submitted_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          week_start: string
          day_of_week: number
          start_time: string
          end_time: string
          submitted_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          week_start?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          submitted_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

// Helpers pratiques (comme les types générés Supabase)
export type Employee = Database['public']['Tables']['employees']['Row']
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert']
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update']

export type Availability = Database['public']['Tables']['availabilities']['Row']
export type AvailabilityInsert = Database['public']['Tables']['availabilities']['Insert']
export type AvailabilityUpdate = Database['public']['Tables']['availabilities']['Update']