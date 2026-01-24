// ============================================================
// 📁 lib/api/requests.ts
// ============================================================
// Fonctions API pour gérer les demandes
// Version finale - sans erreur TypeScript
// ============================================================

import { createClient } from '@/utils/supabase/client'

// ============================================================
// TYPES LOCAUX (alignés avec le schéma SQL)
// ============================================================

export type RequestType = 'conge' | 'echange' | 'maladie'
export type RequestStatus = 'pending' | 'approved' | 'refused'

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

export interface RequestWithEmployee extends Request {
  employee: {
    id: string
    prenom: string
    nom: string | null
    initiales: string
    role: string
  } | null
  exchange_with?: {
    id: string
    prenom: string
    nom: string | null
  } | null
  replacement?: {
    id: string
    prenom: string
    nom: string | null
  } | null
}

// ============================================================
// LECTURE
// ============================================================

/**
 * Récupérer toutes les demandes en attente
 */
export async function getPendingRequests(): Promise<RequestWithEmployee[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('requests')
    .select(
      `
      *,
      employee:employees!requests_employee_id_fkey(id, prenom, nom, initiales, role),
      exchange_with:employees!requests_exchange_with_id_fkey(id, prenom, nom),
      replacement:employees!requests_replacement_id_fkey(id, prenom, nom)
    `
    )
    .eq('status', 'pending')
    .order('is_urgent', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erreur getPendingRequests:', error)
    throw new Error(error.message)
  }

  return (data ?? []) as RequestWithEmployee[]
}

/**
 * Récupérer toutes les demandes (tous statuts)
 */
export async function getAllRequests(): Promise<RequestWithEmployee[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('requests')
    .select(
      `
      *,
      employee:employees!requests_employee_id_fkey(id, prenom, nom, initiales, role),
      exchange_with:employees!requests_exchange_with_id_fkey(id, prenom, nom),
      replacement:employees!requests_replacement_id_fkey(id, prenom, nom)
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur getAllRequests:', error)
    throw new Error(error.message)
  }

  return (data ?? []) as RequestWithEmployee[]
}

/**
 * Récupérer une demande par ID
 */
export async function getRequestById(
  id: string
): Promise<RequestWithEmployee | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('requests')
    .select(
      `
      *,
      employee:employees!requests_employee_id_fkey(id, prenom, nom, initiales, role),
      exchange_with:employees!requests_exchange_with_id_fkey(id, prenom, nom),
      replacement:employees!requests_replacement_id_fkey(id, prenom, nom)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erreur getRequestById:', error)
    return null
  }

  return data as RequestWithEmployee
}

/**
 * Récupérer les demandes d'un employé
 */
export async function getEmployeeRequests(employeeId: string): Promise<Request[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur getEmployeeRequests:', error)
    throw new Error(error.message)
  }

  return (data ?? []) as Request[]
}

/**
 * Compter les demandes en attente
 */
export async function countPendingRequests(): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (error) {
    console.error('Erreur countPendingRequests:', error)
    throw new Error(error.message)
  }

  return count ?? 0
}

// ============================================================
// CRÉATION
// ============================================================

/**
 * Créer une nouvelle demande
 */
export async function createRequest(request: {
  employee_id: string
  type: RequestType
  date: string
  start_time?: string
  end_time?: string
  is_full_day?: boolean
  motif?: string
  is_urgent?: boolean
  exchange_with_id?: string
}): Promise<Request> {
  const supabase = createClient()

  // Construire l'objet sans typage strict
  const insertData: Record<string, unknown> = {
    employee_id: request.employee_id,
    type: request.type,
    date: request.date,
    start_time: request.start_time ?? null,
    end_time: request.end_time ?? null,
    is_full_day: request.is_full_day ?? false,
    motif: request.motif ?? null,
    is_urgent: request.is_urgent ?? false,
    exchange_with_id: request.exchange_with_id ?? null,
    status: 'pending',
  }

  const { data, error } = await supabase
    .from('requests')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Erreur createRequest:', error)
    throw new Error(error.message)
  }

  return data as Request
}

// ============================================================
// MISE À JOUR
// ============================================================

/**
 * Approuver une demande
 */
export async function approveRequest(
  id: string,
  replacementId?: string
): Promise<Request> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    status: 'approved',
    replacement_id: replacementId ?? null,
    processed_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('requests')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erreur approveRequest:', error)
    throw new Error(error.message)
  }

  return data as Request
}

/**
 * Refuser une demande
 */
export async function refuseRequest(id: string): Promise<Request> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    status: 'refused',
    processed_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('requests')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erreur refuseRequest:', error)
    throw new Error(error.message)
  }

  return data as Request
}

/**
 * Assigner un remplaçant
 */
export async function assignReplacement(
  requestId: string,
  replacementId: string
): Promise<Request> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    replacement_id: replacementId,
  }

  const { data, error } = await supabase
    .from('requests')
    .update(updateData)
    .eq('id', requestId)
    .select()
    .single()

  if (error) {
    console.error('Erreur assignReplacement:', error)
    throw new Error(error.message)
  }

  return data as Request
}

// ============================================================
// SUPPRESSION
// ============================================================

/**
 * Supprimer une demande
 */
export async function deleteRequest(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('requests').delete().eq('id', id)

  if (error) {
    console.error('Erreur deleteRequest:', error)
    throw new Error(error.message)
  }
}

// ============================================================
// UTILITAIRES
// ============================================================

/**
 * Obtenir le libellé français pour un type de demande
 */
export function getRequestTypeLabel(type: RequestType): string {
  const labels: Record<RequestType, string> = {
    conge: 'Congé',
    echange: 'Échange',
    maladie: 'Maladie',
  }
  return labels[type] ?? type
}

/**
 * Obtenir l'emoji pour un type de demande
 */
export function getRequestTypeIcon(type: RequestType): string {
  const icons: Record<RequestType, string> = {
    conge: '🏖️',
    echange: '🔄',
    maladie: '🏥',
  }
  return icons[type] ?? '📋'
}

/**
 * Obtenir la couleur pour un type de demande
 */
export function getRequestTypeColor(type: RequestType): string {
  const colors: Record<RequestType, string> = {
    conge: '#3b82f6',
    echange: '#8b5cf6',
    maladie: '#ef4444',
  }
  return colors[type] ?? '#64748b'
}

/**
 * Obtenir le libellé français pour un statut
 */
export function getRequestStatusLabel(status: RequestStatus): string {
  const labels: Record<RequestStatus, string> = {
    pending: 'En attente',
    approved: 'Approuvée',
    refused: 'Refusée',
  }
  return labels[status] ?? status
}