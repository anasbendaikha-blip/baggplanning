// ============================================================
// 📁 lib/api/employees.ts
// ============================================================
// Fonctions API pour gérer les employés
// Version sans typage strict - compatible avec client non typé
// ============================================================

import { createClient } from '@/utils/supabase/client'

// ============================================================
// TYPES LOCAUX
// ============================================================

export type EmployeeRole =
  | 'Pharmacien'
  | 'Preparateur'
  | 'Apprenti'
  | 'Etudiant'
  | 'Conditionneur'

export type PlanningType = 'fixe' | 'variable'

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
  date_embauche: string | null
  created_at: string | null
  updated_at: string | null
}

// ID de la pharmacie par défaut (pour le dev)
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

  return (data ?? []) as Employee[]
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

  return (data ?? []) as Employee[]
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

  return data as Employee
}

/**
 * Récupérer les étudiants (raccourci)
 */
export async function getEtudiants(): Promise<Employee[]> {
  return getEmployeesByRole('Etudiant')
}

/**
 * Récupérer les pharmaciens (raccourci)
 */
export async function getPharmaciens(): Promise<Employee[]> {
  return getEmployeesByRole('Pharmacien')
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

  data?.forEach((emp: { role: string }) => {
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
export async function createEmployee(employee: {
  prenom: string
  nom?: string
  initiales: string
  email?: string
  telephone?: string
  role: EmployeeRole
  planning_type?: PlanningType
  date_embauche?: string
}): Promise<Employee> {
  const supabase = createClient()

  const insertData: Record<string, unknown> = {
    pharmacy_id: DEFAULT_PHARMACY_ID,
    prenom: employee.prenom,
    nom: employee.nom ?? null,
    initiales: employee.initiales,
    email: employee.email ?? null,
    telephone: employee.telephone ?? null,
    role: employee.role,
    planning_type: employee.planning_type ?? 'variable',
    actif: true,
    date_embauche: employee.date_embauche ?? null,
  }

  const { data, error } = await supabase
    .from('employees')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Erreur createEmployee:', error)
    throw new Error(error.message)
  }

  return data as Employee
}

// ============================================================
// MISE À JOUR
// ============================================================

/**
 * Modifier un employé
 */
export async function updateEmployee(
  id: string,
  updates: {
    prenom?: string
    nom?: string | null
    initiales?: string
    email?: string | null
    telephone?: string | null
    role?: EmployeeRole
    planning_type?: PlanningType
    actif?: boolean
    date_embauche?: string | null
  }
): Promise<Employee> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {}
  
  if (updates.prenom !== undefined) updateData.prenom = updates.prenom
  if (updates.nom !== undefined) updateData.nom = updates.nom
  if (updates.initiales !== undefined) updateData.initiales = updates.initiales
  if (updates.email !== undefined) updateData.email = updates.email
  if (updates.telephone !== undefined) updateData.telephone = updates.telephone
  if (updates.role !== undefined) updateData.role = updates.role
  if (updates.planning_type !== undefined) updateData.planning_type = updates.planning_type
  if (updates.actif !== undefined) updateData.actif = updates.actif
  if (updates.date_embauche !== undefined) updateData.date_embauche = updates.date_embauche

  const { data, error } = await supabase
    .from('employees')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erreur updateEmployee:', error)
    throw new Error(error.message)
  }

  return data as Employee
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
    Pharmacien: '#10b981',
    Preparateur: '#3b82f6',
    Apprenti: '#8b5cf6',
    Etudiant: '#f59e0b',
    Conditionneur: '#6366f1',
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

/**
 * Obtenir le libellé français pour un rôle
 */
export function getRoleLabel(role: EmployeeRole): string {
  const labels: Record<EmployeeRole, string> = {
    Pharmacien: 'Pharmacien',
    Preparateur: 'Préparateur',
    Apprenti: 'Apprenti',
    Etudiant: 'Étudiant',
    Conditionneur: 'Conditionneur',
  }
  return labels[role] || role
}