"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Demande, DemandeStatus } from '@/types/database';

// Hook pour récupérer toutes les demandes (titulaire)
export function useDemandes(status?: DemandeStatus) {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDemandes = async () => {
    setLoading(true);
    let query = supabase
      .from('demandes')
      .select('*, employees(*)')
      .order('urgent', { ascending: false })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      setError(error.message);
    } else {
      setDemandes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDemandes();
  }, [status]);

  const updateDemandeStatus = async (id: number, newStatus: DemandeStatus, remplacantId?: number) => {
    const updates: Partial<Demande> = { status: newStatus };
    if (remplacantId) updates.remplacant_id = remplacantId;

    const { data, error } = await supabase
      .from('demandes')
      .update(updates)
      .eq('id', id)
      .select('*, employees(*)')
      .single();

    if (error) {
      return { error: error.message };
    }

    setDemandes(demandes.map(d => d.id === id ? data : d));
    return { data };
  };

  return { 
    demandes, 
    loading, 
    error, 
    refetch: fetchDemandes,
    updateDemandeStatus
  };
}

// Hook pour les demandes d'un employé
export function useMyDemandes(employeeId: number) {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDemandes = async () => {
    if (!employeeId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('demandes')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setDemandes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDemandes();
  }, [employeeId]);

  const createDemande = async (demande: Omit<Demande, 'id' | 'status' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('demandes')
      .insert([{ ...demande, status: 'en_attente' }])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    setDemandes([data, ...demandes]);
    return { data };
  };

  return { 
    demandes, 
    loading, 
    error, 
    refetch: fetchDemandes,
    createDemande
  };
}

// Hook pour compter les demandes en attente
export function useDemandesCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('demandes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'en_attente');

      if (!error) {
        setCount(count || 0);
      }
      setLoading(false);
    };

    fetchCount();
  }, []);

  return { count, loading };
}
