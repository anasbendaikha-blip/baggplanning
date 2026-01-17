// lib/hooks/index.ts - Hooks Supabase pour BaggPlanning

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Employee, Disponibilite, Planning, Demande, JourKey } from '@/types';

// Client Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================
// HOOK: useEmployees
// ============================================
export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('employees')
        .select('*')
        .eq('actif', true)
        .order('role', { ascending: true })
        .order('prenom', { ascending: true });

      if (err) throw err;
      setEmployees(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const addEmployee = async (employee: Omit<Employee, 'id' | 'created_at'>) => {
    const { data, error: err } = await supabase
      .from('employees')
      .insert([employee])
      .select()
      .single();

    if (err) throw err;
    await fetchEmployees();
    return data;
  };

  const updateEmployee = async (id: number, updates: Partial<Employee>) => {
    const { error: err } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id);

    if (err) throw err;
    await fetchEmployees();
  };

  const deleteEmployee = async (id: number) => {
    const { error: err } = await supabase
      .from('employees')
      .update({ actif: false })
      .eq('id', id);

    if (err) throw err;
    await fetchEmployees();
  };

  return {
    employees,
    loading,
    error,
    refetch: fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  };
}

// ============================================
// HOOK: useDisponibilites
// ============================================
export function useDisponibilites(semaineDebut: string) {
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisponibilites = useCallback(async () => {
    if (!semaineDebut) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('disponibilites')
        .select(`
          *,
          employees (*)
        `)
        .eq('semaine_debut', semaineDebut);

      if (err) throw err;
      setDisponibilites(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [semaineDebut]);

  useEffect(() => {
    fetchDisponibilites();
  }, [fetchDisponibilites]);

  // Helper: obtenir la disponibilité d'un employé pour un jour donné
  const getDispoForDay = (employeeId: number, jour: JourKey) => {
    const dispo = disponibilites.find(d => d.employee_id === employeeId);
    if (!dispo) return null;

    const disponible = dispo[`${jour}_disponible` as keyof Disponibilite] as boolean;
    const debut = dispo[`${jour}_debut` as keyof Disponibilite] as string | undefined;
    const fin = dispo[`${jour}_fin` as keyof Disponibilite] as string | undefined;

    return { disponible, debut, fin };
  };

  // Helper: obtenir les employés disponibles pour un jour donné
  const getEmployeesDisponibles = (jour: JourKey) => {
    return disponibilites.filter(d => {
      const disponible = d[`${jour}_disponible` as keyof Disponibilite] as boolean;
      return disponible && d.employees;
    }).map(d => ({
      ...d.employees!,
      disponibilite: {
        debut: d[`${jour}_debut` as keyof Disponibilite] as string,
        fin: d[`${jour}_fin` as keyof Disponibilite] as string,
      }
    }));
  };

  return {
    disponibilites,
    loading,
    error,
    refetch: fetchDisponibilites,
    getDispoForDay,
    getEmployeesDisponibles,
  };
}

// ============================================
// HOOK: usePlanning
// ============================================
export function usePlanning(semaineDebut: string) {
  const [planning, setPlanning] = useState<Planning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanning = useCallback(async () => {
    if (!semaineDebut) return;

    setLoading(true);
    setError(null);
    try {
      // Calculer les dates de la semaine
      const dates = [];
      const startDate = new Date(semaineDebut);
      for (let i = 0; i < 6; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }

      const { data, error: err } = await supabase
        .from('planning')
        .select(`
          *,
          employees (*)
        `)
        .in('date', dates)
        .order('date', { ascending: true })
        .order('debut', { ascending: true });

      if (err) throw err;
      setPlanning(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [semaineDebut]);

  useEffect(() => {
    fetchPlanning();
  }, [fetchPlanning]);

  const addPlanningSlot = async (slot: Omit<Planning, 'id' | 'created_at' | 'employees'>) => {
    const { data, error: err } = await supabase
      .from('planning')
      .insert([slot])
      .select(`*, employees (*)`)
      .single();

    if (err) throw err;
    await fetchPlanning();
    return data;
  };

  const updatePlanningSlot = async (id: number, updates: Partial<Planning>) => {
    const { error: err } = await supabase
      .from('planning')
      .update(updates)
      .eq('id', id);

    if (err) throw err;
    await fetchPlanning();
  };

  const deletePlanningSlot = async (id: number) => {
    const { error: err } = await supabase
      .from('planning')
      .delete()
      .eq('id', id);

    if (err) throw err;
    await fetchPlanning();
  };

  const saveBulkPlanning = async (slots: Omit<Planning, 'id' | 'created_at' | 'employees'>[]) => {
    // Supprimer l'ancien planning de la semaine
    const dates = slots.map(s => s.date);
    const uniqueDates = [...new Set(dates)];

    const { error: deleteErr } = await supabase
      .from('planning')
      .delete()
      .in('date', uniqueDates);

    if (deleteErr) throw deleteErr;

    // Insérer le nouveau planning
    if (slots.length > 0) {
      const { error: insertErr } = await supabase
        .from('planning')
        .insert(slots);

      if (insertErr) throw insertErr;
    }

    await fetchPlanning();
  };

  return {
    planning,
    loading,
    error,
    refetch: fetchPlanning,
    addPlanningSlot,
    updatePlanningSlot,
    deletePlanningSlot,
    saveBulkPlanning,
  };
}

// ============================================
// HOOK: useDemandes
// ============================================
export function useDemandes() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDemandes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('demandes')
        .select(`
          *,
          employees (*)
        `)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setDemandes(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);

  const updateDemandeStatus = async (id: number, status: 'approuve' | 'refuse') => {
    const { error: err } = await supabase
      .from('demandes')
      .update({ status })
      .eq('id', id);

    if (err) throw err;
    await fetchDemandes();
  };

  const pendingCount = demandes.filter(d => d.status === 'en_attente').length;
  const urgentCount = demandes.filter(d => d.status === 'en_attente' && d.urgence).length;

  return {
    demandes,
    loading,
    error,
    refetch: fetchDemandes,
    updateDemandeStatus,
    pendingCount,
    urgentCount,
  };
}

// ============================================
// HOOK: useStats
// ============================================
export function useStats(semaineDebut: string, employees: Employee[], disponibilites: Disponibilite[]) {
  const etudiants = employees.filter(e => e.role === 'Etudiant');
  const etudiantsWithDispo = disponibilites.filter(d => 
    etudiants.some(e => e.id === d.employee_id)
  );

  return {
    totalEmployees: employees.length,
    totalEtudiants: etudiants.length,
    etudiantsRepondu: etudiantsWithDispo.length,
    etudiantsEnAttente: etudiants.length - etudiantsWithDispo.length,
    tauxReponse: etudiants.length > 0 
      ? Math.round((etudiantsWithDispo.length / etudiants.length) * 100) 
      : 0,
  };
}

export { supabase };
