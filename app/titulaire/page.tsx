'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// ============================================
// TYPES
// ============================================

type Role = 'Pharmacien titulaire' | 'Pharmacien adjoint' | 'Preparateur' | 'Apprenti' | 'Etudiant' | 'Conditionneur';

interface Employee {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  initiales: string;
  roles: Role[];
  actif: boolean;
}

interface Disponibilite {
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
  employee?: Employee;
}

interface PlanningSlot {
  id: string;
  employee_id: number;
  employee: Employee;
  date: string;
  debut: string;
  fin: string;
  creneau: 'matin' | 'apres_midi';
}

interface Demande {
  id: number;
  employee_id: number;
  type: string;
  date_debut: string;
  date_fin?: string;
  motif?: string;
  status: 'en_attente' | 'approuve' | 'refuse';
  urgence: boolean;
  employee?: Employee;
}

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;
const JOURS_KEYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const;

const ROLES_LIST: Role[] = [
  'Pharmacien titulaire',
  'Pharmacien adjoint',
  'Preparateur',
  'Apprenti',
  'Etudiant',
  'Conditionneur',
];

const HORAIRES = {
  matin: { debut: '08:30', fin: '14:00' },
  apres_midi: { debut: '14:00', fin: '20:30' },
  samedi_apres_midi: { debut: '14:00', fin: '19:30' },
};

