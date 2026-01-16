"use client";

import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Planning } from '@/types/database';

// Hook pour récupérer le planning d'une période
export function usePlanning(dateDebut: string, dateFin: string) {
  const [planning, setPlanning] = useState<Planning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanning = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('planning')
      .select('*, employees(*)')
      .gte('date', dateDebut)
      .lte('date', dateFin)
      .order('date', { ascending: true })
      .order('debut', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setPlanning(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (dateDebut && dateFin) {
      fetchPlanning();
    }
  }, [dateDebut, dateFin]);

  return { planning, loading, error, refetch: fetchPlanning };
}

// Hook pour le planning d'un jour spécifique
export function useDayPlanning(date: string) {
  const [planning, setPlanning] = useState<Planning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanning = async () => {
    if (!date) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('planning')
      .select('*, employees(*)')
      .eq('date', date)
      .order('debut', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setPlanning(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlanning();
  }, [date]);

  const addToPlanning = async (item: Omit<Planning, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('planning')
      .insert([item])
      .select('*, employees(*)')
      .single();

    if (error) {
      return { error: error.message };
    }

    setPlanning([...planning, data]);
    return { data };
  };

  const updatePlanning = async (id: number, updates: Partial<Planning>) => {
    const { data, error } = await supabase
      .from('planning')
      .update(updates)
      .eq('id', id)
      .select('*, employees(*)')
      .single();

    if (error) {
      return { error: error.message };
    }

    setPlanning(planning.map(p => p.id === id ? data : p));
    return { data };
  };

  const removeFromPlanning = async (id: number) => {
    const { error } = await supabase
      .from('planning')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    setPlanning(planning.filter(p => p.id !== id));
    return { success: true };
  };

  const validateDay = async () => {
    const { error } = await supabase
      .from('planning')
      .update({ valide: true })
      .eq('date', date);

    if (error) {
      return { error: error.message };
    }

    setPlanning(planning.map(p => ({ ...p, valide: true })));
    return { success: true };
  };

  return { 
    planning, 
    loading, 
    error, 
    refetch: fetchPlanning,
    addToPlanning,
    updatePlanning,
    removeFromPlanning,
    validateDay
  };
}

// Hook pour le planning d'un employé
export function useMyPlanning(employeeId: number, dateDebut: string, dateFin: string) {
  const [planning, setPlanning] = useState<Planning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanning = async () => {
    if (!employeeId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('planning')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('date', dateDebut)
      .lte('date', dateFin)
      .order('date', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setPlanning(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlanning();
  }, [employeeId, dateDebut, dateFin]);

  return { planning, loading, error, refetch: fetchPlanning };
}

// Fonctions utilitaires
export function getWeekDates(mondayDate: string): string[] {
  const dates: string[] = [];
  const monday = new Date(mondayDate);
  
  for (let i = 0; i < 6; i++) { // Lundi à Samedi
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  
  return dates;
}

export function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr);
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  
  return `${jours[date.getDay()]} ${date.getDate()} ${mois[date.getMonth()]}`;
}
