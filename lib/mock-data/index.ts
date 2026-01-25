// ============================================================
// 📁 lib/mock-data/index.ts
// ============================================================
// Données réelles de la Pharmacie - Titulaire : Isabelle MAURER
// Semaine de référence : Lundi 26 janvier 2026 → Samedi 31 janvier 2026
// 
// UTILISATION :
// import { MOCK_EMPLOYEES, getPlanningForDay, ... } from '@/lib/mock-data'
// ============================================================

// ============================================================
// 🎨 TYPES
// ============================================================

export type EmployeeRole = 'Pharmacien' | 'Preparateur' | 'Apprenti' | 'Etudiant' | 'Conditionneur'
export type PlanningType = 'fixe' | 'variable'

export interface MockEmployee {
  id: string
  prenom: string
  nom?: string
  initiales: string
  fonction: EmployeeRole
  typeEDT: PlanningType
  actif: boolean
  horaires: {
    lundi: string
    mardi: string
    mercredi: string
    jeudi: string
    vendredi: string
    samedi: string
  }
}

export interface MockDisponibilite {
  employee_id: string
  employee_name: string
  initiales: string
  lundi: string | null
  mardi: string | null
  mercredi: string | null
  jeudi: string | null
  vendredi: string | null
  samedi: string | null
  has_submitted: boolean
}

export interface MockDemande {
  id: string
  employee_id: string
  employee_name: string
  employee_initiales: string
  type: 'conge' | 'echange' | 'maladie'
  date: string
  creneau: string
  motif: string
  urgent: boolean
  status: 'pending' | 'approved' | 'refused'
  created_at: string
}

export interface MockPlanningEntry {
  employee_id: string
  employee_name: string
  employee_initiales: string
  role: EmployeeRole
  start_time: string
  end_time: string
  pause_start?: string
  pause_duration?: number
  is_conge?: boolean
}

export interface MockGarde {
  id: string
  type: 'soir' | 'nuit' | 'dimanche'
  date: string
  pharmacien_name: string
  accompagnant_name?: string
  status: 'a_assigner' | 'assignee' | 'validee'
}

// ============================================================
// 👥 EMPLOYÉS - DONNÉES RÉELLES
// ============================================================

