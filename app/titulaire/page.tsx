'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useDraggable, useDroppable } from '@dnd-kit/core';

import {
  useEmployees,
  useDisponibilites,
  usePlanning,
  useDemandes,
  useStats,
  supabase,
} from '@/lib/hooks';
import { exportPlanningToPDF, exportDisponibilitesToPDF } from '@/lib/export-pdf';
import type {
  Employee,
  Disponibilite,
  Planning,
  Demande,
  PlanningSlot,
  JourKey,
} from '@/types';
import { JOURS, JOURS_KEYS, HORAIRES } from '@/types';

import '@/styles/titulaire.css';

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

function formatWeekRange(mondayStr: string): string {
  const monday = new Date(mondayStr);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  
  const formatDate = (d: Date) => d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
  
  return `${formatDate(monday)} - ${formatDate(saturday)} ${monday.getFullYear()}`;
}

function getDateForDay(mondayStr: string, dayIndex: number): string {
  const monday = new Date(mondayStr);
  const date = new Date(monday);
  date.setDate(monday.getDate() + dayIndex);
  return date.toISOString().split('T')[0];
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

  const roleClass = employee.role.toLowerCase().replace('é', 'e');
  const initials = `${employee.prenom[0]}${employee.nom?.[0] || ''}`.toUpperCase();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`employee-draggable ${isDragging ? 'dragging' : ''}`}
    >
      <div className={`employee-avatar ${roleClass}`}>
        {initials}
      </div>
      <div className="employee-info">
        <div className="name">{employee.prenom} {employee.nom?.[0]}.</div>
        {disponibilite && (
          <div className="hours">
            {disponibilite.debut?.slice(0, 5)} - {disponibilite.fin?.slice(0, 5)}
          </div>
        )}
      </div>
      <span className={`employee-role-badge ${roleClass}`}>
        {employee.role}
      </span>
    </div>
  );
}

// ============================================
// DROPPABLE CELL COMPONENT
// ============================================

interface DroppableCellProps {
  id: string;
  date: string;
  creneau: 'matin' | 'apres_midi';
  children: React.ReactNode;
}

function DroppableCell({ id, date, creneau, children }: DroppableCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { date, creneau },
  });

  return (
    <div
      ref={setNodeRef}
      className={`planning-cell drop-zone ${isOver ? 'drag-over' : ''}`}
    >
      {children}
    </div>
  );
}

// ============================================
// ASSIGNED EMPLOYEE IN CELL
// ============================================

interface AssignedEmployeeCardProps {
  slot: PlanningSlot;
  onRemove: (slotId: string) => void;
  onUpdateTime: (slotId: string, field: 'debut' | 'fin', value: string) => void;
}