// ============================================
// SUPABASE CLIENT (inline pour simplicité)
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function getDateForDay(mondayStr: string, dayIndex: number): string {
  const monday = new Date(mondayStr);
  const date = new Date(monday);
  date.setDate(monday.getDate() + dayIndex);
  return date.toISOString().split('T')[0];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function generateSlotId(): string {
  return `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// DRAGGABLE EMPLOYEE COMPONENT
// ============================================

interface DraggableEmployeeProps {
  employee: Employee;
  disponibilite?: { debut: string; fin: string };
}

function DraggableEmployee({ employee, disponibilite }: DraggableEmployeeProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `employee-${employee.id}`,
    data: { employee, disponibilite },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const roleColor = employee.roles.includes('Pharmacien titulaire') || employee.roles.includes('Pharmacien adjoint')
    ? '#10b981'
    : employee.roles.includes('Preparateur')
    ? '#3b82f6'
    : employee.roles.includes('Etudiant')
    ? '#f59e0b'
    : '#8b5cf6';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="employee-card-draggable"
    >
      <div className="employee-avatar" style={{ background: roleColor }}>
        {employee.initiales || `${employee.prenom[0]}${employee.nom[0]}`}
      </div>
      <div className="employee-info">
        <div className="employee-name">{employee.prenom} {employee.nom}</div>
        {disponibilite && (
          <div className="employee-hours">{disponibilite.debut?.slice(0,5)} - {disponibilite.fin?.slice(0,5)}</div>
        )}
        <div className="employee-roles">
          {employee.roles.slice(0, 2).map((role, i) => (
            <span key={i} className="role-chip">{role}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// DROPPABLE ZONE COMPONENT
// ============================================

interface DroppableZoneProps {
  id: string;
  creneau: 'matin' | 'apres_midi';
  date: string;
  children: React.ReactNode;
}

function DroppableZone({ id, creneau, date, children }: DroppableZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { creneau, date },
  });

  return (
    <div
      ref={setNodeRef}
      className={`drop-zone ${creneau} ${isOver ? 'drag-over' : ''}`}
    >
      <div className="drop-zone-header">
        {creneau === 'matin' ? '🌅 MATIN' : '🌆 APRÈS-MIDI'}
        <span className="drop-zone-hours">
          {creneau === 'matin' ? '8h30 - 14h00' : '14h00 - 20h30'}
        </span>
      </div>
      <div className="drop-zone-content">
        {children}
      </div>
      {React.Children.count(children) === 0 && (
        <div className="drop-zone-placeholder">
          Glissez un employé ici
        </div>
      )}
    </div>
  );
}

// ============================================
// ASSIGNED EMPLOYEE CARD
// ============================================

interface AssignedCardProps {
  slot: PlanningSlot;
  onRemove: (id: string) => void;
  onUpdateTime: (id: string, field: 'debut' | 'fin', value: string) => void;
}

function AssignedCard({ slot, onRemove, onUpdateTime }: AssignedCardProps) {
  const roleColor = slot.employee.roles?.includes('Pharmacien titulaire') || slot.employee.roles?.includes('Pharmacien adjoint')
    ? '#10b981'
    : slot.employee.roles?.includes('Preparateur')
    ? '#3b82f6'
    : slot.employee.roles?.includes('Etudiant')
    ? '#f59e0b'
    : '#8b5cf6';

  return (
    <div className="assigned-card">
      <div className="assigned-header">
        <div className="assigned-avatar" style={{ background: roleColor }}>
          {slot.employee.initiales || `${slot.employee.prenom[0]}${slot.employee.nom?.[0] || ''}`}
        </div>
        <span className="assigned-name">{slot.employee.prenom} {slot.employee.nom?.[0]}.</span>
        <button className="remove-btn" onClick={() => onRemove(slot.id)}>×</button>
      </div>
      <div className="assigned-time">
        <input
          type="time"
          value={slot.debut}
          onChange={(e) => onUpdateTime(slot.id, 'debut', e.target.value)}
        />
        <span>→</span>
        <input
          type="time"
          value={slot.fin}
          onChange={(e) => onUpdateTime(slot.id, 'fin', e.target.value)}
        />
      </div>
    </div>
  );
}

// ============================================
// ADD EMPLOYEE MODAL
// ============================================

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (employee: Omit<Employee, 'id' | 'actif'>) => Promise<void>;
}

function AddEmployeeModal({ isOpen, onClose, onAdd }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    initiales: '',
    roles: [] as Role[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.prenom.trim()) newErrors.prenom = 'Prénom requis';
    if (!formData.nom.trim()) newErrors.nom = 'Nom requis';
    if (!formData.email.trim()) newErrors.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.telephone.trim()) newErrors.telephone = 'Téléphone requis';
    else if (!/^(0|\+33)[1-9](\d{2}){4}$/.test(formData.telephone.replace(/\s/g, ''))) newErrors.telephone = 'Format invalide';
    if (!formData.initiales.trim()) newErrors.initiales = 'Initiales requises';
    if (formData.roles.length === 0) newErrors.roles = 'Sélectionnez au moins un rôle';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onAdd(formData);
      setFormData({ prenom: '', nom: '', email: '', telephone: '', initiales: '', roles: [] });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: Role) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>➕ Ajouter un membre</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Prénom *</label>
              <input
                type="text"
                value={formData.prenom}
                onChange={e => setFormData({...formData, prenom: e.target.value})}
                className={errors.prenom ? 'error' : ''}
              />
              {errors.prenom && <span className="error-text">{errors.prenom}</span>}
            </div>
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                value={formData.nom}
                onChange={e => setFormData({...formData, nom: e.target.value})}
                className={errors.nom ? 'error' : ''}
              />
              {errors.nom && <span className="error-text">{errors.nom}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Téléphone *</label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={e => setFormData({...formData, telephone: e.target.value})}
                placeholder="06 12 34 56 78"
                className={errors.telephone ? 'error' : ''}
              />
              {errors.telephone && <span className="error-text">{errors.telephone}</span>}
            </div>
            <div className="form-group">
              <label>Initiales *</label>
              <input
                type="text"
                value={formData.initiales}
                onChange={e => setFormData({...formData, initiales: e.target.value.toUpperCase()})}
                maxLength={4}
                placeholder="AB"
                className={errors.initiales ? 'error' : ''}
              />
              {errors.initiales && <span className="error-text">{errors.initiales}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Fonctions * (une ou plusieurs)</label>
            <div className="roles-grid">
              {ROLES_LIST.map(role => (
                <button
                  key={role}
                  type="button"
                  className={`role-button ${formData.roles.includes(role) ? 'selected' : ''}`}
                  onClick={() => toggleRole(role)}
                >
                  {role}
                </button>
              ))}
            </div>
            {errors.roles && <span className="error-text">{errors.roles}</span>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? '⏳ Ajout...' : '✓ Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function TitulairePage() {
  const router = useRouter();

  // State
  const [semaineDebut, setSemaineDebut] = useState(() => getMondayOfWeek(new Date()));
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'disponibilites' | 'demandes' | 'planning' | 'equipe'>('planning');
  const [planningSlots, setPlanningSlots] = useState<PlanningSlot[]>([]);
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);

  // DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Computed
  const selectedDate = useMemo(() => getDateForDay(semaineDebut, selectedDayIndex), [semaineDebut, selectedDayIndex]);
  const selectedJourKey = JOURS_KEYS[selectedDayIndex];

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    fetchAllData();
  }, [semaineDebut]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch employees
      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .eq('actif', true)
        .order('prenom');
      
      // Transform roles from string to array if needed
      const transformedEmployees = (empData || []).map(e => ({
        ...e,
        roles: Array.isArray(e.roles) ? e.roles : (e.role ? [e.role] : []),
        initiales: e.initiales || `${e.prenom?.[0] || ''}${e.nom?.[0] || ''}`,
      }));
      setEmployees(transformedEmployees);

      // Fetch disponibilites
      const { data: dispoData } = await supabase
        .from('disponibilites')
        .select('*, employee:employees(*)')
        .eq('semaine_debut', semaineDebut);
      setDisponibilites(dispoData || []);

      // Fetch planning
      const dates = JOURS.map((_, i) => getDateForDay(semaineDebut, i));
      const { data: planningData } = await supabase
        .from('planning')
        .select('*, employee:employees(*)')
        .in('date', dates);
      
      if (planningData) {
        const slots: PlanningSlot[] = planningData.map(p => ({
          id: `db-${p.id}`,
          employee_id: p.employee_id,
          employee: {
            ...p.employee,
            roles: Array.isArray(p.employee?.roles) ? p.employee.roles : (p.employee?.role ? [p.employee.role] : []),
            initiales: p.employee?.initiales || `${p.employee?.prenom?.[0] || ''}${p.employee?.nom?.[0] || ''}`,
          },
          date: p.date,
          debut: p.debut,
          fin: p.fin,
          creneau: p.creneau === 'matin' ? 'matin' : 'apres_midi',
        }));
        setPlanningSlots(slots);
      }

      // Fetch demandes
      const { data: demandesData } = await supabase
        .from('demandes')
        .select('*, employee:employees(*)')
        .order('created_at', { ascending: false });
      setDemandes(demandesData || []);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getEmployeesDisponibles = () => {
    const jourKey = selectedJourKey;
    return disponibilites
      .filter(d => {
        const disponible = d[`${jourKey}_disponible` as keyof Disponibilite] as boolean;
        return disponible && d.employee;
      })
      .map(d => ({
        ...d.employee!,
        roles: Array.isArray(d.employee?.roles) ? d.employee.roles : ((d.employee as any)?.role ? [(d.employee as any).role] : []),
        initiales: d.employee?.initiales || `${d.employee?.prenom?.[0] || ''}${d.employee?.nom?.[0] || ''}`,
        disponibilite: {
          debut: d[`${jourKey}_debut` as keyof Disponibilite] as string,
          fin: d[`${jourKey}_fin` as keyof Disponibilite] as string,
        },
      }));
  };

  const getPermanentStaff = () => {
    return employees.filter(e => 
      e.roles.some(r => ['Pharmacien titulaire', 'Pharmacien adjoint', 'Preparateur'].includes(r))
    );
  };

  const getSlotsForCreneau = (creneau: 'matin' | 'apres_midi') => {
    return planningSlots.filter(s => s.date === selectedDate && s.creneau === creneau);
  };

  // ============================================
  // DRAG & DROP
  // ============================================

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.employee) {
      setDraggedEmployee(active.data.current.employee);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedEmployee(null);

    if (!over) return;

    const employeeData = active.data.current;
    const dropData = over.data.current;

    if (!employeeData?.employee || !dropData?.creneau) return;

    const employee = employeeData.employee as Employee;
    const creneau = dropData.creneau as 'matin' | 'apres_midi';

    // Check duplicate
    const alreadyAssigned = planningSlots.some(
      s => s.employee_id === employee.id && s.date === selectedDate && s.creneau === creneau
    );

    if (alreadyAssigned) {
      showToast('Cet employé est déjà assigné à ce créneau', 'error');
      return;
    }

    // Default hours
    let defaultDebut: string = creneau === 'matin' ? HORAIRES.matin.debut : HORAIRES.apres_midi.debut;
    let defaultFin: string = creneau === 'matin' 
      ? HORAIRES.matin.fin 
      : (selectedDayIndex === 5 ? HORAIRES.samedi_apres_midi.fin : HORAIRES.apres_midi.fin);

    // Use dispo hours if available
    const dispo = employeeData.disponibilite;
    if (dispo && dispo.debut && dispo.fin) {
      if (creneau === 'matin') {
        if (dispo.debut >= HORAIRES.matin.debut) defaultDebut = dispo.debut;
        if (dispo.fin <= HORAIRES.matin.fin) defaultFin = dispo.fin;
      } else {
        if (dispo.debut >= HORAIRES.apres_midi.debut) defaultDebut = dispo.debut;
        defaultFin = dispo.fin;
      }
    }

    const newSlot: PlanningSlot = {
      id: generateSlotId(),
      employee_id: employee.id,
      employee,
      date: selectedDate,
      debut: defaultDebut,
      fin: defaultFin,
      creneau,
    };

    setPlanningSlots(prev => [...prev, newSlot]);
    showToast(`${employee.prenom} ajouté au ${creneau === 'matin' ? 'matin' : 'après-midi'}`);
  };

  // ============================================
  // SLOT ACTIONS
  // ============================================

  const removeSlot = (slotId: string) => {
    setPlanningSlots(prev => prev.filter(s => s.id !== slotId));
  };

  const updateSlotTime = (slotId: string, field: 'debut' | 'fin', value: string) => {
    setPlanningSlots(prev => prev.map(s => s.id === slotId ? { ...s, [field]: value } : s));
  };

  // ============================================
  // SAVE PLANNING
  // ============================================

  const handleSavePlanning = async () => {
    try {
      // Get all dates of the week
      const dates = JOURS.map((_, i) => getDateForDay(semaineDebut, i));

      // Delete existing planning for this week
      await supabase.from('planning').delete().in('date', dates);

      // Insert new slots
      if (planningSlots.length > 0) {
        const slotsToSave = planningSlots.map(s => ({
          employee_id: s.employee_id,
          date: s.date,
          debut: s.debut,
          fin: s.fin,
          creneau: s.creneau,
          valide: true,
        }));

        const { error } = await supabase.from('planning').insert(slotsToSave);
        if (error) throw error;
      }

      showToast('Planning enregistré avec succès !');
    } catch (err) {
      console.error('Save error:', err);
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  };

  // ============================================
  // ADD EMPLOYEE
  // ============================================

  const handleAddEmployee = async (employeeData: Omit<Employee, 'id' | 'actif'>) => {
    const { error } = await supabase.from('employees').insert([{
      ...employeeData,
      actif: true,
    }]);

    if (error) throw error;

    showToast('Membre ajouté avec succès !');
    fetchAllData();
  };

  // ============================================
  // DEMANDES ACTIONS
  // ============================================

  const handleDemandeAction = async (id: number, status: 'approuve' | 'refuse') => {
    await supabase.from('demandes').update({ status }).eq('id', id);
    showToast(status === 'approuve' ? 'Demande approuvée' : 'Demande refusée');
    fetchAllData();
  };

  // ============================================
  // WEEK NAVIGATION
  // ============================================

  const goToPreviousWeek = () => {
    const current = new Date(semaineDebut);
    current.setDate(current.getDate() - 7);
    setSemaineDebut(current.toISOString().split('T')[0]);
  };

  const goToNextWeek = () => {
    const current = new Date(semaineDebut);
    current.setDate(current.getDate() + 7);
    setSemaineDebut(current.toISOString().split('T')[0]);
  };

  const goToCurrentWeek = () => {
    setSemaineDebut(getMondayOfWeek(new Date()));
  };

  // ============================================
  // STATS
  // ============================================

  const stats = {
    totalEmployees: employees.length,
    etudiantsTotal: employees.filter(e => e.roles.includes('Etudiant') || e.roles.includes('Apprenti')).length,
    etudiantsRepondu: disponibilites.length,
    demandesEnAttente: demandes.filter(d => d.status === 'en_attente').length,
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="titulaire-page">
        {/* HEADER */}
        <header className="header">
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon">📅</span>
              <div>
                <h1>BaggPlanning</h1>
                <span>Espace Titulaire</span>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="week-nav">
              <button onClick={goToPreviousWeek}>←</button>
              <span>{formatDate(semaineDebut)} - {formatDate(getDateForDay(semaineDebut, 5))}</span>
              <button onClick={goToNextWeek}>→</button>
            </div>
            <button className="btn-today" onClick={goToCurrentWeek}>Aujourd'hui</button>
            <button className="btn-logout" onClick={() => { supabase.auth.signOut(); router.push('/auth/login'); }}>
              Déconnexion
            </button>
          </div>
        </header>

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon blue">👥</div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalEmployees}</span>
              <span className="stat-label">Employés actifs</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✅</div>
            <div className="stat-info">
              <span className="stat-value">{stats.etudiantsRepondu}/{stats.etudiantsTotal}</span>
              <span className="stat-label">Étudiants ont répondu</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow">⏳</div>
            <div className="stat-info">
              <span className="stat-value">{stats.etudiantsTotal - stats.etudiantsRepondu}</span>
              <span className="stat-label">En attente de réponse</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red">📋</div>
            <div className="stat-info">
              <span className="stat-value">{stats.demandesEnAttente}</span>
              <span className="stat-label">Demandes à traiter</span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs-container">
          <div className="tabs-header">
            <button className={`tab ${activeTab === 'disponibilites' ? 'active' : ''}`} onClick={() => setActiveTab('disponibilites')}>
              📊 Disponibilités
            </button>
            <button className={`tab ${activeTab === 'demandes' ? 'active' : ''}`} onClick={() => setActiveTab('demandes')}>
              📝 Demandes {stats.demandesEnAttente > 0 && <span className="badge">{stats.demandesEnAttente}</span>}
            </button>
            <button className={`tab ${activeTab === 'planning' ? 'active' : ''}`} onClick={() => setActiveTab('planning')}>
              📅 Planning
            </button>
            <button className={`tab ${activeTab === 'equipe' ? 'active' : ''}`} onClick={() => setActiveTab('equipe')}>
              👥 Équipe
            </button>
          </div>

          <div className="tabs-content">
            {/* ============================================
                TAB: PLANNING
                ============================================ */}
            {activeTab === 'planning' && (
              <div className="planning-view">
                {/* Sidebar */}
                <div className="planning-sidebar">
                  <div className="sidebar-card">
                    <div className="sidebar-header">
                      <h3>✋ Employés disponibles</h3>
                      <p>Glissez vers le planning</p>
                    </div>
                    <div className="sidebar-content">
                      {getEmployeesDisponibles().length === 0 ? (
                        <div className="empty-state-small">
                          <span>😕</span>
                          <p>Aucun employé disponible ce jour</p>
                        </div>
                      ) : (
                        getEmployeesDisponibles().map(emp => (
                          <DraggableEmployee key={emp.id} employee={emp} disponibilite={emp.disponibilite} />
                        ))
                      )}

                      <div className="sidebar-section">
                        <span className="section-title">PERSONNEL PERMANENT</span>
                        {getPermanentStaff().map(emp => (
                          <DraggableEmployee key={emp.id} employee={emp} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="sidebar-actions">
                    <button className="btn-primary" onClick={handleSavePlanning}>✓ Enregistrer le planning</button>
                    <button className="btn-secondary">📄 Exporter PDF</button>
                  </div>
                </div>

                {/* Main planning */}
                <div className="planning-main">
                  {/* Day tabs */}
                  <div className="day-tabs">
                    {JOURS.map((jour, i) => (
                      <button
                        key={i}
                        className={`day-tab ${selectedDayIndex === i ? 'active' : ''}`}
                        onClick={() => setSelectedDayIndex(i)}
                      >
                        <span className="day-name">{jour}</span>
                        <span className="day-date">{formatDate(getDateForDay(semaineDebut, i))}</span>
                      </button>
                    ))}
                  </div>

                  {/* Time ruler */}
                  <div className="time-ruler">
                    <span>8h30</span>
                    <span>10h</span>
                    <span>12h</span>
                    <span>14h</span>
                    <span>16h</span>
                    <span>18h</span>
                    <span>20h30</span>
                  </div>

                  {/* Drop zones - Matin & Après-midi on same row */}
                  <div className="planning-grid-single">
                    <DroppableZone id={`zone-matin-${selectedDate}`} creneau="matin" date={selectedDate}>
                      {getSlotsForCreneau('matin').map(slot => (
                        <AssignedCard key={slot.id} slot={slot} onRemove={removeSlot} onUpdateTime={updateSlotTime} />
                      ))}
                    </DroppableZone>

                    <DroppableZone id={`zone-apres-midi-${selectedDate}`} creneau="apres_midi" date={selectedDate}>
                      {getSlotsForCreneau('apres_midi').map(slot => (
                        <AssignedCard key={slot.id} slot={slot} onRemove={removeSlot} onUpdateTime={updateSlotTime} />
                      ))}
                    </DroppableZone>
                  </div>

                  {/* Legend */}
                  <div className="legend">
                    <div className="legend-item"><span className="dot green"></span> Pharmacien</div>
                    <div className="legend-item"><span className="dot blue"></span> Préparateur</div>
                    <div className="legend-item"><span className="dot yellow"></span> Étudiant</div>
                    <div className="legend-item"><span className="dot purple"></span> Apprenti</div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================
                TAB: DISPONIBILITES
                ============================================ */}
            {activeTab === 'disponibilites' && (
              <div className="disponibilites-view">
                <h2>Matrice des disponibilités</h2>
                {disponibilites.length === 0 ? (
                  <div className="empty-state">
                    <span>📭</span>
                    <h3>Aucune disponibilité reçue</h3>
                    <p>Les étudiants n'ont pas encore rempli leurs disponibilités pour cette semaine.</p>
                  </div>
                ) : (
                  <div className="dispo-table-wrapper">
                    <table className="dispo-table">
                      <thead>
                        <tr>
                          <th>Employé</th>
                          {JOURS.map((jour, i) => (
                            <th key={i}>{jour}<br/><small>{formatDate(getDateForDay(semaineDebut, i))}</small></th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {disponibilites.map(dispo => (
                          <tr key={dispo.id}>
                            <td className="employee-cell">
                              <div className="employee-mini">
                                <span className="avatar">{dispo.employee?.prenom?.[0]}{dispo.employee?.nom?.[0]}</span>
                                <span>{dispo.employee?.prenom} {dispo.employee?.nom}</span>
                              </div>
                            </td>
                            {JOURS_KEYS.map((jourKey, i) => {
                              const disponible = dispo[`${jourKey}_disponible` as keyof Disponibilite] as boolean;
                              const debut = dispo[`${jourKey}_debut` as keyof Disponibilite] as string;
                              const fin = dispo[`${jourKey}_fin` as keyof Disponibilite] as string;
                              return (
                                <td key={i} className={disponible ? 'dispo' : 'indispo'}>
                                  {disponible ? `${debut?.slice(0,5)} - ${fin?.slice(0,5)}` : '❌'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ============================================
                TAB: DEMANDES
                ============================================ */}
            {activeTab === 'demandes' && (
              <div className="demandes-view">
                <h2>Demandes à traiter</h2>
                {demandes.filter(d => d.status === 'en_attente').length === 0 ? (
                  <div className="empty-state">
                    <span>✅</span>
                    <h3>Aucune demande en attente</h3>
                    <p>Toutes les demandes ont été traitées.</p>
                  </div>
                ) : (
                  <div className="demandes-list">
                    {demandes.filter(d => d.status === 'en_attente').map(demande => (
                      <div key={demande.id} className={`demande-card ${demande.urgence ? 'urgent' : ''}`}>
                        <div className="demande-avatar">
                          {demande.employee?.prenom?.[0]}{demande.employee?.nom?.[0]}
                        </div>
                        <div className="demande-info">
                          <h4>{demande.employee?.prenom} {demande.employee?.nom}</h4>
                          <p className="demande-type">{demande.type}</p>
                          <p className="demande-dates">
                            {new Date(demande.date_debut).toLocaleDateString('fr-FR')}
                            {demande.date_fin && ` → ${new Date(demande.date_fin).toLocaleDateString('fr-FR')}`}
                          </p>
                          {demande.motif && <p className="demande-motif">{demande.motif}</p>}
                        </div>
                        <div className="demande-actions">
                          <button className="btn-approve" onClick={() => handleDemandeAction(demande.id, 'approuve')}>✓ Approuver</button>
                          <button className="btn-refuse" onClick={() => handleDemandeAction(demande.id, 'refuse')}>✕ Refuser</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================
                TAB: EQUIPE
                ============================================ */}
            {activeTab === 'equipe' && (
              <div className="equipe-view">
                <div className="equipe-header">
                  <h2>Équipe ({employees.length} membres)</h2>
                  <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Ajouter un membre</button>
                </div>
                <div className="equipe-grid">
                  {employees.map(emp => (
                    <div key={emp.id} className="equipe-card">
                      <div className="equipe-card-header">
                        <div className="equipe-avatar">
                          {emp.initiales || `${emp.prenom[0]}${emp.nom?.[0] || ''}`}
                        </div>
                        <div>
                          <h4>{emp.prenom} {emp.nom}</h4>
                          <div className="equipe-roles">
                            {emp.roles.map((role, i) => (
                              <span key={i} className="role-tag">{role}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="equipe-card-body">
                        {emp.email && <p>📧 {emp.email}</p>}
                        {emp.telephone && <p>📱 {emp.telephone}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {draggedEmployee && (
            <div className="drag-preview">
              <span>{draggedEmployee.initiales || `${draggedEmployee.prenom[0]}${draggedEmployee.nom?.[0]}`}</span>
              <span>{draggedEmployee.prenom}</span>
            </div>
          )}
        </DragOverlay>

        {/* Modal */}
        <AddEmployeeModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddEmployee} />

        {/* Toast */}
        {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
      </div>

      <style jsx>{`
        /* ============================================
           GLOBAL STYLES
           ============================================ */
        .titulaire-page {
          min-height: 100vh;
          background: #f1f5f9;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 16px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ============================================
           HEADER
           ============================================ */
        .header {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-left { display: flex; align-items: center; gap: 24px; }
        .header-right { display: flex; align-items: center; gap: 12px; }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
        }

        .logo-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #34d399, #059669);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .logo h1 { font-size: 20px; font-weight: 700; margin: 0; }
        .logo span { font-size: 12px; color: #94a3b8; }

        .week-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.1);
          padding: 8px 16px;
          border-radius: 10px;
        }

        .week-nav button {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 16px;
        }

        .week-nav button:hover { background: rgba(255,255,255,0.1); }
        .week-nav span { color: white; font-size: 14px; min-width: 160px; text-align: center; }

        .btn-today {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
        }

        .btn-logout {
          background: rgba(239,68,68,0.2);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
        }

        /* ============================================
           STATS
           ============================================ */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          padding: 24px 32px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .stat-icon.blue { background: #eff6ff; }
        .stat-icon.green { background: #ecfdf5; }
        .stat-icon.yellow { background: #fffbeb; }
        .stat-icon.red { background: #fef2f2; }

        .stat-info { display: flex; flex-direction: column; }
        .stat-value { font-size: 24px; font-weight: 700; color: #1e293b; }
        .stat-label { font-size: 13px; color: #64748b; }

        /* ============================================
           TABS
           ============================================ */
        .tabs-container {
          margin: 0 32px 32px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .tabs-header {
          display: flex;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .tab {
          flex: 1;
          padding: 16px;
          background: transparent;
          border: none;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          transition: all 0.2s;
        }

        .tab:hover { color: #1e293b; background: white; }
        .tab.active { color: #10b981; background: white; }
        .tab.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #10b981;
        }

        .badge {
          background: #ef4444;
          color: white;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .tabs-content { padding: 24px; }

        /* ============================================
           PLANNING VIEW
           ============================================ */
        .planning-view {
          display: flex;
          gap: 24px;
        }

        .planning-sidebar {
          width: 300px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .planning-main {
          flex: 1;
          min-width: 0;
        }

        .sidebar-card {
          background: #f8fafc;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .sidebar-header {
          background: linear-gradient(135deg, #10b981, #059669);
          padding: 16px;
          color: white;
        }

        .sidebar-header h3 { font-size: 14px; margin: 0; }
        .sidebar-header p { font-size: 12px; opacity: 0.8; margin: 4px 0 0; }

        .sidebar-content {
          padding: 12px;
          max-height: 400px;
          overflow-y: auto;
        }

        .sidebar-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .section-title {
          font-size: 10px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 8px;
        }

        .sidebar-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-secondary {
          background: white;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          cursor: pointer;
        }

        /* Employee draggable */
        .employee-card-draggable {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 8px;
          cursor: grab;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s;
        }

        .employee-card-draggable:hover {
          border-color: #10b981;
          background: #ecfdf5;
        }

        .employee-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .employee-info { flex: 1; min-width: 0; }
        .employee-name { font-size: 13px; font-weight: 600; color: #1e293b; }
        .employee-hours { font-size: 11px; color: #64748b; }
        .employee-roles { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
        .role-chip {
          font-size: 9px;
          background: #f1f5f9;
          color: #64748b;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .empty-state-small {
          text-align: center;
          padding: 24px;
          color: #94a3b8;
        }

        .empty-state-small span { font-size: 32px; }
        .empty-state-small p { margin-top: 8px; font-size: 13px; }

        /* Day tabs */
        .day-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .day-tab {
          flex: 1;
          padding: 12px 16px;
          background: #f8fafc;
          border: 2px solid transparent;
          border-radius: 10px;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
        }

        .day-tab:hover { background: #f1f5f9; }
        .day-tab.active {
          background: white;
          border-color: #10b981;
          box-shadow: 0 2px 8px rgba(16,185,129,0.2);
        }

        .day-name { display: block; font-weight: 600; font-size: 14px; color: #1e293b; }
        .day-date { display: block; font-size: 12px; color: #64748b; margin-top: 2px; }

        /* Time ruler */
        .time-ruler {
          display: flex;
          justify-content: space-between;
          padding: 8px 16px;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 11px;
          color: #94a3b8;
        }

        /* Planning grid */
        .planning-grid-single {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .drop-zone {
          background: white;
          border: 2px dashed #e2e8f0;
          border-radius: 12px;
          min-height: 300px;
          transition: all 0.2s;
        }

        .drop-zone.matin { border-color: #fbbf24; }
        .drop-zone.apres_midi { border-color: #3b82f6; }

        .drop-zone.drag-over {
          border-color: #10b981;
          background: #ecfdf5;
        }

        .drop-zone-header {
          padding: 12px 16px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .drop-zone.matin .drop-zone-header { background: #fef3c7; color: #92400e; border-radius: 10px 10px 0 0; }
        .drop-zone.apres_midi .drop-zone-header { background: #dbeafe; color: #1e40af; border-radius: 10px 10px 0 0; }

        .drop-zone-hours { font-size: 12px; font-weight: 400; opacity: 0.8; }

        .drop-zone-content { padding: 12px; }

        .drop-zone-placeholder {
          padding: 40px;
          text-align: center;
          color: #94a3b8;
          font-size: 13px;
        }

        /* Assigned card */
        .assigned-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 8px;
        }

        .assigned-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .assigned-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: white;
        }

        .assigned-name { flex: 1; font-size: 13px; font-weight: 600; color: #1e293b; }

        .remove-btn {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #fef2f2;
          border: none;
          color: #ef4444;
          cursor: pointer;
          font-size: 14px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .assigned-card:hover .remove-btn { opacity: 1; }
        .remove-btn:hover { background: #ef4444; color: white; }

        .assigned-time {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .assigned-time input {
          width: 70px;
          padding: 4px 8px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 12px;
          text-align: center;
        }

        .assigned-time span { color: #94a3b8; font-size: 12px; }

        /* Legend */
        .legend {
          display: flex;
          gap: 20px;
          margin-top: 16px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.green { background: #10b981; }
        .dot.blue { background: #3b82f6; }
        .dot.yellow { background: #f59e0b; }
        .dot.purple { background: #8b5cf6; }

        /* ============================================
           DISPONIBILITES VIEW
           ============================================ */
        .disponibilites-view h2, .demandes-view h2 {
          font-size: 18px;
          margin: 0 0 20px;
          color: #1e293b;
        }

        .empty-state {
          text-align: center;
          padding: 60px;
          color: #94a3b8;
        }

        .empty-state span { font-size: 48px; }
        .empty-state h3 { font-size: 16px; color: #64748b; margin: 16px 0 8px; }
        .empty-state p { font-size: 14px; }

        .dispo-table-wrapper { overflow-x: auto; }

        .dispo-table {
          width: 100%;
          border-collapse: collapse;
        }

        .dispo-table th, .dispo-table td {
          padding: 12px;
          text-align: center;
          border: 1px solid #e2e8f0;
        }

        .dispo-table th { background: #f8fafc; font-size: 13px; }
        .dispo-table th small { font-weight: 400; color: #94a3b8; }

        .employee-cell { text-align: left !important; }
        .employee-mini { display: flex; align-items: center; gap: 8px; }
        .employee-mini .avatar {
          width: 32px;
          height: 32px;
          background: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: 600;
        }

        .dispo { background: #ecfdf5; color: #065f46; font-size: 12px; }
        .indispo { background: #fef2f2; color: #991b1b; }

        /* ============================================
           DEMANDES VIEW
           ============================================ */
        .demandes-list { display: flex; flex-direction: column; gap: 12px; }

        .demande-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
        }

        .demande-card.urgent { border-left: 4px solid #ef4444; }

        .demande-avatar {
          width: 48px;
          height: 48px;
          background: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
        }

        .demande-info { flex: 1; }
        .demande-info h4 { font-size: 15px; margin: 0 0 4px; color: #1e293b; }
        .demande-type { font-size: 13px; color: #10b981; margin: 0 0 4px; }
        .demande-dates { font-size: 12px; color: #64748b; margin: 0; }
        .demande-motif { font-size: 12px; color: #94a3b8; margin: 4px 0 0; font-style: italic; }

        .demande-actions { display: flex; gap: 8px; }

        .btn-approve {
          background: #10b981;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
        }

        .btn-refuse {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fecaca;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
        }

        /* ============================================
           EQUIPE VIEW
           ============================================ */
        .equipe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .equipe-header h2 { margin: 0; font-size: 18px; }

        .equipe-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .equipe-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
        }

        .equipe-card-header {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .equipe-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 16px;
        }

        .equipe-card-header h4 { margin: 0 0 4px; font-size: 15px; color: #1e293b; }

        .equipe-roles { display: flex; flex-wrap: wrap; gap: 4px; }
        .role-tag {
          font-size: 10px;
          background: #e0f2fe;
          color: #0369a1;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .equipe-card-body { font-size: 13px; color: #64748b; }
        .equipe-card-body p { margin: 4px 0; }

        /* ============================================
           MODAL
           ============================================ */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 { margin: 0; font-size: 18px; }

        .modal-close {
          width: 32px;
          height: 32px;
          background: #f1f5f9;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
        }

        .modal-form { padding: 24px; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px; }

        .form-group input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
        }

        .form-group input:focus { outline: none; border-color: #10b981; }
        .form-group input.error { border-color: #ef4444; }

        .error-text { font-size: 12px; color: #ef4444; margin-top: 4px; display: block; }

        .roles-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .role-button {
          padding: 10px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .role-button:hover { border-color: #10b981; }
        .role-button.selected {
          background: #ecfdf5;
          border-color: #10b981;
          color: #065f46;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-cancel {
          background: #f1f5f9;
          color: #64748b;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-submit {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        /* ============================================
           DRAG PREVIEW & TOAST
           ============================================ */
        .drag-preview {
          background: white;
          padding: 12px 16px;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .drag-preview span:first-child {
          width: 32px;
          height: 32px;
          background: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #1e293b;
          color: white;
          padding: 14px 24px;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          z-index: 1001;
          animation: slideIn 0.3s ease;
        }

        .toast.success { background: #10b981; }
        .toast.error { background: #ef4444; }

        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 1024px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
          .planning-view { flex-direction: column; }
          .planning-sidebar { width: 100%; }
          .planning-grid-single { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .header { padding: 12px 16px; flex-direction: column; gap: 12px; }
          .stats-row { grid-template-columns: 1fr; padding: 16px; }
          .tabs-container { margin: 0 16px 16px; }
          .day-tabs { flex-wrap: wrap; }
          .day-tab { flex: 1 1 30%; }
        }
      `}</style>
    </DndContext>
  );
}