export const MOCK_EMPLOYEES: MockEmployee[] = [
  // ============================================
  // 💊 PHARMACIENS (8 dont 1 titulaire)
  // ============================================
  {
    id: 'p1',
    prenom: 'Isabelle',
    nom: 'MAURER',
    initiales: 'IM',
    fonction: 'Pharmacien',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: 'variable', mardi: 'variable', mercredi: 'variable', jeudi: 'variable', vendredi: 'variable', samedi: 'variable' }
  },
  {
    id: 'p2',
    prenom: 'Lina',
    initiales: 'LI',
    fonction: 'Pharmacien',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: 'non', mardi: '08:30-14:30', mercredi: 'non', jeudi: '08:30-20:30', vendredi: 'non', samedi: 'non' }
  },
  {
    id: 'p3',
    prenom: 'Laura',
    initiales: 'LA',
    fonction: 'Pharmacien',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: '14:00-20:30', mardi: 'non', mercredi: 'non', jeudi: '08:30-14:00', vendredi: '08:30-14:00', samedi: 'non' }
  },
  {
    id: 'p4',
    prenom: 'Maryam',
    initiales: 'MA',
    fonction: 'Pharmacien',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: '08:30-14:00', mardi: '08:30-14:00', mercredi: 'non', jeudi: '08:30-20:30', vendredi: '14:00-20:30', samedi: '08:30-14:00' }
  },
  {
    id: 'p5',
    prenom: 'Rémy',
    initiales: 'RE',
    fonction: 'Pharmacien',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: '14:00-20:30', mardi: '14:00-20:30', mercredi: 'non', jeudi: 'non', vendredi: '08:30-20:30', samedi: '14:00-20:30' }
  },
  {
    id: 'p6',
    prenom: 'Raafa',
    initiales: 'RA',
    fonction: 'Pharmacien',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: 'congé', mardi: 'congé', mercredi: 'congé', jeudi: 'congé', vendredi: 'congé', samedi: 'congé' }
  },
  {
    id: 'p7',
    prenom: 'Sarah',
    initiales: 'SA',
    fonction: 'Pharmacien',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: '08:30-14:00', mardi: '14:00-20:30', mercredi: '08:30-20:30', jeudi: 'non', vendredi: '14:00-20:30', samedi: '14:00-20:30' }
  },
  {
    id: 'p8',
    prenom: 'Aurélien',
    initiales: 'AU',
    fonction: 'Pharmacien',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: '14:00-20:30', mardi: '08:30-14:00', mercredi: '08:30-20:30', jeudi: 'non', vendredi: '08:30-14:00', samedi: '08:30-14:00' }
  },

  // ============================================
  // 💉 PRÉPARATEURS (6)
  // ============================================
  {
    id: 'pr1',
    prenom: 'Sylvie',
    initiales: 'SY',
    fonction: 'Preparateur',
    typeEDT: 'variable',
    actif: true,
    horaires: { lundi: 'variable', mardi: 'variable', mercredi: 'variable', jeudi: 'variable', vendredi: 'variable', samedi: 'variable' }
  },
  {
    id: 'pr2',
    prenom: 'Dilek',
    initiales: 'DI',
    fonction: 'Preparateur',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: '08:30-14:00', mardi: 'non', mercredi: '08:30-19:30', jeudi: '13:30-19:30', vendredi: '08:30-14:00', samedi: '09:00-14:00' }
  },
  {
    id: 'pr3',
    prenom: 'Leila',
    initiales: 'LE',
    fonction: 'Preparateur',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: '08:30-14:00', mardi: '14:00-20:00', mercredi: 'non', jeudi: '08:30-14:00', vendredi: '14:00-20:00', samedi: '09:00-14:00' }
  },
  {
    id: 'pr4',
    prenom: 'Ludovic',
    initiales: 'LU',
    fonction: 'Preparateur',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: '08:30-14:00', mardi: '14:00-20:30', mercredi: '08:30-14:00', jeudi: 'non', vendredi: '10:00-20:30', samedi: '14:00-20:00' }
  },
  {
    id: 'pr5',
    prenom: 'Hamide',
    initiales: 'HA',
    fonction: 'Preparateur',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: '08:30-20:30', mardi: '08:30-14:00', mercredi: '14:00-20:30', jeudi: '08:30-20:30', vendredi: '08:30-20:30', samedi: '09:00-14:00' }
  },
  {
    id: 'pr6',
    prenom: 'Safia',
    initiales: 'SF',
    fonction: 'Preparateur',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: '10:00-20:30', mardi: '14:00-20:30', mercredi: '08:30-14:00', jeudi: 'non', vendredi: '14:00-20:30', samedi: '14:00-20:00' }
  },

  // ============================================
  // 📚 APPRENTIS (2)
  // ============================================
  {
    id: 'a1',
    prenom: 'Rovena',
    initiales: 'RV',
    fonction: 'Apprenti',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: 'non', mardi: '09:30-20:00', mercredi: '08:30-14:00', jeudi: 'non', vendredi: 'non', samedi: '08:30-14:00' }
  },
  {
    id: 'a2',
    prenom: 'Manon',
    initiales: 'MN',
    fonction: 'Apprenti',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: 'non', mardi: 'non', mercredi: '08:30-16:00', jeudi: '08:30-16:00', vendredi: '08:30-16:00', samedi: 'non' }
  },

  // ============================================
  // 🎓 ÉTUDIANTS (9) - Tous variables
  // ============================================
  {
    id: 'e1',
    prenom: 'Celya',
    initiales: 'CE',
    fonction: 'Etudiant',
    typeEDT: 'variable',
    actif: true,
    horaires: { lundi: 'variable', mardi: 'variable', mercredi: 'variable', jeudi: 'variable', vendredi: 'variable', samedi: 'variable' }
  },
  {
    id: 'e2',
    prenom: 'Anas',
    initiales: 'AN',
    fonction: 'Etudiant',
    typeEDT: 'variable',
    actif: true,
    horaires: { lundi: 'variable', mardi: 'variable', mercredi: 'variable', jeudi: 'variable', vendredi: 'variable', samedi: 'variable' }
  },
  {
    id: 'e3',
    prenom: 'Jean-Baptiste',
    initiales: 'JB',
    fonction: 'Etudiant',
    typeEDT: 'variable',
    actif: true,
    horaires: { lundi: 'variable', mardi: 'variable', mercredi: 'variable', jeudi: 'variable', vendredi: 'variable', samedi: 'variable' }
  },
  {
    id: 'e4',
    prenom: 'Eloise',
    initiales: 'EL',
    fonction: 'Etudiant',
    typeEDT: 'variable',
    actif: true,
    horaires: { lundi: 'variable', mardi: 'variable', mercredi: 'variable', jeudi: 'variable', vendredi: 'variable', samedi: 'variable' }
  },
  {
    id: 'e5',
    prenom: 'Nicolas',
    initiales: 'NI',
    fonction: 'Etudiant',
    typeEDT: 'variable',
    actif: true,
    horaires: { lundi: 'variable', mardi: 'variable', mercredi: 'variable', jeudi: 'variable', vendredi: 'variable', samedi: 'variable' }
  },
  {
    id: 'e6',
    prenom: 'Matteo',
    initiales: 'MT',
    fonction: 'Etudiant',
    typeEDT: 'variable',
    actif: true,
    horaires: { lundi: 'variable', mardi: 'variable', mercredi: 'variable', jeudi: 'variable', vendredi: 'variable', samedi: 'variable' }
  },
  {
    id: 'e7',
    prenom: 'Robin',
    initiales: 'RO',
    fonction: 'Etudiant',
    typeEDT: 'variable',
    actif: true,
    horaires: { lundi: 'variable', mardi: 'variable', mercredi: 'variable', jeudi: 'variable', vendredi: 'variable', samedi: 'variable' }
  },
  {
    id: 'e8',
    prenom: 'Kenza',
    initiales: 'KE',
    fonction: 'Etudiant',
    typeEDT: 'variable',
    actif: true,
    horaires: { lundi: 'variable', mardi: 'variable', mercredi: 'variable', jeudi: 'variable', vendredi: 'variable', samedi: 'variable' }
  },
  {
    id: 'e9',
    prenom: 'Maissa',
    initiales: 'MS',
    fonction: 'Etudiant',
    typeEDT: 'variable',
    actif: true,
    horaires: { lundi: 'variable', mardi: 'variable', mercredi: 'variable', jeudi: 'variable', vendredi: 'variable', samedi: 'variable' }
  },

  // ============================================
  // 📦 CONDITIONNEURS (3)
  // ============================================
  {
    id: 'c1',
    prenom: 'Charles',
    initiales: 'CH',
    fonction: 'Conditionneur',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: '08:30-16:00', mardi: '08:30-16:00', mercredi: '08:30-16:00', jeudi: '08:30-16:00', vendredi: '08:30-16:00', samedi: 'non' }
  },
  {
    id: 'c2',
    prenom: 'Parmida',
    initiales: 'PA',
    fonction: 'Conditionneur',
    typeEDT: 'variable',
    actif: true,
    horaires: { lundi: 'variable', mardi: 'variable', mercredi: 'variable', jeudi: 'variable', vendredi: 'variable', samedi: 'variable' }
  },
  {
    id: 'c3',
    prenom: 'Mélanie',
    initiales: 'ME',
    fonction: 'Conditionneur',
    typeEDT: 'fixe',
    actif: true,
    horaires: { lundi: '08:30-16:00', mardi: '08:30-16:00', mercredi: '08:30-16:00', jeudi: '08:30-16:00', vendredi: '08:30-16:00', samedi: 'non' }
  },
]

