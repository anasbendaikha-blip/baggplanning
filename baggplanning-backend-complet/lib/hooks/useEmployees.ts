"use client";

import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Employee, Role } from '@/types/database';

// Hook pour récupérer tous les employés
export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('role', { ascending: true })
      .order('prenom', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const addEmployee = async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('employees')
      .insert([employee])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }
    
    setEmployees([...employees, data]);
    return { data };
  };

  const updateEmployee = async (id: number, updates: Partial<Employee>) => {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    setEmployees(employees.map(e => e.id === id ? data : e));
    return { data };
  };

  const deleteEmployee = async (id: number) => {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    setEmployees(employees.filter(e => e.id !== id));
    return { success: true };
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

// Hook pour récupérer les employés par rôle
export function useEmployeesByRole(role: Role) {
  const { employees, loading, error } = useEmployees();
  const filtered = employees.filter(e => e.role === role);
  return { employees: filtered, loading, error };
}
