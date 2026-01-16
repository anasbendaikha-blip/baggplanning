"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Employee, Disponibilite, Planning, Demande } from '@/types/database';

export default function TitulairePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState("dispos");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [planning, setPlanning] = useState<Planning[]>([]);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  
  const [showModal, setShowModal] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("Etudiant");
  const [editData, setEditData] = useState<Employee | null>(null);
  const [deleteData, setDeleteData] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({ prenom: "", nom: "", email: "", tel: "" });
  
  const [selectedDay, setSelectedDay] = useState(0);
  const [showAddToPlanning, setShowAddToPlanning] = useState(false);
  const [planningForm, setPlanningForm] = useState({ employeeId: 0, debut: "08:30", fin: "14:00" });

  const getMondayOfWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  const [semaineDebut] = useState(getMondayOfWeek());

  const jours = [
    { nom: "Lundi", key: "lundi" },
    { nom: "Mardi", key: "mardi" },
    { nom: "Mercredi", key: "mercredi" },
    { nom: "Jeudi", key: "jeudi" },
    { nom: "Vendredi", key: "vendredi" },
    { nom: "Samedi", key: "samedi" },
  ];

  const heures = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"];

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!userData || userData.user_type !== 'titulaire') {
        router.push('/auth/login');
        return;
      }

      await Promise.all([
        loadEmployees(),
        loadDisponibilites(),
        loadPlanning(),
        loadDemandes(),
      ]);

      setLoading(false);
    };

    loadData();
  }, [router, semaineDebut]);

  const loadEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .order('role')
      .order('prenom');
    setEmployees(data || []);
  };

  const loadDisponibilites = async () => {
    const { data } = await supabase
      .from('disponibilites')
      .select('*, employees(*)')
      .eq('semaine_debut', semaineDebut);
    setDisponibilites(data || []);
  };

  const loadPlanning = async () => {
    const dateFin = new Date(semaineDebut);
    dateFin.setDate(dateFin.getDate() + 5);
    
    const { data } = await supabase
      .from('planning')
      .select('*, employees(*)')
      .gte('date', semaineDebut)
      .lte('date', dateFin.toISOString().split('T')[0]);
    setPlanning(data || []);
  };

  const loadDemandes = async () => {
    const { data } = await supabase
      .from('demandes')
      .select('*, employees(*)')
      .eq('status', 'en_attente')
      .order('urgent', { ascending: false })
      .order('created_at', { ascending: false });
    setDemandes(data || []);
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3500);
  };

  const getInitiales = (prenom: string, nom: string) => {
    if (nom) return prenom[0].toUpperCase() + nom[0].toUpperCase();
    return prenom.substring(0, 2).toUpperCase();
  };

  const getAvatarClass = (role: string) => {
    const classes: Record<string, string> = { 
      Pharmacien: "avatar-green", 
      Preparateur: "avatar-blue", 
      Apprenti: "avatar-purple", 
      Etudiant: "avatar-orange" 
    };
    return classes[role] || "avatar-orange";
  };

  const formatHeure = (h: string) => h?.replace(':', 'h') || '';

  const heureToMinutes = (h: string) => {
    const [hh, mm] = h.split(':').map(Number);
    return hh * 60 + mm;
  };

  const calculerDuree = (debut: string, fin: string) => {
    const diff = heureToMinutes(fin) - heureToMinutes(debut);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return m > 0 ? h + "h" + m.toString().padStart(2, "0") : h + "h";
  };

  const getDateForDay = (index: number) => {
    const d = new Date(semaineDebut);
    d.setDate(d.getDate() + index);
    return d.toISOString().split('T')[0];
  };

  const getDateLabel = (index: number) => {
    const d = new Date(semaineDebut);
    d.setDate(d.getDate() + index);
    return d.getDate() + " jan";
  };

  // CRUD Employés
  const openAddModal = () => {
    setFormData({ prenom: "", nom: "", email: "", tel: "" });
    setSelectedRole("Etudiant");
    setShowModal("add");
  };

  const openEditModal = (emp: Employee) => {
    setEditData(emp);
    setFormData({ prenom: emp.prenom, nom: emp.nom || "", email: emp.email || "", tel: emp.tel || "" });
    setSelectedRole(emp.role);
    setShowModal("edit");
  };

  const openDeleteModal = (emp: Employee) => {
    setDeleteData(emp);
    setShowModal("delete");
  };

  const addEmployee = async () => {
    if (!formData.prenom.trim()) { showToast("Veuillez entrer un prénom", "error"); return; }
    if (!formData.email.trim()) { showToast("Veuillez entrer un email", "error"); return; }

    const { error } = await supabase
      .from('employees')
      .insert([{ 
        prenom: formData.prenom, 
        nom: formData.nom, 
        email: formData.email, 
        tel: formData.tel, 
        role: selectedRole 
      }]);

    if (error) {
      showToast("Erreur: " + error.message, "error");
    } else {
      showToast(formData.prenom + " ajouté !");
      setShowModal(null);
      loadEmployees();
    }
  };

  const saveEmployee = async () => {
    if (!editData) return;
    if (!formData.prenom.trim()) { showToast("Veuillez entrer un prénom", "error"); return; }

    const { error } = await supabase
      .from('employees')
      .update({ 
        prenom: formData.prenom, 
        nom: formData.nom, 
        email: formData.email, 
        tel: formData.tel, 
        role: selectedRole 
      })
      .eq('id', editData.id);

    if (error) {
      showToast("Erreur: " + error.message, "error");
    } else {
      showToast(formData.prenom + " modifié !");
      setShowModal(null);
      loadEmployees();
    }
  };

  const confirmDelete = async () => {
    if (!deleteData) return;

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', deleteData.id);

    if (error) {
      showToast("Erreur: " + error.message, "error");
    } else {
      showToast(deleteData.prenom + " supprimé", "error");
      setShowModal(null);
      loadEmployees();
      loadPlanning();
    }
  };

  // Planning
  const dayPlanning = planning.filter(p => p.date === getDateForDay(selectedDay));
  const planningMatin = dayPlanning
    .filter(p => heureToMinutes(p.debut) < heureToMinutes("14:00"))
    .sort((a, b) => heureToMinutes(a.debut) - heureToMinutes(b.debut));
  const planningAprem = dayPlanning
    .filter(p => heureToMinutes(p.fin) > heureToMinutes("14:00"))
    .sort((a, b) => heureToMinutes(a.debut) - heureToMinutes(b.debut));

  const countPharmaciensMatin = planningMatin.filter(p => p.employees?.role === "Pharmacien").length;
  const countPharmacienAprem = planningAprem.filter(p => p.employees?.role === "Pharmacien").length;

  const employeesNotInPlanning = employees.filter(e => !dayPlanning.find(p => p.employee_id === e.id));

  const addToPlanning = async () => {
    if (!planningForm.employeeId) { showToast("Sélectionnez un employé", "error"); return; }

    const { error } = await supabase
      .from('planning')
      .insert([{
        employee_id: planningForm.employeeId,
        date: getDateForDay(selectedDay),
        debut: planningForm.debut,
        fin: planningForm.fin,
        valide: false,
      }]);

    if (error) {
      showToast("Erreur: " + error.message, "error");
    } else {
      showToast("Ajouté au planning !");
      setShowAddToPlanning(false);
      setPlanningForm({ employeeId: 0, debut: "08:30", fin: "14:00" });
      loadPlanning();
    }
  };

  const removeFromPlanning = async (planningId: number) => {
    const { error } = await supabase
      .from('planning')
      .delete()
      .eq('id', planningId);

    if (error) {
      showToast("Erreur: " + error.message, "error");
    } else {
      showToast("Retiré du planning");
      loadPlanning();
    }
  };

  const updatePlanningHours = async (planningId: number, field: 'debut' | 'fin', value: string) => {
    await supabase
      .from('planning')
      .update({ [field]: value })
      .eq('id', planningId);
    loadPlanning();
  };

  // Demandes
  const updateDemandeStatus = async (demandeId: number, status: 'approuve' | 'refuse') => {
    const { error } = await supabase
      .from('demandes')
      .update({ status })
      .eq('id', demandeId);

    if (error) {
      showToast("Erreur: " + error.message, "error");
    } else {
      showToast(status === 'approuve' ? "Demande approuvée !" : "Demande refusée");
      loadDemandes();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // Filtres employés
  const pharmaciens = employees.filter(e => e.role === "Pharmacien");
  const preparateurs = employees.filter(e => e.role === "Preparateur");
  const apprentis = employees.filter(e => e.role === "Apprenti");
  const etudiants = employees.filter(e => e.role === "Etudiant");

  // Disponibilités formatées
  const getDispoForEmployee = (employeeId: number) => {
    const dispo = disponibilites.find(d => d.employee_id === employeeId);
    if (!dispo) return null;
    return jours.map(jour => {
      const key = jour.key as keyof Disponibilite;
      const disponible = dispo[`${jour.key}_disponible` as keyof Disponibilite];
      const debut = dispo[`${jour.key}_debut` as keyof Disponibilite] as string;
      const fin = dispo[`${jour.key}_fin` as keyof Disponibilite] as string;
      if (!disponible) return "-";
      if (debut && fin) return formatHeure(debut) + "-" + formatHeure(fin);
      return "?";
    });
  };

  const etudiantsAvecDispos = etudiants.map(e => ({
    ...e,
    dispos: getDispoForEmployee(e.id),
    hasDispos: disponibilites.some(d => d.employee_id === e.id),
  }));

  const styles = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); min-height: 100vh; }
    .header { position: sticky; top: 0; z-index: 100; background: linear-gradient(135deg, #1e293b, #0f172a); color: white; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
    .header-content { max-width: 1400px; margin: 0 auto; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; }
    .logo-section { display: flex; align-items: center; gap: 12px; }
    .logo { width: 44px; height: 44px; background: linear-gradient(135deg, #34d399, #059669); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 4px 12px rgba(16,185,129,0.4); }
    .logo-text h1 { font-size: 18px; font-weight: 700; }
    .logo-text p { font-size: 12px; color: #94a3b8; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .notif-btn { position: relative; width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; font-size: 18px; }
    .notif-badge { position: absolute; top: -4px; right: -4px; width: 20px; height: 20px; background: #ef4444; border-radius: 50%; font-size: 11px; font-weight: 700; color: white; display: flex; align-items: center; justify-content: center; }
    .user-badge { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 10px; }
    .user-avatar-header { width: 32px; height: 32px; background: linear-gradient(135deg, #ec4899, #be185d); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
    .logout-btn { padding: 8px 14px; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: white; font-size: 13px; cursor: pointer; }
    .logout-btn:hover { background: rgba(255,255,255,0.2); }
    .nav { position: sticky; top: 68px; z-index: 90; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-bottom: 1px solid #e2e8f0; }
    .nav-content { max-width: 1400px; margin: 0 auto; padding: 8px 20px; display: flex; gap: 8px; flex-wrap: wrap; }
    .tab { padding: 10px 20px; border: none; background: none; border-radius: 10px; font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .tab:hover { background: #f1f5f9; }
    .tab.active { background: linear-gradient(135deg, #10b981, #059669); color: white; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
    .tab .badge { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; }
    .tab.active .badge { background: rgba(255,255,255,0.2); }
    .tab:not(.active) .badge { background: #e2e8f0; color: #64748b; }
    .tab:not(.active) .badge.alert { background: #fee2e2; color: #dc2626; }
    .main { max-width: 1400px; margin: 0 auto; padding: 24px 20px; }
    .view { display: none; }
    .view.active { display: block; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .page-title { font-size: 24px; font-weight: 800; color: #1e293b; }
    .page-subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .stat-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .stat-icon.green { background: linear-gradient(135deg, #d1fae5, #a7f3d0); }
    .stat-icon.yellow { background: linear-gradient(135deg, #fef3c7, #fde68a); }
    .stat-icon.blue { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
    .stat-icon.red { background: linear-gradient(135deg, #fee2e2, #fecaca); }
    .stat-value { font-size: 28px; font-weight: 800; color: #1e293b; }
    .stat-label { font-size: 13px; color: #64748b; }
    .card { background: white; border-radius: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); overflow: hidden; margin-bottom: 24px; }
    .card-header { padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .card-title { font-size: 18px; font-weight: 700; color: #1e293b; }
    .card-actions { display: flex; gap: 8px; }
    .btn { padding: 10px 16px; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-primary { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
    .btn-success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .btn-success:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
    .btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
    .btn-lg { padding: 14px 24px; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 14px 16px; font-weight: 600; color: #475569; background: #f8fafc; font-size: 13px; }
    td { padding: 14px 16px; border-top: 1px solid #f1f5f9; }
    tr:hover { background: #f8fafc; }
    .employee-cell { display: flex; align-items: center; gap: 12px; }
    .employee-avatar { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 700; }
    .avatar-orange { background: linear-gradient(135deg, #fb923c, #ea580c); }
    .avatar-yellow { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
    .avatar-green { background: linear-gradient(135deg, #34d399, #059669); }
    .avatar-blue { background: linear-gradient(135deg, #60a5fa, #2563eb); }
    .avatar-purple { background: linear-gradient(135deg, #a78bfa, #7c3aed); }
    .employee-name { font-weight: 600; color: #1e293b; }
    .employee-status { font-size: 12px; }
    .status-ok { color: #10b981; }
    .status-pending { color: #f59e0b; }
    .dispo-badge { display: inline-block; padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 500; }
    .dispo-badge.available { background: #d1fae5; color: #047857; }
    .dispo-badge.unavailable { background: #fee2e2; color: #dc2626; }
    .dispo-badge.pending { background: #fef3c7; color: #b45309; }
    .day-selector { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 24px; }
    .day-btn { padding: 16px 12px; border: 2px solid #e2e8f0; border-radius: 14px; background: white; cursor: pointer; text-align: center; font-family: inherit; transition: all 0.2s; }
    .day-btn:hover { border-color: #cbd5e1; }
    .day-btn.active { background: linear-gradient(135deg, #1e293b, #0f172a); border-color: transparent; color: white; }
    .day-btn .day-name { font-weight: 700; font-size: 14px; }
    .day-btn .day-date { font-size: 12px; opacity: 0.7; margin-top: 2px; }
    .day-btn .day-count { margin-top: 8px; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; display: inline-block; }
    .day-btn:not(.active) .day-count.ok { background: #d1fae5; color: #047857; }
    .day-btn:not(.active) .day-count.warning { background: #fef3c7; color: #b45309; }
    .day-btn.active .day-count { background: rgba(255,255,255,0.2); }
    .planning-container { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .planning-section { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .planning-section-header { padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; }
    .planning-section-header.matin { background: linear-gradient(135deg, #fef3c7, #fde68a); }
    .planning-section-header.aprem { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
    .section-left { display: flex; align-items: center; gap: 12px; }
    .section-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .section-icon.matin { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
    .section-icon.aprem { background: linear-gradient(135deg, #3b82f6, #2563eb); }
    .section-title { font-weight: 700; color: #1e293b; font-size: 16px; }
    .section-hours { font-size: 13px; color: #64748b; }
    .section-status { padding: 6px 14px; border-radius: 10px; font-size: 12px; font-weight: 600; }
    .section-status.ok { background: #d1fae5; color: #047857; }
    .section-status.warning { background: #fef3c7; color: #b45309; }
    .timeline-container { padding: 20px; }
    .planning-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 14px; margin-bottom: 10px; }
    .planning-item-avatar { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 700; }
    .planning-item-info { flex: 1; }
    .planning-item-name { font-weight: 600; color: #1e293b; font-size: 14px; }
    .planning-item-role { font-size: 12px; color: #64748b; }
    .planning-item-hours { display: flex; align-items: center; gap: 8px; }
    .planning-item-hours select { padding: 8px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: inherit; background: white; cursor: pointer; min-width: 85px; }
    .planning-item-duration { background: linear-gradient(135deg, #ecfdf5, #d1fae5); padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; color: #059669; }
    .planning-item-remove { width: 32px; height: 32px; border-radius: 8px; border: none; background: #fee2e2; color: #dc2626; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .add-employee-btn { width: 100%; padding: 14px; border: 2px dashed #cbd5e1; border-radius: 14px; background: none; color: #64748b; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .add-employee-btn:hover { border-color: #10b981; color: #10b981; background: #ecfdf5; }
    .demande-card { background: white; border-radius: 16px; margin-bottom: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .demande-header { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; gap: 12px; }
    .demande-header.urgent { background: linear-gradient(135deg, #fef3c7, #fde68a); }
    .demande-employee { display: flex; align-items: center; gap: 12px; }
    .demande-avatar { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: 700; }
    .demande-name { font-weight: 700; color: #1e293b; font-size: 16px; }
    .demande-role { font-size: 13px; color: #64748b; }
    .demande-type { padding: 8px 14px; border-radius: 10px; font-size: 13px; font-weight: 600; }
    .type-conge { background: #dbeafe; color: #1e40af; }
    .type-echange { background: #ede9fe; color: #5b21b6; }
    .type-maladie { background: #fee2e2; color: #991b1b; }
    .urgent-badge { background: #ef4444; color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-left: 8px; }
    .demande-body { padding: 20px; }
    .demande-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .demande-info { background: #f8fafc; padding: 14px; border-radius: 12px; }
    .demande-info-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
    .demande-info-value { font-weight: 600; color: #1e293b; }
    .demande-motif { background: #f8fafc; padding: 14px; border-radius: 12px; margin-bottom: 16px; }
    .demande-motif-text { color: #475569; font-style: italic; }
    .demande-actions { display: flex; gap: 12px; }
    .demande-actions .btn { flex: 1; justify-content: center; }
    .equipe-section-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
    .equipe-section-title { font-weight: 700; color: #1e293b; font-size: 16px; }
    .equipe-count { background: #e2e8f0; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #64748b; }
    .equipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding: 20px; }
    .equipe-card { background: #f8fafc; border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 14px; }
    .equipe-card-avatar { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: 700; }
    .equipe-card-info { flex: 1; }
    .equipe-card-name { font-weight: 700; color: #1e293b; font-size: 15px; }
    .equipe-card-role { font-size: 13px; color: #64748b; }
    .equipe-card-email { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .equipe-card-actions { display: flex; gap: 6px; }
    .equipe-card-btn { width: 38px; height: 38px; border-radius: 10px; border: none; cursor: pointer; font-size: 15px; display: flex; align-items: center; justify-content: center; }
    .equipe-card-btn.edit { background: #dbeafe; color: #2563eb; }
    .equipe-card-btn.delete { background: #fee2e2; color: #dc2626; }
    .modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 500; align-items: center; justify-content: center; padding: 20px; }
    .modal-overlay.active { display: flex; }
    .modal { background: white; border-radius: 24px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
    .modal-header { padding: 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-title { font-size: 20px; font-weight: 700; color: #1e293b; }
    .modal-close { width: 38px; height: 38px; border-radius: 10px; border: none; background: #f1f5f9; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; }
    .modal-body { padding: 24px; }
    .modal-footer { padding: 20px 24px; border-top: 1px solid #e2e8f0; display: flex; gap: 12px; justify-content: flex-end; }
    .form-group { margin-bottom: 20px; }
    .form-label { display: block; font-weight: 600; color: #334155; font-size: 14px; margin-bottom: 8px; }
    .form-input { width: 100%; padding: 14px 16px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-family: inherit; }
    .form-input:focus { outline: none; border-color: #10b981; background: white; }
    .form-select { width: 100%; padding: 14px 16px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-family: inherit; cursor: pointer; }
    .role-selector { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .role-option { padding: 16px; border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer; text-align: center; }
    .role-option:hover { border-color: #cbd5e1; }
    .role-option.selected { border-color: #10b981; background: #ecfdf5; }
    .role-option .role-icon { font-size: 28px; margin-bottom: 6px; }
    .role-option .role-name { font-weight: 600; font-size: 13px; }
    .confirm-text { font-size: 15px; color: #475569; text-align: center; padding: 20px 0; }
    .confirm-name { font-weight: 700; color: #1e293b; }
    .confirm-warning { background: #fef3c7; border-radius: 12px; padding: 14px; margin-top: 16px; display: flex; align-items: center; gap: 10px; font-size: 13px; color: #92400e; }
    .toast { position: fixed; bottom: 24px; right: 24px; padding: 16px 24px; border-radius: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 1000; opacity: 0; transform: translateY(20px); transition: all 0.3s; font-weight: 600; color: white; }
    .toast.success { background: linear-gradient(135deg, #10b981, #059669); }
    .toast.error { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .toast.active { opacity: 1; transform: translateY(0); }
    .loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; font-size: 18px; color: #64748b; }
    .empty-state { text-align: center; padding: 40px 20px; color: #64748b; }
    @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .planning-container { grid-template-columns: 1fr; } }
    @media (max-width: 768px) { .day-selector { grid-template-columns: repeat(3, 1fr); } .demande-info-grid { grid-template-columns: 1fr; } }
  `;

  if (loading) {
    return (
      <div>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">📅</div>
            <div className="logo-text"><h1>BaggPlanning</h1><p>Espace Titulaire</p></div>
          </div>
          <div className="header-right">
            <button className="notif-btn">🔔{demandes.length > 0 && <span className="notif-badge">{demandes.length}</span>}</button>
            <div className="user-badge"><div className="user-avatar-header">TI</div><span style={{ color: 'white' }}>Titulaire</span></div>
            <button className="logout-btn" onClick={handleLogout}>Déconnexion</button>
          </div>
        </div>
      </header>

      <nav className="nav">
        <div className="nav-content">
          <button className={`tab ${onglet === "dispos" ? "active" : ""}`} onClick={() => setOnglet("dispos")}>
            <span>✋</span><span>Disponibilités</span><span className="badge">{disponibilites.length}/{etudiants.length}</span>
          </button>
          <button className={`tab ${onglet === "demandes" ? "active" : ""}`} onClick={() => setOnglet("demandes")}>
            <span>📋</span><span>Demandes</span><span className={`badge ${demandes.length > 0 ? 'alert' : ''}`}>{demandes.length}</span>
          </button>
          <button className={`tab ${onglet === "planning" ? "active" : ""}`} onClick={() => setOnglet("planning")}>
            <span>📅</span><span>Planning</span>
          </button>
          <button className={`tab ${onglet === "equipe" ? "active" : ""}`} onClick={() => setOnglet("equipe")}>
            <span>👥</span><span>Équipe</span><span className="badge">{employees.length}</span>
          </button>
        </div>
      </nav>

      <main className="main">
        {/* VUE DISPONIBILITÉS */}
        <div className={`view ${onglet === "dispos" ? "active" : ""}`}>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon green">✅</div><div><div className="stat-value">{disponibilites.length}</div><div className="stat-label">Ont répondu</div></div></div>
            <div className="stat-card"><div className="stat-icon yellow">⏳</div><div><div className="stat-value">{etudiants.length - disponibilites.length}</div><div className="stat-label">En attente</div></div></div>
            <div className="stat-card"><div className="stat-icon blue">📊</div><div><div className="stat-value">{etudiants.length > 0 ? Math.round((disponibilites.length / etudiants.length) * 100) : 0}%</div><div className="stat-label">Taux de réponse</div></div></div>
            <div className="stat-card"><div className="stat-icon red">⏰</div><div><div className="stat-value">2j</div><div className="stat-label">Avant deadline</div></div></div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">📊 Matrice des disponibilités</div>
              <div className="card-actions">
                <button className="btn btn-secondary" onClick={loadDisponibilites}>🔄 Actualiser</button>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Étudiant</th>{jours.map(j => <th key={j.key}>{j.nom.substring(0,3)}</th>)}</tr></thead>
                <tbody>
                  {etudiantsAvecDispos.map(e => (
                    <tr key={e.id} style={!e.hasDispos ? { background: "#fef3c7" } : {}}>
                      <td>
                        <div className="employee-cell">
                          <div className={`employee-avatar ${e.hasDispos ? "avatar-orange" : "avatar-yellow"}`}>{getInitiales(e.prenom, e.nom)}</div>
                          <div>
                            <div className="employee-name">{e.prenom}</div>
                            <div className={`employee-status ${e.hasDispos ? "status-ok" : "status-pending"}`}>{e.hasDispos ? "✓ Rempli" : "⏳ En attente"}</div>
                          </div>
                        </div>
                      </td>
                      {(e.dispos || ["?","?","?","?","?","?"]).map((slot, i) => (
                        <td key={i}><span className={`dispo-badge ${slot === "?" ? "pending" : slot === "-" ? "unavailable" : "available"}`}>{slot}</span></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* VUE DEMANDES */}
        <div className={`view ${onglet === "demandes" ? "active" : ""}`}>
          <div className="page-header"><div><h2 className="page-title">📋 Demandes à traiter</h2><p className="page-subtitle">{demandes.length} demande(s) en attente</p></div></div>
          
          {demandes.length === 0 ? (
            <div className="card"><div className="empty-state">🎉 Aucune demande en attente</div></div>
          ) : (
            demandes.map(dem => (
              <div key={dem.id} className="demande-card">
                <div className={`demande-header ${dem.urgent ? "urgent" : ""}`}>
                  <div className="demande-employee">
                    <div className={`demande-avatar ${dem.type === "conge" ? "avatar-blue" : dem.type === "echange" ? "avatar-green" : "avatar-orange"}`}>
                      {dem.employees?.prenom?.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div className="demande-name">{dem.employees?.prenom} {dem.employees?.nom}</div>
                      <div className="demande-role">{dem.employees?.role}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span className={`demande-type type-${dem.type}`}>
                      {dem.type === "conge" && "🏖️ Congé"}
                      {dem.type === "echange" && "🔄 Échange"}
                      {dem.type === "maladie" && "🏥 Maladie"}
                      {dem.type === "autre" && "📋 Autre"}
                    </span>
                    {dem.urgent && <span className="urgent-badge">URGENT</span>}
                  </div>
                </div>
                <div className="demande-body">
                  <div className="demande-info-grid">
                    <div className="demande-info"><div className="demande-info-label">📅 Date</div><div className="demande-info-value">{new Date(dem.date_debut).toLocaleDateString('fr-FR')}</div></div>
                    <div className="demande-info"><div className="demande-info-label">🕐 Créneau</div><div className="demande-info-value">{dem.creneau}</div></div>
                    <div className="demande-info"><div className="demande-info-label">📆 Demandé</div><div className="demande-info-value">{dem.created_at ? new Date(dem.created_at).toLocaleDateString('fr-FR') : '-'}</div></div>
                  </div>
                  {dem.motif && <div className="demande-motif"><div className="demande-info-label">💬 Motif</div><div className="demande-motif-text">"{dem.motif}"</div></div>}
                  <div className="demande-actions">
                    <button className="btn btn-success" onClick={() => updateDemandeStatus(dem.id, 'approuve')}>✓ Approuver</button>
                    <button className="btn btn-secondary" onClick={() => updateDemandeStatus(dem.id, 'refuse')}>✗ Refuser</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* VUE PLANNING */}
        <div className={`view ${onglet === "planning" ? "active" : ""}`}>
          <div className="page-header">
            <div><h2 className="page-title">📅 Créer le planning</h2><p className="page-subtitle">Semaine du {new Date(semaineDebut).toLocaleDateString('fr-FR')}</p></div>
            <button className="btn btn-success btn-lg" onClick={() => showToast("Planning publié !")}>✓ Valider et publier</button>
          </div>

          <div className="day-selector">
            {jours.map((jour, i) => {
              const dayP = planning.filter(p => p.date === getDateForDay(i));
              const pharmCount = dayP.filter(p => p.employees?.role === "Pharmacien").length;
              return (
                <button key={i} className={`day-btn ${selectedDay === i ? "active" : ""}`} onClick={() => setSelectedDay(i)}>
                  <div className="day-name">{jour.nom}</div>
                  <div className="day-date">{getDateLabel(i)}</div>
                  <span className={`day-count ${pharmCount >= 2 ? "ok" : "warning"}`}>{pharmCount >= 2 ? `✓ ${dayP.length}` : `⚠️ ${pharmCount}`}</span>
                </button>
              );
            })}
          </div>

          <div className="planning-container">
            <div className="planning-section">
              <div className="planning-section-header matin">
                <div className="section-left">
                  <div className="section-icon matin">🌅</div>
                  <div><div className="section-title">MATIN</div><div className="section-hours">8h30 - 14h00</div></div>
                </div>
                <span className={`section-status ${countPharmaciensMatin >= 2 ? "ok" : "warning"}`}>{countPharmaciensMatin} pharmacien(s)</span>
              </div>
              <div className="timeline-container">
                {planningMatin.map(p => (
                  <div key={p.id} className="planning-item">
                    <div className={`planning-item-avatar ${getAvatarClass(p.employees?.role || '')}`}>{getInitiales(p.employees?.prenom || '', p.employees?.nom || '')}</div>
                    <div className="planning-item-info"><div className="planning-item-name">{p.employees?.prenom} {p.employees?.nom}</div><div className="planning-item-role">{p.employees?.role}</div></div>
                    <div className="planning-item-hours">
                      <select value={p.debut} onChange={(e) => updatePlanningHours(p.id, 'debut', e.target.value)}>{heures.map(h => <option key={h} value={h}>{formatHeure(h)}</option>)}</select>
                      <span style={{ color: "#94a3b8" }}>→</span>
                      <select value={p.fin} onChange={(e) => updatePlanningHours(p.id, 'fin', e.target.value)}>{heures.map(h => <option key={h} value={h}>{formatHeure(h)}</option>)}</select>
                    </div>
                    <div className="planning-item-duration">{calculerDuree(p.debut, p.fin)}</div>
                    <button className="planning-item-remove" onClick={() => removeFromPlanning(p.id)}>✕</button>
                  </div>
                ))}
                <button className="add-employee-btn" onClick={() => { setPlanningForm({ employeeId: 0, debut: "08:30", fin: "14:00" }); setShowAddToPlanning(true); }}>➕ Ajouter matin</button>
              </div>
            </div>

            <div className="planning-section">
              <div className="planning-section-header aprem">
                <div className="section-left">
                  <div className="section-icon aprem">🌆</div>
                  <div><div className="section-title">APRÈS-MIDI</div><div className="section-hours">14h00 - 20h30</div></div>
                </div>
                <span className={`section-status ${countPharmacienAprem >= 2 ? "ok" : "warning"}`}>{countPharmacienAprem} pharmacien(s)</span>
              </div>
              <div className="timeline-container">
                {planningAprem.map(p => (
                  <div key={p.id} className="planning-item">
                    <div className={`planning-item-avatar ${getAvatarClass(p.employees?.role || '')}`}>{getInitiales(p.employees?.prenom || '', p.employees?.nom || '')}</div>
                    <div className="planning-item-info"><div className="planning-item-name">{p.employees?.prenom} {p.employees?.nom}</div><div className="planning-item-role">{p.employees?.role}</div></div>
                    <div className="planning-item-hours">
                      <select value={p.debut} onChange={(e) => updatePlanningHours(p.id, 'debut', e.target.value)}>{heures.map(h => <option key={h} value={h}>{formatHeure(h)}</option>)}</select>
                      <span style={{ color: "#94a3b8" }}>→</span>
                      <select value={p.fin} onChange={(e) => updatePlanningHours(p.id, 'fin', e.target.value)}>{heures.map(h => <option key={h} value={h}>{formatHeure(h)}</option>)}</select>
                    </div>
                    <div className="planning-item-duration">{calculerDuree(p.debut, p.fin)}</div>
                    <button className="planning-item-remove" onClick={() => removeFromPlanning(p.id)}>✕</button>
                  </div>
                ))}
                <button className="add-employee-btn" onClick={() => { setPlanningForm({ employeeId: 0, debut: "14:00", fin: "20:30" }); setShowAddToPlanning(true); }}>➕ Ajouter après-midi</button>
              </div>
            </div>
          </div>
        </div>

        {/* VUE ÉQUIPE */}
        <div className={`view ${onglet === "equipe" ? "active" : ""}`}>
          <div className="page-header">
            <div><h2 className="page-title">👥 Gestion de l'équipe</h2><p className="page-subtitle">{employees.length} membres</p></div>
            <button className="btn btn-success btn-lg" onClick={openAddModal}>➕ Ajouter</button>
          </div>

          {[
            { title: "💊 Pharmaciens", data: pharmaciens, bg: "linear-gradient(135deg,#ecfdf5,#d1fae5)" },
            { title: "💉 Préparateurs", data: preparateurs, bg: "linear-gradient(135deg,#dbeafe,#bfdbfe)" },
            { title: "📚 Apprentis", data: apprentis, bg: "linear-gradient(135deg,#ede9fe,#ddd6fe)" },
            { title: "🎓 Étudiants", data: etudiants, bg: "linear-gradient(135deg,#fff7ed,#fed7aa)" },
          ].map(section => (
            <div key={section.title} className="card">
              <div className="equipe-section-header" style={{ background: section.bg }}>
                <div className="equipe-section-title">{section.title} <span className="equipe-count">{section.data.length}</span></div>
              </div>
              <div className="equipe-grid">
                {section.data.map(e => (
                  <div key={e.id} className="equipe-card">
                    <div className={`equipe-card-avatar ${getAvatarClass(e.role)}`}>{getInitiales(e.prenom, e.nom)}</div>
                    <div className="equipe-card-info">
                      <div className="equipe-card-name">{e.nom ? `${e.prenom} ${e.nom}` : e.prenom}</div>
                      <div className="equipe-card-role">{e.role}</div>
                      {e.email && <div className="equipe-card-email">📧 {e.email}</div>}
                    </div>
                    <div className="equipe-card-actions">
                      <button className="equipe-card-btn edit" onClick={() => openEditModal(e)}>✏️</button>
                      <button className="equipe-card-btn delete" onClick={() => openDeleteModal(e)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODALS */}
      <div className={`modal-overlay ${showModal === "add" ? "active" : ""}`} onClick={() => setShowModal(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><div className="modal-title">➕ Ajouter</div><button className="modal-close" onClick={() => setShowModal(null)}>✕</button></div>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Prénom *</label><input className="form-input" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" value={formData.tel} onChange={e => setFormData({...formData, tel: e.target.value})} /></div>
            <div className="form-group">
              <label className="form-label">Fonction</label>
              <div className="role-selector">
                {[{ id: "Pharmacien", icon: "💊" }, { id: "Preparateur", icon: "💉" }, { id: "Apprenti", icon: "📚" }, { id: "Etudiant", icon: "🎓" }].map(r => (
                  <div key={r.id} className={`role-option ${selectedRole === r.id ? "selected" : ""}`} onClick={() => setSelectedRole(r.id)}>
                    <div className="role-icon">{r.icon}</div><div className="role-name">{r.id}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(null)}>Annuler</button><button className="btn btn-success" onClick={addEmployee}>✓ Ajouter</button></div>
        </div>
      </div>

      <div className={`modal-overlay ${showModal === "edit" ? "active" : ""}`} onClick={() => setShowModal(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><div className="modal-title">✏️ Modifier</div><button className="modal-close" onClick={() => setShowModal(null)}>✕</button></div>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Prénom *</label><input className="form-input" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" value={formData.tel} onChange={e => setFormData({...formData, tel: e.target.value})} /></div>
            <div className="form-group">
              <label className="form-label">Fonction</label>
              <div className="role-selector">
                {[{ id: "Pharmacien", icon: "💊" }, { id: "Preparateur", icon: "💉" }, { id: "Apprenti", icon: "📚" }, { id: "Etudiant", icon: "🎓" }].map(r => (
                  <div key={r.id} className={`role-option ${selectedRole === r.id ? "selected" : ""}`} onClick={() => setSelectedRole(r.id)}>
                    <div className="role-icon">{r.icon}</div><div className="role-name">{r.id}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(null)}>Annuler</button><button className="btn btn-primary" onClick={saveEmployee}>💾 Enregistrer</button></div>
        </div>
      </div>

      <div className={`modal-overlay ${showModal === "delete" ? "active" : ""}`} onClick={() => setShowModal(null)}>
        <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><div className="modal-title">🗑️ Supprimer</div><button className="modal-close" onClick={() => setShowModal(null)}>✕</button></div>
          <div className="modal-body">
            <div className="confirm-text">Supprimer <span className="confirm-name">{deleteData?.prenom} {deleteData?.nom}</span> ?</div>
            <div className="confirm-warning">⚠️ Action irréversible</div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(null)}>Annuler</button><button className="btn btn-danger" onClick={confirmDelete}>🗑️ Supprimer</button></div>
        </div>
      </div>

      <div className={`modal-overlay ${showAddToPlanning ? "active" : ""}`} onClick={() => setShowAddToPlanning(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><div className="modal-title">➕ Ajouter au planning</div><button className="modal-close" onClick={() => setShowAddToPlanning(false)}>✕</button></div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Employé</label>
              <select className="form-select" value={planningForm.employeeId} onChange={e => setPlanningForm({...planningForm, employeeId: Number(e.target.value)})}>
                <option value={0}>-- Sélectionner --</option>
                {employeesNotInPlanning.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom} ({e.role})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Horaires</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <select className="form-select" style={{ flex: 1 }} value={planningForm.debut} onChange={e => setPlanningForm({...planningForm, debut: e.target.value})}>
                  {heures.map(h => <option key={h} value={h}>{formatHeure(h)}</option>)}
                </select>
                <span style={{ color: "#94a3b8" }}>→</span>
                <select className="form-select" style={{ flex: 1 }} value={planningForm.fin} onChange={e => setPlanningForm({...planningForm, fin: e.target.value})}>
                  {heures.map(h => <option key={h} value={h}>{formatHeure(h)}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowAddToPlanning(false)}>Annuler</button><button className="btn btn-success" onClick={addToPlanning}>✓ Ajouter</button></div>
        </div>
      </div>

      <div className={`toast ${toast.type} ${toast.visible ? "active" : ""}`}>
        <span>{toast.type === "success" ? "✓" : "✗"}</span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}