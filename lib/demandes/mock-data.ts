// Types pour les demandes
export type TypeDemande = 'conge' | 'formation' | 'rtt' | 'maladie';
export type StatusDemande = 'en_attente' | 'approuvee' | 'refusee';
export type FonctionEmploye = 'Pharmacien' | 'Préparateur' | 'Conditionneur' | 'Apprenti' | 'Étudiant';

export interface Demande {
  id: string;
  employeId: string;
  employeeName: string;
  initials: string;
  fonction: FonctionEmploye;
  type: TypeDemande;
  dateDebut: Date;
  dateFin: Date;
  status: StatusDemande;
  motif?: string;
  dateCreation: Date;
}

// Palette de 10 couleurs stables pour les employés
const EMPLOYEE_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#84cc16', // Lime
];

/**
 * Génère une couleur stable basée sur les initiales de l'employé
 */
export function getColorFromInitials(initials: string): string {
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % EMPLOYEE_COLORS.length;
  return EMPLOYEE_COLORS[index];
}

/**
 * Retourne la liste des fonctions uniques parmi les demandes
 */
export function getUniqueFonctions(demandes: Demande[]): FonctionEmploye[] {
  const fonctions = new Set<FonctionEmploye>();
  demandes.forEach(d => fonctions.add(d.fonction));
  return Array.from(fonctions).sort();
}

/**
 * Retourne la liste des employés uniques triés par nom
 */