// ============================================================
// 📅 DISPONIBILITÉS (semaine 26 jan - 31 jan 2026)
// ============================================================

export const MOCK_DISPONIBILITES: MockDisponibilite[] = [
  // Étudiants
  { employee_id: 'e1', employee_name: 'Celya', initiales: 'CE', lundi: '17:00-20:30', mardi: null, mercredi: '14:00-20:30', jeudi: null, vendredi: '17:00-20:30', samedi: '14:00-20:00', has_submitted: true },
  { employee_id: 'e2', employee_name: 'Anas', initiales: 'AN', lundi: '17:00-20:30', mardi: null, mercredi: null, jeudi: null, vendredi: '14:00-20:30', samedi: '09:00-14:00', has_submitted: true },
  { employee_id: 'e3', employee_name: 'Jean-Baptiste', initiales: 'JB', lundi: '14:00-20:30', mardi: '17:00-20:30', mercredi: null, jeudi: null, vendredi: '14:00-20:30', samedi: '09:00-14:00', has_submitted: true },
  { employee_id: 'e4', employee_name: 'Eloise', initiales: 'EL', lundi: null, mardi: '14:00-20:30', mercredi: '14:00-20:30', jeudi: '17:00-20:30', vendredi: null, samedi: '14:00-20:00', has_submitted: true },
  { employee_id: 'e5', employee_name: 'Nicolas', initiales: 'NI', lundi: null, mardi: '14:00-20:30', mercredi: '14:00-20:30', jeudi: '17:00-20:30', vendredi: null, samedi: '09:00-14:00', has_submitted: true },
  { employee_id: 'e6', employee_name: 'Matteo', initiales: 'MT', lundi: null, mardi: null, mercredi: null, jeudi: null, vendredi: null, samedi: null, has_submitted: false },
  { employee_id: 'e7', employee_name: 'Robin', initiales: 'RO', lundi: null, mardi: null, mercredi: '17:00-20:30', jeudi: '17:00-20:30', vendredi: '17:00-20:30', samedi: '14:00-20:00', has_submitted: true },
  { employee_id: 'e8', employee_name: 'Kenza', initiales: 'KE', lundi: '14:00-20:30', mardi: '14:00-20:30', mercredi: null, jeudi: '14:00-20:30', vendredi: '14:00-20:30', samedi: null, has_submitted: true },
  { employee_id: 'e9', employee_name: 'Maissa', initiales: 'MS', lundi: '14:00-20:30', mardi: '14:00-20:30', mercredi: null, jeudi: '14:00-20:30', vendredi: '14:00-20:30', samedi: null, has_submitted: true },
  // Employés variables non-étudiants
  { employee_id: 'pr1', employee_name: 'Sylvie', initiales: 'SY', lundi: '08:30-14:00', mardi: '14:00-20:00', mercredi: null, jeudi: '08:30-14:00', vendredi: '14:00-20:00', samedi: '09:00-14:00', has_submitted: true },
  { employee_id: 'c2', employee_name: 'Parmida', initiales: 'PA', lundi: '08:30-16:00', mardi: null, mercredi: '08:30-16:00', jeudi: '08:30-16:00', vendredi: null, samedi: null, has_submitted: true },
]

