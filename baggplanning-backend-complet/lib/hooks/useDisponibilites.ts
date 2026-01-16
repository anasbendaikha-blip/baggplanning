"use client";

import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Disponibilite } from '@/types/database';

// Hook pour récupérer les disponibilités d'une semaine
export function useDisponibilites(semaineDebut: string) {
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisponibilites = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('disponibilites')
      .select('*, employees(*)')
      .eq('semaine_debut', semaineDebut);

    if (error) {
      setError(error.message);
    } else {
      setDisponibilites(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (semaineDebut) {
      fetchDisponibilites();
    }
  }, [semaineDebut]);

  return { disponibilites, loading, error, refetch: fetchDisponibilites };
}

// Hook pour les disponibilités d'un employé
export function useMyDisponibilites(employeeId: number, semaineDebut: string) {
  const [disponibilite, setDisponibilite] = useState<Disponibilite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisponibilite = async () => {
    if (!employeeId || !semaineDebut) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('disponibilites')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('semaine_debut', semaineDebut)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      setError(error.message);
    } else {
      setDisponibilite(data || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDisponibilite();
  }, [employeeId, semaineDebut]);

  const saveDisponibilite = async (data: Omit<Disponibilite, 'id' | 'created_at' | 'updated_at'>) => {
    // Upsert: crée ou met à jour
    const { data: result, error } = await supabase
      .from('disponibilites')
      .upsert([data], { 
        onConflict: 'employee_id,semaine_debut',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    setDisponibilite(result);
    return { data: result };
  };

  return { disponibilite, loading, error, saveDisponibilite, refetch: fetchDisponibilite };
}

// Fonction utilitaire pour calculer le lundi d'une semaine
export function getMondayOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

// Fonction pour formater les disponibilités pour l'affichage
export function formatDispoForDisplay(dispo: Disponibilite | null) {
  if (!dispo) return null;
  
  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const;
  
  return jours.map(jour => {
    const disponible = dispo[`${jour}_disponible` as keyof Disponibilite] as boolean;
    const debut = dispo[`${jour}_debut` as keyof Disponibilite] as string;
    const fin = dispo[`${jour}_fin` as keyof Disponibilite] as string;
    
    if (!disponible) return '-';
    if (debut && fin) return `${debut.replace(':', 'h')}-${fin.replace(':', 'h')}`;
    return '?';
  });
}
