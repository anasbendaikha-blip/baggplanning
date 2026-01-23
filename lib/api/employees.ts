// ============================================================
// 📁 lib/api/employees.ts
// ============================================================
// Fonctions API pour gérer les employés
// À utiliser dans les composants et Server Actions
// ============================================================

import { createClient } from '@/utils/supabase/client'
import { Employee, EmployeeInsert, EmployeeUpdate, EmployeeRole } from '@/types/supabase'

// ID de la pharmacie par défaut (à remplacer par la vraie logique multi-tenant)
const DEFAULT_PHARMACY_ID = '00000000-0000-0000-0000-000000000001'

// ============================================================
// LECTURE
// ============================================================

/**
 * Récupérer tous les employés actifs
 */
export async function getEmployees(): Promise<Employee[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('actif', true)
    .eq('pharmacy_id', DEFAULT_PHARMACY_ID)
    .order('role')
    .order('prenom')
  
  if (error) {
    console.error('Erreur getEmployees:', error)
    throw new Error(error.message)
  }
  
  return data || []
}

/**
 * Récupérer les employés par rôle
 */
export async function getEmployeesByRole(role: EmployeeRole): Promise<Employee[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('role', role)
    .eq('actif', true)
    .eq('pharmacy_id', DEFAULT_PHARMACY_ID)
    .order('prenom')
  
  if (error) {
    console.error('Erreur getEmployeesByRole:', error)
    throw new Error(error.message)
  }
  
  return data || []
}

/**
 * Récupérer un employé par ID
 */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Erreur getEmployeeById:', error)
    return null
  }
  
  return data
}

/**
 * Récupérer les étudiants (planning variable)
 */
export async function getEtudiants(): Promise<Employee[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('role', 'Etudiant')
    .eq('actif', true)
    .eq('pharmacy_id', DEFAULT_PHARMACY_ID)
    .order('prenom')
  
  if (error) {
    console.error('Erreur getEtudiants:', error)
    throw new Error(error.message)
  }
  
  return data || []
}

/**
 * Compter les employés par rôle
 */
export async function countEmployeesByRole(): Promise<Record<EmployeeRole, number>> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select('role')
    .eq('actif', true)
    .eq('pharmacy_id', DEFAULT_PHARMACY_ID)
  
  if (error) {
    console.error('Erreur countEmployeesByRole:', error)
    throw new Error(error.message)
  }
  
  const counts: Record<EmployeeRole, number> = {
    Pharmacien: 0,
    Preparateur: 0,
    Apprenti: 0,
    Etudiant: 0,
    Conditionneur: 0,
  }
  
  data?.forEach(emp => {
    if (emp.role in counts) {
      counts[emp.role as EmployeeRole]++
    }
  })
  
  return counts
}

// ============================================================
// CRÉATION
// ============================================================

/**
 * Ajouter un nouvel employé
 */
export async function createEmployee(employee: Omit<EmployeeInsert, 'pharmacy_id'>): Promise<Employee> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .insert({
      ...employee,
      pharmacy_id: DEFAULT_PHARMACY_ID,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Erreur createEmployee:', error)
    throw new Error(error.message)
  }
  
  return data
}

// ============================================================
// MISE À JOUR
// ============================================================

/**
 * Modifier un employé
 */
export async function updateEmployee(id: string, updates: EmployeeUpdate): Promise<Employee> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Erreur updateEmployee:', error)
    throw new Error(error.message)
  }
  
  return data
}

// ============================================================
// SUPPRESSION
// ============================================================

/**
 * Désactiver un employé (soft delete)
 */
export async function deactivateEmployee(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('employees')
    .update({ actif: false })
    .eq('id', id)
  
  if (error) {
    console.error('Erreur deactivateEmployee:', error)
    throw new Error(error.message)
  }
}

/**
 * Supprimer définitivement un employé (hard delete)
 */
export async function deleteEmployee(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Erreur deleteEmployee:', error)
    throw new Error(error.message)
  }
}

// ============================================================
// UTILITAIRES
// ============================================================

/**
 * Générer les initiales à partir du prénom et nom
 */
export function generateInitiales(prenom: string, nom?: string | null): string {
  if (nom) {
    return (prenom[0] + nom[0]).toUpperCase()
  }
  return prenom.substring(0, 2).toUpperCase()
}

/**
 * Obtenir la couleur CSS pour un rôle
 */
export function getRoleColor(role: EmployeeRole): string {
  const colors: Record<EmployeeRole, string> = {
    Pharmacien: '#10b981',    // Vert
    Preparateur: '#3b82f6',   // Bleu
    Apprenti: '#8b5cf6',      // Violet
    Etudiant: '#f59e0b',      // Orange
    Conditionneur: '#6366f1', // Indigo
  }
  return colors[role] || '#64748b'
}

/**
 * Obtenir l'icône emoji pour un rôle
 */
export function getRoleIcon(role: EmployeeRole): string {
  const icons: Record<EmployeeRole, string> = {
    Pharmacien: '💊',
    Preparateur: '💉',
    Apprenti: '📚',
    Etudiant: '🎓',
    Conditionneur: '📦',
  }
  return icons[role] || '👤'
}