function AssignedEmployeeCard({ slot, onRemove, onUpdateTime }: AssignedEmployeeCardProps) {
  const roleClass = slot.employee.role.toLowerCase().replace('é', 'e');
  const initials = `${slot.employee.prenom[0]}${slot.employee.nom?.[0] || ''}`.toUpperCase();

  return (
    <div className="assigned-employee">
      <div className="employee-header">
        <div className={`employee-avatar ${roleClass}`} style={{ width: 28, height: 28, fontSize: 11 }}>
          {initials}
        </div>
        <span className="employee-name">
          {slot.employee.prenom} {slot.employee.nom?.[0]}.
        </span>
        <button
          className="remove-btn"
          onClick={() => onRemove(slot.id)}
          title="Retirer"
        >
          ×
        </button>
      </div>
      <div className="time-inputs">
        <input
          type="time"
          className="time-input"
          value={slot.debut}
          onChange={(e) => onUpdateTime(slot.id, 'debut', e.target.value)}
        />
        <span className="time-separator">→</span>
        <input
          type="time"
          className="time-input"
          value={slot.fin}
          onChange={(e) => onUpdateTime(slot.id, 'fin', e.target.value)}
        />
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function TitulairePage() {
  const router = useRouter();
  
  // Week navigation
  const [semaineDebut, setSemaineDebut] = useState(() => getMondayOfWeek(new Date()));
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'disponibilites' | 'demandes' | 'planning' | 'equipe'>('planning');
  
  // Planning state (local before save)
  const [planningSlots, setPlanningSlots] = useState<PlanningSlot[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null);
  
  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Hooks
  const { employees, loading: loadingEmployees, refetch: refetchEmployees, addEmployee, deleteEmployee } = useEmployees();
  const { disponibilites, loading: loadingDispos, getEmployeesDisponibles, getDispoForDay } = useDisponibilites(semaineDebut);
  const { planning, loading: loadingPlanning, saveBulkPlanning } = usePlanning(semaineDebut);
  const { demandes, loading: loadingDemandes, updateDemandeStatus, pendingCount, urgentCount } = useDemandes();
  
  // Stats
  const stats = useStats(semaineDebut, employees, disponibilites);
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load planning from DB into local state
  useEffect(() => {
    if (planning.length > 0) {
      const slots: PlanningSlot[] = planning.map((p) => ({
        id: `db-${p.id}`,
        employee_id: p.employee_id,
        employee: p.employees!,
        date: p.date,
        debut: p.debut,
        fin: p.fin,
        creneau: p.creneau === 'matin' ? 'matin' : 'apres_midi',
      }));
      setPlanningSlots(slots);
    } else {
      setPlanningSlots([]);
    }
  }, [planning]);

  // Show toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Week navigation
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

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };
// ============================================
// DRAG & DROP HANDLERS
// ============================================

const handleDragStart = (event: DragStartEvent) => {
  const { active } = event;
  setActiveId(active.id as string);
  
  if (active.data.current?.employee) {
    setDraggedEmployee(active.data.current.employee);
  }
};

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  setActiveId(null);
  setDraggedEmployee(null);

  if (!over) return;

  const employeeData = active.data.current;
  const dropData = over.data.current;

  if (!employeeData?.employee || !dropData?.date) return;

  const employee = employeeData.employee as Employee;
  const date = dropData.date as string;
  const creneau = dropData.creneau as 'matin' | 'apres_midi';

  // Check if already assigned to this slot
  const alreadyAssigned = planningSlots.some(
    (s) => s.employee_id === employee.id && s.date === date && s.creneau === creneau
  );

  if (alreadyAssigned) {
    showToast('Cet employé est déjà assigné à ce créneau', 'error');
    return;
  }

  // Get default hours based on disponibilite or default
  const jourIndex = JOURS_KEYS.findIndex((_, i) => getDateForDay(semaineDebut, i) === date);
  const jourKey = JOURS_KEYS[jourIndex];
  const dispo = getDispoForDay(employee.id, jourKey);
  
  // Initialize with default hours
  let defaultDebut: string = creneau === 'matin' ? HORAIRES.matin.debut : HORAIRES.apres_midi.debut;
  let defaultFin: string = creneau === 'matin' 
    ? HORAIRES.matin.fin 
    : (jourIndex === 5 ? HORAIRES.samedi_apres_midi.fin : HORAIRES.apres_midi.fin);
  
  // If we have dispo hours, use them as constraints
  if (dispo && dispo.debut && dispo.fin) {
    const dispoDebut: string = dispo.debut;
    const dispoFin: string = dispo.fin;
    
    if (creneau === 'matin') {
      defaultDebut = dispoDebut > HORAIRES.matin.debut ? dispoDebut : HORAIRES.matin.debut;
      defaultFin = dispoFin < HORAIRES.matin.fin ? dispoFin : HORAIRES.matin.fin;
    } else {
      defaultDebut = dispoDebut > HORAIRES.apres_midi.debut ? dispoDebut : HORAIRES.apres_midi.debut;
      defaultFin = dispoFin;
    }
  }

  // Add new slot
  const newSlot: PlanningSlot = {
    id: generateSlotId(),
    employee_id: employee.id,
    employee,
    date,
    debut: defaultDebut,
    fin: defaultFin,
    creneau,
  };

  setPlanningSlots((prev) => [...prev, newSlot]);
  showToast(`${employee.prenom} ajouté au planning`);
};

const handleDragOver = (event: DragOverEvent) => {
  // Optional: visual feedback while dragging
};

  // ============================================
  // PLANNING SLOT HANDLERS
  // ============================================

  const removeSlot = (slotId: string) => {
    setPlanningSlots((prev) => prev.filter((s) => s.id !== slotId));
  };

  const updateSlotTime = (slotId: string, field: 'debut' | 'fin', value: string) => {
    setPlanningSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, [field]: value } : s))
    );
  };

  // Save planning to database
  const handleSavePlanning = async () => {
    try {
      const slotsToSave = planningSlots.map((s) => ({
        employee_id: s.employee_id,
        date: s.date,
        debut: s.debut,
        fin: s.fin,
        creneau: s.creneau === 'matin' ? 'matin' : 'apres_midi',
        valide: true,
      }));

      await saveBulkPlanning(slotsToSave as any);
      showToast('Planning enregistré avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  };

  // ============================================
  // DEMANDES HANDLERS
  // ============================================

  const handleApproveDemande = async (id: number) => {
    await updateDemandeStatus(id, 'approuve');
    showToast('Demande approuvée');
  };

  const handleRefuseDemande = async (id: number) => {
    await updateDemandeStatus(id, 'refuse');
    showToast('Demande refusée');
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const getSlotsForCell = (date: string, creneau: 'matin' | 'apres_midi') => {
    return planningSlots.filter((s) => s.date === date && s.creneau === creneau);
  };

  // Get employees available for current day (sidebar)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const selectedJourKey = JOURS_KEYS[selectedDayIndex];
  const employeesDisponibles = getEmployeesDisponibles(selectedJourKey);

  // ============================================
  // LOADING STATE
  // ============================================

  if (loadingEmployees || loadingDispos || loadingPlanning) {
    return (
      <div className="titulaire-layout">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="titulaire-layout">
        {/* HEADER */}
        <header className="titulaire-header">
          <div className="titulaire-logo">
            <div className="titulaire-logo-icon">📅</div>
            <div className="titulaire-logo-text">
              <h1>BaggPlanning</h1>
              <span>Espace Titulaire</span>
            </div>
          </div>

          <div className="titulaire-user">
            <div className="titulaire-week-selector">
              <button onClick={goToPreviousWeek}>←</button>
              <span>{formatWeekRange(semaineDebut)}</span>
              <button onClick={goToNextWeek}>→</button>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={goToCurrentWeek}>
              Aujourd'hui
            </button>
            <button className="titulaire-logout" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="titulaire-content">
          {/* STATS */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon green">👥</div>
              <div className="stat-content">
                <h3>{stats.totalEmployees}</h3>
                <p>Employés actifs</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">✅</div>
              <div className="stat-content">
                <h3>{stats.etudiantsRepondu}/{stats.totalEtudiants}</h3>
                <p>Étudiants ont répondu</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow">⏳</div>
              <div className="stat-content">
                <h3>{stats.etudiantsEnAttente}</h3>
                <p>En attente de réponse</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">📋</div>
              <div className="stat-content">
                <h3>{pendingCount}</h3>
                <p>Demandes à traiter {urgentCount > 0 && <span style={{color: 'var(--color-danger)'}}>({urgentCount} urgentes)</span>}</p>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="tabs-container">
            <div className="tabs-header">
              <button
                className={`tab-button ${activeTab === 'disponibilites' ? 'active' : ''}`}
                onClick={() => setActiveTab('disponibilites')}
              >
                📊 Disponibilités
              </button>
              <button
                className={`tab-button ${activeTab === 'demandes' ? 'active' : ''}`}
                onClick={() => setActiveTab('demandes')}
              >
                📝 Demandes
                {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
              </button>
              <button
                className={`tab-button ${activeTab === 'planning' ? 'active' : ''}`}
                onClick={() => setActiveTab('planning')}
              >
                📅 Planning
              </button>
              <button
                className={`tab-button ${activeTab === 'equipe' ? 'active' : ''}`}
                onClick={() => setActiveTab('equipe')}
              >
                👥 Équipe
              </button>
            </div>

            <div className="tab-content">
              {/* ============================================
                  TAB: PLANNING
                  ============================================ */}
              {activeTab === 'planning' && (
                <div className="planning-container">
                  {/* Sidebar: Available employees */}
                  <div className="planning-sidebar">
                    <div className="sidebar-card">
                      <div className="sidebar-header">
                        <h3>✋ Employés disponibles</h3>
                        <p>Glissez vers le planning</p>
                      </div>
                      
                      {/* Day selector */}
                      <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                        <select
                          value={selectedDayIndex}
                          onChange={(e) => setSelectedDayIndex(Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            fontSize: '13px',
                          }}
                        >
                          {JOURS.map((jour, i) => (
                            <option key={i} value={i}>
                              {jour} {new Date(getDateForDay(semaineDebut, i)).getDate()}/{new Date(getDateForDay(semaineDebut, i)).getMonth() + 1}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sidebar-content">
                        {employeesDisponibles.length === 0 ? (
                          <div className="empty-state" style={{ padding: '24px' }}>
                            <div className="empty-state-icon">😕</div>
                            <p>Aucun employé disponible ce jour</p>
                          </div>
                        ) : (
                          employeesDisponibles.map((emp) => (
                            <DraggableEmployee
                              key={emp.id}
                              employee={emp}
                              disponibilite={emp.disponibilite}
                            />
                          ))
                        )}
                        
                        {/* Also show permanent staff */}
                        <div style={{ 
                          marginTop: '16px', 
                          paddingTop: '16px', 
                          borderTop: '1px solid var(--color-border)' 
                        }}>
                          <p style={{ 
                            fontSize: '11px', 
                            color: 'var(--color-text-muted)', 
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Personnel permanent
                          </p>
                          {employees
                            .filter((e) => e.role === 'Pharmacien' || e.role === 'Preparateur')
                            .map((emp) => (
                              <DraggableEmployee key={emp.id} employee={emp} />
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button className="btn btn-primary btn-lg" onClick={handleSavePlanning}>
                        ✓ Enregistrer le planning
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => exportPlanningToPDF({
                          planning: planningSlots.map(s => ({
                            ...s,
                            id: 0,
                            employees: s.employee,
                            valide: true,
                            creneau: s.creneau,
                          })) as any,
                          semaineDebut,
                          pharmacieName: 'Pharmacie',
                        })}
                      >
                        📄 Exporter PDF
                      </button>
                    </div>
                  </div>

                  {/* Main: Planning grid */}
                  <div className="planning-main">
                    <div className="planning-grid">
                      {/* Header with days */}
                      <div className="planning-grid-header">
                        {JOURS.map((jour, i) => {
                          const date = new Date(getDateForDay(semaineDebut, i));
                          return (
                            <div key={i} className="planning-day-header">
                              <div className="day-name">{jour}</div>
                              <div className="day-date">
                                {date.getDate()}/{date.getMonth() + 1}
                              </div>
                            </div>
                          );
                        })}
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

                      {/* MATIN Row */}
                      <div className="planning-row-header matin">
                        🌅 MATIN (8h30 - 14h00)
                      </div>
                      <div className="planning-row">
                        {JOURS.map((_, i) => {
                          const date = getDateForDay(semaineDebut, i);
                          const cellId = `cell-${date}-matin`;
                          const slots = getSlotsForCell(date, 'matin');

                          return (
                            <DroppableCell
                              key={cellId}
                              id={cellId}
                              date={date}
                              creneau="matin"
                            >
                              {slots.map((slot) => (
                                <AssignedEmployeeCard
                                  key={slot.id}
                                  slot={slot}
                                  onRemove={removeSlot}
                                  onUpdateTime={updateSlotTime}
                                />
                              ))}
                            </DroppableCell>
                          );
                        })}
                      </div>

                      {/* APRES-MIDI Row */}
                      <div className="planning-row-header apres-midi">
                        🌆 APRÈS-MIDI (14h00 - 20h30)
                      </div>
                      <div className="planning-row">
                        {JOURS.map((_, i) => {
                          const date = getDateForDay(semaineDebut, i);
                          const cellId = `cell-${date}-apres_midi`;
                          const slots = getSlotsForCell(date, 'apres_midi');

                          return (
                            <DroppableCell
                              key={cellId}
                              id={cellId}
                              date={date}
                              creneau="apres_midi"
                            >
                              {slots.map((slot) => (
                                <AssignedEmployeeCard
                                  key={slot.id}
                                  slot={slot}
                                  onRemove={removeSlot}
                                  onUpdateTime={updateSlotTime}
                                />
                              ))}
                            </DroppableCell>
                          );
                        })}
                      </div>
                    </div>

                    {/* Legend */}
                    <div style={{
                      marginTop: '16px',
                      padding: '12px 16px',
                      background: 'var(--color-surface-hover)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      display: 'flex',
                      gap: '24px',
                    }}>
                      <span><span className="employee-avatar pharmacien" style={{ width: 20, height: 20, fontSize: 10, display: 'inline-flex', marginRight: 4 }}>P</span> Pharmacien</span>
                      <span><span className="employee-avatar preparateur" style={{ width: 20, height: 20, fontSize: 10, display: 'inline-flex', marginRight: 4 }}>P</span> Préparateur</span>
                      <span><span className="employee-avatar etudiant" style={{ width: 20, height: 20, fontSize: 10, display: 'inline-flex', marginRight: 4 }}>E</span> Étudiant</span>
                      <span><span className="employee-avatar apprenti" style={{ width: 20, height: 20, fontSize: 10, display: 'inline-flex', marginRight: 4 }}>A</span> Apprenti</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================
                  TAB: DISPONIBILITES
                  ============================================ */}
              {activeTab === 'disponibilites' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                      Matrice des disponibilités - Semaine du {new Date(semaineDebut).toLocaleDateString('fr-FR')}
                    </h2>
                    <button
                      className="btn btn-secondary"
                      onClick={() => exportDisponibilitesToPDF(disponibilites, employees, semaineDebut)}
                    >
                      📄 Exporter PDF
                    </button>
                  </div>

                  {disponibilites.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      <h3>Aucune disponibilité reçue</h3>
                      <p>Les étudiants n'ont pas encore rempli leurs disponibilités pour cette semaine.</p>
                    </div>
                  ) : (
                    <div className="dispo-matrix">
                      <table className="dispo-table">
                        <thead>
                          <tr>
                            <th className="employee-col">Employé</th>
                            {JOURS.map((jour, i) => (
                              <th key={i}>
                                {jour}<br />
                                <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>
                                  {new Date(getDateForDay(semaineDebut, i)).getDate()}/{new Date(getDateForDay(semaineDebut, i)).getMonth() + 1}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {employees
                            .filter((e) => e.role === 'Etudiant' || e.role === 'Apprenti')
                            .map((emp) => {
                              const dispo = disponibilites.find((d) => d.employee_id === emp.id);
                              return (
                                <tr key={emp.id}>
                                  <td className="employee-col">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <div className={`employee-avatar ${emp.role.toLowerCase()}`} style={{ width: 32, height: 32, fontSize: 12 }}>
                                        {emp.prenom[0]}{emp.nom?.[0]}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 600 }}>{emp.prenom} {emp.nom}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{emp.role}</div>
                                      </div>
                                    </div>
                                  </td>
                                  {JOURS_KEYS.map((jourKey, i) => {
                                    if (!dispo) {
                                      return (
                                        <td key={i}>
                                          <span className="dispo-cell en-attente">⏳ En attente</span>
                                        </td>
                                      );
                                    }
                                    const disponible = dispo[`${jourKey}_disponible` as keyof Disponibilite] as boolean;
                                    const debut = dispo[`${jourKey}_debut` as keyof Disponibilite] as string;
                                    const fin = dispo[`${jourKey}_fin` as keyof Disponibilite] as string;

                                    if (!disponible) {
                                      return (
                                        <td key={i}>
                                          <span className="dispo-cell non-disponible">❌ Indispo</span>
                                        </td>
                                      );
                                    }

                                    return (
                                      <td key={i}>
                                        <span className="dispo-cell disponible">
                                          ✅ {debut?.slice(0, 5)} - {fin?.slice(0, 5)}
                                        </span>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
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
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                    Demandes à traiter ({pendingCount})
                  </h2>

                  {demandes.filter((d) => d.status === 'en_attente').length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">✅</div>
                      <h3>Aucune demande en attente</h3>
                      <p>Toutes les demandes ont été traitées.</p>
                    </div>
                  ) : (
                    <div className="demandes-list">
                      {demandes
                        .filter((d) => d.status === 'en_attente')
                        .map((demande) => (
                          <div
                            key={demande.id}
                            className={`demande-card ${demande.urgence ? 'urgente' : ''}`}
                          >
                            <div className="demande-avatar">
                              {demande.employees?.prenom[0]}{demande.employees?.nom?.[0]}
                            </div>
                            <div className="demande-info">
                              <h4>
                                {demande.employees?.prenom} {demande.employees?.nom}
                                <span className={`demande-badge ${demande.type}`}>
                                  {demande.type === 'conge' && '🏖️ Congé'}
                                  {demande.type === 'absence' && '🏥 Absence'}
                                  {demande.type === 'echange' && '🔄 Échange'}
                                  {demande.type === 'autre' && '📋 Autre'}
                                </span>
                                {demande.urgence && <span className="demande-badge urgente">⚠️ Urgent</span>}
                              </h4>
                              <p>{demande.motif || 'Pas de motif précisé'}</p>
                              <div className="date">
                                📅 {new Date(demande.date_debut).toLocaleDateString('fr-FR')}
                                {demande.date_fin && demande.date_fin !== demande.date_debut && (
                                  <> → {new Date(demande.date_fin).toLocaleDateString('fr-FR')}</>
                                )}
                                {demande.creneau && ` (${demande.creneau})`}
                              </div>
                            </div>
                            <div className="demande-actions">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleApproveDemande(demande.id)}
                              >
                                ✓ Approuver
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleRefuseDemande(demande.id)}
                              >
                                ✕ Refuser
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Historique */}
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '32px', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                    Historique des demandes traitées
                  </h3>
                  <div className="demandes-list">
                    {demandes
                      .filter((d) => d.status !== 'en_attente')
                      .slice(0, 5)
                      .map((demande) => (
                        <div key={demande.id} className="demande-card" style={{ opacity: 0.7 }}>
                          <div className="demande-avatar">
                            {demande.employees?.prenom[0]}{demande.employees?.nom?.[0]}
                          </div>
                          <div className="demande-info">
                            <h4>
                              {demande.employees?.prenom} {demande.employees?.nom}
                              <span className={`demande-badge ${demande.type}`}>
                                {demande.type}
                              </span>
                            </h4>
                            <p>{demande.motif || 'Pas de motif précisé'}</p>
                          </div>
                          <span
                            className={`demande-badge`}
                            style={{
                              background: demande.status === 'approuve' ? 'var(--color-primary-bg)' : 'var(--color-danger-bg)',
                              color: demande.status === 'approuve' ? 'var(--color-primary-dark)' : 'var(--color-danger)',
                            }}
                          >
                            {demande.status === 'approuve' ? '✓ Approuvée' : '✕ Refusée'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ============================================
                  TAB: EQUIPE
                  ============================================ */}
              {activeTab === 'equipe' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                      Équipe ({employees.length} membres)
                    </h2>
                    <button className="btn btn-primary">
                      + Ajouter un membre
                    </button>
                  </div>

                  <div className="equipe-grid">
                    {employees.map((emp) => {
                      const roleClass = emp.role.toLowerCase().replace('é', 'e');
                      return (
                        <div key={emp.id} className="employee-card">
                          <div className="employee-card-header">
                            <div className={`employee-card-avatar ${roleClass}`}>
                              {emp.prenom[0]}{emp.nom?.[0]}
                            </div>
                            <div className="employee-card-info">
                              <h4>{emp.prenom} {emp.nom}</h4>
                              <p>
                                <span className={`employee-role-badge ${roleClass}`}>
                                  {emp.role}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="employee-card-contact">
                            {emp.email && <span>📧 {emp.email}</span>}
                            {emp.telephone && <span>📱 {emp.telephone}</span>}
                          </div>
                          <div className="employee-card-actions">
                            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                              ✏️ Modifier
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                if (confirm('Supprimer cet employé ?')) {
                                  deleteEmployee(emp.id);
                                }
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Drag overlay */}
        <DragOverlay>
          {draggedEmployee && (
            <div className="employee-draggable" style={{ opacity: 0.9, boxShadow: 'var(--shadow-lg)' }}>
              <div className={`employee-avatar ${draggedEmployee.role.toLowerCase().replace('é', 'e')}`}>
                {draggedEmployee.prenom[0]}{draggedEmployee.nom?.[0]}
              </div>
              <div className="employee-info">
                <div className="name">{draggedEmployee.prenom} {draggedEmployee.nom?.[0]}.</div>
              </div>
            </div>
          )}
        </DragOverlay>

        {/* Toast */}
        {toast && (
          <div className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        )}
      </div>
    </DndContext>
  );
}