export function getUniqueEmployes(demandes: Demande[]): { id: string; name: string; initials: string }[] {
  const employesMap = new Map<string, { id: string; name: string; initials: string }>();
  demandes.forEach(d => {
    if (!employesMap.has(d.employeId)) {
      employesMap.set(d.employeId, {
        id: d.employeId,
        name: d.employeeName,
        initials: d.initials,
      });
    }
  });
  return Array.from(employesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// MOCK DATA : 17 demandes de congés
export const MOCK_DEMANDES: Demande[] = [
  // Sarah Martin - Pharmacien (3 demandes)
  {
    id: 'dem1',
    employeId: 'emp1',
    employeeName: 'Sarah Martin',
    initials: 'SM',
    fonction: 'Pharmacien',
    type: 'conge',
    dateDebut: new Date('2026-03-15'),
    dateFin: new Date('2026-03-21'),
    status: 'approuvee',
    motif: 'Congés annuels',
    dateCreation: new Date('2026-01-10'),
  },
  {
    id: 'dem2',
    employeId: 'emp1',
    employeeName: 'Sarah Martin',
    initials: 'SM',
    fonction: 'Pharmacien',
    type: 'conge',
    dateDebut: new Date('2026-07-20'),
    dateFin: new Date('2026-08-07'),
    status: 'approuvee',
    motif: 'Vacances été',
    dateCreation: new Date('2026-02-15'),
  },
  {
    id: 'dem3',
    employeId: 'emp1',
    employeeName: 'Sarah Martin',
    initials: 'SM',
    fonction: 'Pharmacien',
    type: 'conge',
    dateDebut: new Date('2026-12-24'),
    dateFin: new Date('2026-12-31'),
    status: 'en_attente',
    motif: 'Fêtes de fin d\'année',
    dateCreation: new Date('2026-09-01'),
  },

  // Thomas Dubois - Préparateur (2 demandes)
  {
    id: 'dem4',
    employeId: 'emp2',
    employeeName: 'Thomas Dubois',
    initials: 'TD',
    fonction: 'Préparateur',
    type: 'conge',
    dateDebut: new Date('2026-04-08'),
    dateFin: new Date('2026-04-15'),
    status: 'approuvee',
    motif: 'Vacances Pâques',
    dateCreation: new Date('2026-02-01'),
  },
  {
    id: 'dem5',
    employeId: 'emp2',
    employeeName: 'Thomas Dubois',
    initials: 'TD',
    fonction: 'Préparateur',
    type: 'conge',
    dateDebut: new Date('2026-08-01'),
    dateFin: new Date('2026-08-21'),
    status: 'approuvee',
    motif: 'Congés été - Sud de la France',
    dateCreation: new Date('2026-03-10'),
  },

  // Marie Lambert - Conditionneur (2 demandes)
  {
    id: 'dem6',
    employeId: 'emp3',
    employeeName: 'Marie Lambert',
    initials: 'ML',
    fonction: 'Conditionneur',
    type: 'conge',
    dateDebut: new Date('2026-03-16'),
    dateFin: new Date('2026-03-20'),
    status: 'approuvee',
    motif: 'Congé familial',
    dateCreation: new Date('2026-01-20'),
  },
  {
    id: 'dem7',
    employeId: 'emp3',
    employeeName: 'Marie Lambert',
    initials: 'ML',
    fonction: 'Conditionneur',
    type: 'conge',
    dateDebut: new Date('2026-07-15'),
    dateFin: new Date('2026-07-31'),
    status: 'approuvee',
    motif: 'Vacances été',
    dateCreation: new Date('2026-02-28'),
  },

  // Pierre Moreau - Apprenti (2 demandes)
  {
    id: 'dem8',
    employeId: 'emp4',
    employeeName: 'Pierre Moreau',
    initials: 'PM',
    fonction: 'Apprenti',
    type: 'conge',
    dateDebut: new Date('2026-05-11'),
    dateFin: new Date('2026-05-15'),
    status: 'approuvee',
    motif: 'Pont de l\'Ascension',
    dateCreation: new Date('2026-03-15'),
  },
  {
    id: 'dem9',
    employeId: 'emp4',
    employeeName: 'Pierre Moreau',
    initials: 'PM',
    fonction: 'Apprenti',
    type: 'conge',
    dateDebut: new Date('2026-08-10'),
    dateFin: new Date('2026-08-24'),
    status: 'approuvee',
    motif: 'Vacances été',
    dateCreation: new Date('2026-04-01'),
  },

  // Julie Bernard - Étudiant (2 demandes)
  {
    id: 'dem10',
    employeId: 'emp5',
    employeeName: 'Julie Bernard',
    initials: 'JB',
    fonction: 'Étudiant',
    type: 'conge',
    dateDebut: new Date('2026-03-18'),
    dateFin: new Date('2026-03-22'),
    status: 'approuvee',
    motif: 'Révisions examens',
    dateCreation: new Date('2026-02-10'),
  },
  {
    id: 'dem11',
    employeId: 'emp5',
    employeeName: 'Julie Bernard',
    initials: 'JB',
    fonction: 'Étudiant',
    type: 'conge',
    dateDebut: new Date('2026-06-15'),
    dateFin: new Date('2026-06-30'),
    status: 'approuvee',
    motif: 'Fin de stage universitaire',
    dateCreation: new Date('2026-04-20'),
  },

  // Luc Petit - Pharmacien (2 demandes)
  {
    id: 'dem12',
    employeId: 'emp6',
    employeeName: 'Luc Petit',
    initials: 'LP',
    fonction: 'Pharmacien',
    type: 'conge',
    dateDebut: new Date('2026-02-16'),
    dateFin: new Date('2026-02-20'),
    status: 'approuvee',
    motif: 'Vacances hiver',
    dateCreation: new Date('2026-01-05'),
  },
  {
    id: 'dem13',
    employeId: 'emp6',
    employeeName: 'Luc Petit',
    initials: 'LP',
    fonction: 'Pharmacien',
    type: 'conge',
    dateDebut: new Date('2026-08-03'),
    dateFin: new Date('2026-08-17'),
    status: 'approuvee',
    motif: 'Congés annuels',
    dateCreation: new Date('2026-03-20'),
  },

  // Emma Rousseau - Préparateur (1 demande)
  {
    id: 'dem14',
    employeId: 'emp7',
    employeeName: 'Emma Rousseau',
    initials: 'ER',
    fonction: 'Préparateur',
    type: 'conge',
    dateDebut: new Date('2026-07-01'),
    dateFin: new Date('2026-07-18'),
    status: 'approuvee',
    motif: 'Vacances été',
    dateCreation: new Date('2026-02-25'),
  },

  // Antoine Garcia - Conditionneur (1 demande - en attente)
  {
    id: 'dem15',
    employeId: 'emp8',
    employeeName: 'Antoine Garcia',
    initials: 'AG',
    fonction: 'Conditionneur',
    type: 'conge',
    dateDebut: new Date('2026-09-07'),
    dateFin: new Date('2026-09-18'),
    status: 'en_attente',
    motif: 'Voyage familial',
    dateCreation: new Date('2026-06-15'),
  },

  // Camille Leroy - Préparateur (1 demande - en attente)
  {
    id: 'dem16',
    employeId: 'emp9',
    employeeName: 'Camille Leroy',
    initials: 'CL',
    fonction: 'Préparateur',
    type: 'conge',
    dateDebut: new Date('2026-10-19'),
    dateFin: new Date('2026-10-30'),
    status: 'en_attente',
    motif: 'Vacances Toussaint',
    dateCreation: new Date('2026-07-01'),
  },

  // Bonus : Chevauchement mars avec Sarah et Marie
  {
    id: 'dem17',
    employeId: 'emp7',
    employeeName: 'Emma Rousseau',
    initials: 'ER',
    fonction: 'Préparateur',
    type: 'conge',
    dateDebut: new Date('2026-03-17'),
    dateFin: new Date('2026-03-19'),
    status: 'approuvee',
    motif: 'Congé personnel',
    dateCreation: new Date('2026-02-01'),
  },
];
