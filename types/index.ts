// types/index.ts - Types centralisés pour BaggPlanning

export type Role = 'Pharmacien' | 'Preparateur' | 'Etudiant' | 'Apprenti';
export type UserType = 'titulaire' | 'employe';
export type DemandeType = 'conge' | 'absence' | 'echange' | 'autre';
export type DemandeStatus = 'en_attente' | 'approuve' | 'refuse';
export type Creneau = 'matin' | 'apres_midi' | 'journee';

export interface Employee {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  role: Role;
  actif: boolean;
  created_at?: string;
}

export interface Disponibilite {
  id: number;
  employee_id: number;
  semaine_debut: string;
  lundi_disponible: boolean;
  lundi_debut?: string;
  lundi_fin?: string;
  mardi_disponible: boolean;
  mardi_debut?: string;
  mardi_fin?: string;
  mercredi_disponible: boolean;
  mercredi_debut?: string;
  mercredi_fin?: string;
  jeudi_disponible: boolean;
  jeudi_debut?: string;
  jeudi_fin?: string;
  vendredi_disponible: boolean;
  vendredi_debut?: string;
  vendredi_fin?: string;
  samedi_disponible: boolean;
  samedi_debut?: string;
  samedi_fin?: string;
  created_at?: string;
  employees?: Employee;
}

export interface Planning {
  id?: number;
  employee_id: number;
  date: string;
  debut: string;
  fin: string;
  creneau: Creneau;
  valide: boolean;
  created_at?: string;
  employees?: Employee;
}

export interface Demande {
  id: number;
  employee_id: number;
  type: DemandeType;
  date_debut: string;
  date_fin?: string;
  creneau?: Creneau;
  motif?: string;
  status: DemandeStatus;
  urgence: boolean;
  created_at?: string;
  employees?: Employee;
}

// Types pour le Drag & Drop du planning
export interface DragEmployee {
  id: number;
  employee: Employee;
  disponibilite?: {
    debut: string;
    fin: string;
  };
}

export interface DropZone {
  date: string;
  creneau: 'matin' | 'apres_midi';
  jourIndex: number;
}

export interface PlanningSlot {
  id: string;
  employee_id: number;
  employee: Employee;
  date: string;
  debut: string;
  fin: string;
  creneau: 'matin' | 'apres_midi';
}

// Jours de la semaine
export const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;
export const JOURS_KEYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const;
export type JourKey = typeof JOURS_KEYS[number];

// Horaires par défaut
export const HORAIRES = {
  matin: { debut: '08:30', fin: '14:00' },
  apres_midi: { debut: '14:00', fin: '20:30' },
  samedi_apres_midi: { debut: '14:00', fin: '19:30' },
} as const;
