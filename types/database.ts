// Types pour la base de données Supabase BaggPlanning

export type Role = 'Pharmacien' | 'Preparateur' | 'Apprenti' | 'Etudiant' | 'Conditionneur';
export type UserType = 'titulaire' | 'employe';
export type DemandeType = 'conge' | 'echange' | 'maladie' | 'autre';
export type DemandeStatus = 'en_attente' | 'approuve' | 'refuse';

export interface Employee {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  tel?: string;
  role: Role;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Disponibilite {
  id: number;
  employee_id: number;
  semaine_debut: string;
  lundi_debut?: string;
  lundi_fin?: string;
  lundi_disponible: boolean;
  mardi_debut?: string;
  mardi_fin?: string;
  mardi_disponible: boolean;
  mercredi_debut?: string;
  mercredi_fin?: string;
  mercredi_disponible: boolean;
  jeudi_debut?: string;
  jeudi_fin?: string;
  jeudi_disponible: boolean;
  vendredi_debut?: string;
  vendredi_fin?: string;
  vendredi_disponible: boolean;
  samedi_debut?: string;
  samedi_fin?: string;
  samedi_disponible: boolean;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
}

export interface Planning {
  id: number;
  employee_id: number;
  date: string;
  debut: string;
  fin: string;
  valide: boolean;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
}

export interface Demande {
  id: number;
  employee_id: number;
  type: DemandeType;
  date_debut: string;
  date_fin: string;
  creneau: 'journee' | 'matin' | 'apres-midi';
  motif: string;
  status: DemandeStatus;
  urgent: boolean;
  remplacant_id?: number;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
}

export interface AppUser {
  id: string;
  email: string;
  user_type: UserType;
  employee_id?: number;
}