// ============================================================
// 📋 DEMANDES
// ============================================================

export const MOCK_DEMANDES: MockDemande[] = [
  {
    id: '1',
    employee_id: 'pr4',
    employee_name: 'Ludovic',
    employee_initiales: 'LU',
    type: 'conge',
    date: '2026-02-03',
    creneau: 'Journée complète',
    motif: 'Rendez-vous médical important',
    urgent: true,
    status: 'pending',
    created_at: '2026-01-24',
  },
  {
    id: '2',
    employee_id: 'p7',
    employee_name: 'Sarah',
    employee_initiales: 'SA',
    type: 'echange',
    date: '2026-02-05',
    creneau: '14:00-20:30',
    motif: 'Échange avec Maryam pour le 5 février',
    urgent: false,
    status: 'pending',
    created_at: '2026-01-23',
  },
  {
    id: '3',
    employee_id: 'e1',
    employee_name: 'Celya',
    employee_initiales: 'CE',
    type: 'maladie',
    date: '2026-01-27',
    creneau: 'Journée complète',
    motif: 'Arrêt maladie - certificat à fournir',
    urgent: true,
    status: 'pending',
    created_at: '2026-01-25',
  },
]

// ============================================================
// 📊 GÉNÉRATION PLANNING PAR JOUR
// ============================================================

function parseHoraire(horaire: string): { start: string; end: string } | null {
  if (horaire === 'non' || horaire === 'variable' || horaire === 'congé') return null
  const normalized = horaire.replace(/h/g, ':').replace(/:(\d)(?!\d)/g, ':0$1')
  const parts = normalized.split('-')
  if (parts.length !== 2) return null
  
  let start = parts[0].trim()
  let end = parts[1].trim()
  
  // Ajouter :00 si nécessaire
  if (!start.includes(':')) start += ':00'
  if (!end.includes(':')) end += ':00'
  
  // Normaliser le format (ex: 8:30 -> 08:30)
  start = start.split(':').map((p, i) => i === 0 ? p.padStart(2, '0') : p.padStart(2, '0')).join(':')
  end = end.split(':').map((p, i) => i === 0 ? p.padStart(2, '0') : p.padStart(2, '0')).join(':')
  
  return { start, end }
}

function generatePlanningForDay(day: keyof MockEmployee['horaires']): MockPlanningEntry[] {
  const entries: MockPlanningEntry[] = []
  
  MOCK_EMPLOYEES.forEach(emp => {
    const horaire = emp.horaires[day]
    
    if (horaire === 'congé') {
      entries.push({
        employee_id: emp.id,
        employee_name: emp.prenom,
        employee_initiales: emp.initiales,
        role: emp.fonction,
        start_time: '00:00',
        end_time: '00:00',
        is_conge: true,
      })
    } else if (horaire !== 'non' && horaire !== 'variable') {
      const parsed = parseHoraire(horaire)
      if (parsed) {
        entries.push({
          employee_id: emp.id,
          employee_name: emp.prenom,
          employee_initiales: emp.initiales,
          role: emp.fonction,
          start_time: parsed.start,
          end_time: parsed.end,
        })
      }
    }
  })
  
  // Trier par rôle puis par heure de début
  const roleOrder: Record<EmployeeRole, number> = {
    Pharmacien: 1,
    Preparateur: 2,
    Apprenti: 3,
    Etudiant: 4,
    Conditionneur: 5,
  }
  
  return entries.sort((a, b) => {
    const roleCompare = roleOrder[a.role] - roleOrder[b.role]
    if (roleCompare !== 0) return roleCompare
    return a.start_time.localeCompare(b.start_time)
  })
}

export const MOCK_PLANNING_LUNDI = generatePlanningForDay('lundi')
export const MOCK_PLANNING_MARDI = generatePlanningForDay('mardi')
export const MOCK_PLANNING_MERCREDI = generatePlanningForDay('mercredi')
export const MOCK_PLANNING_JEUDI = generatePlanningForDay('jeudi')
export const MOCK_PLANNING_VENDREDI = generatePlanningForDay('vendredi')
export const MOCK_PLANNING_SAMEDI = generatePlanningForDay('samedi')

export const MOCK_PLANNING_BY_DAY: Record<string, MockPlanningEntry[]> = {
  lundi: MOCK_PLANNING_LUNDI,
  mardi: MOCK_PLANNING_MARDI,
  mercredi: MOCK_PLANNING_MERCREDI,
  jeudi: MOCK_PLANNING_JEUDI,
  vendredi: MOCK_PLANNING_VENDREDI,
  samedi: MOCK_PLANNING_SAMEDI,
}

// ============================================================
// 🌙 GARDES
// ============================================================

export const MOCK_GARDES: MockGarde[] = [
  { id: '1', type: 'soir', date: '2026-01-27', pharmacien_name: 'Sarah', accompagnant_name: 'Dilek', status: 'validee' },
  { id: '2', type: 'nuit', date: '2026-01-28', pharmacien_name: 'Maryam', status: 'assignee' },
  { id: '3', type: 'dimanche', date: '2026-02-01', pharmacien_name: 'Aurélien', accompagnant_name: 'Hamide', status: 'validee' },
  { id: '4', type: 'soir', date: '2026-02-03', pharmacien_name: '', status: 'a_assigner' },
]

// ============================================================
// 📊 STATISTIQUES
// ============================================================

export const MOCK_STATS = {
  disponibilites: {
    total: 11,
    repondu: 10,
    en_attente: 1,
    taux: 91,
  },
  demandes: {
    total: 3,
    en_attente: 3,
    urgentes: 2,
  },
  equipe: {
    total: MOCK_EMPLOYEES.length,
    pharmaciens: MOCK_EMPLOYEES.filter(e => e.fonction === 'Pharmacien').length,
    preparateurs: MOCK_EMPLOYEES.filter(e => e.fonction === 'Preparateur').length,
    apprentis: MOCK_EMPLOYEES.filter(e => e.fonction === 'Apprenti').length,
    etudiants: MOCK_EMPLOYEES.filter(e => e.fonction === 'Etudiant').length,
    conditionneurs: MOCK_EMPLOYEES.filter(e => e.fonction === 'Conditionneur').length,
  },
  planning: {
    semaine_complete: true,
    jours_complets: 6,
    jours_incomplets: 0,
  },
}

// ============================================================
// 🛠️ FONCTIONS UTILITAIRES
// ============================================================

export function getEmployeesByRole(role: EmployeeRole): MockEmployee[] {
  return MOCK_EMPLOYEES.filter(e => e.fonction === role && e.actif)
}

export function getEmployeesFixe(): MockEmployee[] {
  return MOCK_EMPLOYEES.filter(e => e.typeEDT === 'fixe' && e.actif)
}

export function getEmployeesVariable(): MockEmployee[] {
  return MOCK_EMPLOYEES.filter(e => e.typeEDT === 'variable' && e.actif)
}

export function getEmployeeById(id: string): MockEmployee | undefined {
  return MOCK_EMPLOYEES.find(e => e.id === id)
}

export function getPendingDemandes(): MockDemande[] {
  return MOCK_DEMANDES.filter(d => d.status === 'pending')
}

export function getUrgentDemandes(): MockDemande[] {
  return MOCK_DEMANDES.filter(d => d.status === 'pending' && d.urgent)
}

export function getDisponibiliteByEmployeeId(employeeId: string): MockDisponibilite | undefined {
  return MOCK_DISPONIBILITES.find(d => d.employee_id === employeeId)
}

export function getPlanningForDay(day: string): MockPlanningEntry[] {
  return MOCK_PLANNING_BY_DAY[day.toLowerCase()] || []
}

export function getEmployeesWorkingOnDay(day: keyof MockEmployee['horaires']): MockEmployee[] {
  return MOCK_EMPLOYEES.filter(e => {
    const horaire = e.horaires[day]
    return horaire !== 'non' && horaire !== 'variable' && horaire !== 'congé'
  })
}

// ============================================================
// 🎨 COULEURS & ICÔNES PAR RÔLE
// ============================================================

export const ROLE_COLORS: Record<EmployeeRole, string> = {
  Pharmacien: '#10b981',
  Preparateur: '#3b82f6',
  Apprenti: '#8b5cf6',
  Etudiant: '#f59e0b',
  Conditionneur: '#6366f1',
}

export const ROLE_ICONS: Record<EmployeeRole, string> = {
  Pharmacien: '💊',
  Preparateur: '💉',
  Apprenti: '📚',
  Etudiant: '🎓',
  Conditionneur: '📦',
}

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  Pharmacien: 'Pharmacien',
  Preparateur: 'Préparateur',
  Apprenti: 'Apprenti',
  Etudiant: 'Étudiant',
  Conditionneur: 'Conditionneur',
}

export function getRoleColor(role: EmployeeRole): string {
  return ROLE_COLORS[role] || '#64748b'
}

export function getRoleIcon(role: EmployeeRole): string {
  return ROLE_ICONS[role] || '👤'
}

export function getRoleLabel(role: EmployeeRole): string {
  return ROLE_LABELS[role] || role
}

// ============================================================
// 📆 INFOS SEMAINE
// ============================================================

export const SEMAINE_REFERENCE = {
  debut: '2026-01-26',
  fin: '2026-01-31',
  jours: ['Lundi 26', 'Mardi 27', 'Mercredi 28', 'Jeudi 29', 'Vendredi 30', 'Samedi 31'],
  joursShort: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  mois: 'Janvier 2026',
}

export const JOURS_SEMAINE = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const
export type JourSemaine = typeof JOURS_SEMAINE[number]
