"use client";
import { useState } from "react";

export default function TitulairePage() {
  const [onglet, setOnglet] = useState("dispos");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [showModal, setShowModal] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("Etudiant");
  const [editData, setEditData] = useState<any>(null);
  const [deleteData, setDeleteData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showAddToPlanning, setShowAddToPlanning] = useState<string | null>(null);

  const [employees, setEmployees] = useState([
    { id: 1, prenom: "Lina", nom: "Martin", role: "Pharmacien", email: "lina@pharmacie.fr", tel: "06 11 22 33 44" },
    { id: 2, prenom: "Maryam", nom: "Benali", role: "Pharmacien", email: "maryam@pharmacie.fr", tel: "" },
    { id: 3, prenom: "Laura", nom: "Dubois", role: "Pharmacien", email: "laura@pharmacie.fr", tel: "" },
    { id: 4, prenom: "Sarah", nom: "Lambert", role: "Pharmacien", email: "sarah@pharmacie.fr", tel: "" },
    { id: 5, prenom: "Dilek", nom: "Yilmaz", role: "Preparateur", email: "dilek@pharmacie.fr", tel: "" },
    { id: 6, prenom: "Hamide", nom: "Kaya", role: "Preparateur", email: "hamide@pharmacie.fr", tel: "" },
    { id: 7, prenom: "Ludovic", nom: "Petit", role: "Preparateur", email: "ludovic@pharmacie.fr", tel: "" },
    { id: 8, prenom: "Manon", nom: "Roux", role: "Apprenti", email: "manon@pharmacie.fr", tel: "" },
    { id: 9, prenom: "Anas", nom: "", role: "Etudiant", email: "anas@email.com", tel: "06 12 34 56 78" },
    { id: 10, prenom: "Celya", nom: "", role: "Etudiant", email: "celya@email.com", tel: "" },
    { id: 11, prenom: "Nicolas", nom: "", role: "Etudiant", email: "nicolas@email.com", tel: "" },
    { id: 12, prenom: "Maissa", nom: "", role: "Etudiant", email: "maissa@email.com", tel: "" },
    { id: 13, prenom: "Robin", nom: "", role: "Etudiant", email: "robin@email.com", tel: "" },
    { id: 14, prenom: "Jean-Baptiste", nom: "", role: "Etudiant", email: "jb@email.com", tel: "" },
    { id: 15, prenom: "Matteo", nom: "", role: "Etudiant", email: "matteo@email.com", tel: "" },
  ]);

  const [planning, setPlanning] = useState<Record<number, Array<{ employeeId: number; debut: string; fin: string }>>>({
    0: [
      { employeeId: 1, debut: "08:30", fin: "14:00" },
      { employeeId: 2, debut: "08:30", fin: "14:00" },
      { employeeId: 5, debut: "08:30", fin: "14:00" },
      { employeeId: 8, debut: "08:30", fin: "12:00" },
      { employeeId: 3, debut: "14:00", fin: "20:30" },
      { employeeId: 4, debut: "14:00", fin: "20:30" },
      { employeeId: 6, debut: "14:00", fin: "20:30" },
      { employeeId: 9, debut: "17:00", fin: "20:30" },
    ],
    1: [
      { employeeId: 1, debut: "08:30", fin: "14:00" },
      { employeeId: 3, debut: "08:30", fin: "20:30" },
      { employeeId: 5, debut: "08:30", fin: "14:00" },
      { employeeId: 2, debut: "14:00", fin: "20:30" },
      { employeeId: 9, debut: "17:00", fin: "20:30" },
    ],
    2: [
      { employeeId: 2, debut: "08:30", fin: "14:00" },
      { employeeId: 4, debut: "08:30", fin: "20:30" },
      { employeeId: 7, debut: "08:30", fin: "14:00" },
      { employeeId: 1, debut: "14:00", fin: "20:30" },
      { employeeId: 10, debut: "14:00", fin: "20:30" },
    ],
    3: [
      { employeeId: 3, debut: "08:30", fin: "14:00" },
      { employeeId: 4, debut: "08:30", fin: "14:00" },
      { employeeId: 6, debut: "08:30", fin: "20:30" },
      { employeeId: 1, debut: "14:00", fin: "20:30" },
      { employeeId: 12, debut: "14:00", fin: "20:30" },
    ],
    4: [
      { employeeId: 2, debut: "08:30", fin: "14:00" },
      { employeeId: 3, debut: "08:30", fin: "14:00" },
      { employeeId: 5, debut: "08:30", fin: "20:30" },
      { employeeId: 1, debut: "14:00", fin: "20:30" },
      { employeeId: 4, debut: "14:00", fin: "20:30" },
      { employeeId: 9, debut: "14:00", fin: "20:30" },
    ],
    5: [
      { employeeId: 1, debut: "08:30", fin: "14:00" },
      { employeeId: 4, debut: "08:30", fin: "14:00" },
      { employeeId: 6, debut: "08:30", fin: "19:30" },
      { employeeId: 9, debut: "08:30", fin: "14:00" },
      { employeeId: 2, debut: "14:00", fin: "19:30" },
      { employeeId: 3, debut: "14:00", fin: "19:30" },
      { employeeId: 10, debut: "14:00", fin: "19:30" },
    ],
  });

  const [formData, setFormData] = useState({ prenom: "", nom: "", email: "", tel: "" });
  const [planningForm, setPlanningForm] = useState({ employeeId: 0, debut: "08:30", fin: "14:00" });

  const jours = [
    { nom: "Lundi", date: "20 jan", shortDate: "20" },
    { nom: "Mardi", date: "21 jan", shortDate: "21" },
    { nom: "Mercredi", date: "22 jan", shortDate: "22" },
    { nom: "Jeudi", date: "23 jan", shortDate: "23" },
    { nom: "Vendredi", date: "24 jan", shortDate: "24" },
    { nom: "Samedi", date: "25 jan", shortDate: "25" },
  ];

  const heures = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"];

  const dispoData: Record<number, string[]> = {
    9: ["17h-20h30", "-", "-", "-", "14h-20h30", "8h30-14h"],
    10: ["17h-20h30", "-", "14h-20h30", "-", "17h-20h30", "14h-19h30"],
    11: ["14h-20h30", "-", "17h-20h30", "-", "-", "14h-19h30"],
    12: ["17h-20h30", "-", "-", "14h-20h30", "17h-20h30", "14h-19h30"],
    13: ["8h30-14h", "-", "8h30-20h30", "-", "-", "8h30-14h"],
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
    const classes: Record<string, string> = { Pharmacien: "avatar-green", Preparateur: "avatar-blue", Apprenti: "avatar-purple", Etudiant: "avatar-orange" };
    return classes[role] || "avatar-orange";
  };

  const formatHeure = (h: string) => h.replace(":", "h");

  const heureToMinutes = (h: string) => {
    const [hh, mm] = h.split(":").map(Number);
    return hh * 60 + mm;
  };

  const calculerDuree = (debut: string, fin: string) => {
    const diff = heureToMinutes(fin) - heureToMinutes(debut);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return m > 0 ? h + "h" + m.toString().padStart(2, "0") : h + "h";
  };

  const getEmployeeById = (id: number) => employees.find(e => e.id === id);

  const openAddModal = () => {
    setFormData({ prenom: "", nom: "", email: "", tel: "" });
    setSelectedRole("Etudiant");
    setShowModal("add");
  };

  const openEditModal = (emp: any) => {
    setEditData(emp);
    setFormData({ prenom: emp.prenom, nom: emp.nom || "", email: emp.email || "", tel: emp.tel || "" });
    setSelectedRole(emp.role);
    setShowModal("edit");
  };

  const openDeleteModal = (emp: any) => {
    setDeleteData(emp);
    setShowModal("delete");
  };

  const addEmployee = () => {
    if (!formData.prenom.trim()) { showToast("Veuillez entrer un prénom", "error"); return; }
    const newId = Math.max(...employees.map(e => e.id)) + 1;
    setEmployees([...employees, { id: newId, prenom: formData.prenom, nom: formData.nom, role: selectedRole, email: formData.email, tel: formData.tel }]);
    setShowModal(null);
    showToast(formData.prenom + " a été ajouté avec succès !");
  };

  const saveEmployee = () => {
    if (!formData.prenom.trim()) { showToast("Veuillez entrer un prénom", "error"); return; }
    setEmployees(employees.map(e => e.id === editData.id ? { ...e, prenom: formData.prenom, nom: formData.nom, email: formData.email, tel: formData.tel, role: selectedRole } : e));
    setShowModal(null);
    showToast(formData.prenom + " a été modifié avec succès !");
  };

  const confirmDelete = () => {
    const newPlanning = { ...planning };
    Object.keys(newPlanning).forEach(day => {
      newPlanning[Number(day)] = newPlanning[Number(day)].filter(p => p.employeeId !== deleteData.id);
    });
    setPlanning(newPlanning);
    setEmployees(employees.filter(e => e.id !== deleteData.id));
    setShowModal(null);
    showToast(deleteData.prenom + " a été supprimé", "error");
  };

  const addToPlanning = () => {
    if (!planningForm.employeeId) { showToast("Veuillez sélectionner un employé", "error"); return; }
    if (heureToMinutes(planningForm.fin) <= heureToMinutes(planningForm.debut)) {
      showToast("L'heure de fin doit être après l'heure de début", "error"); return;
    }
    const newPlanning = { ...planning };
    if (!newPlanning[selectedDay]) newPlanning[selectedDay] = [];
    const exists = newPlanning[selectedDay].find(p => p.employeeId === planningForm.employeeId);
    if (exists) { showToast("Cet employé est déjà planifié ce jour", "error"); return; }
    newPlanning[selectedDay].push({ ...planningForm });
    setPlanning(newPlanning);
    setShowAddToPlanning(null);
    setPlanningForm({ employeeId: 0, debut: "08:30", fin: "14:00" });
    showToast("Employé ajouté au planning !");
  };

  const removeFromPlanning = (employeeId: number) => {
    const newPlanning = { ...planning };
    newPlanning[selectedDay] = newPlanning[selectedDay].filter(p => p.employeeId !== employeeId);
    setPlanning(newPlanning);
    showToast("Employé retiré du planning");
  };

  const updatePlanningHours = (employeeId: number, field: "debut" | "fin", value: string) => {
    const newPlanning = { ...planning };
    const item = newPlanning[selectedDay].find(p => p.employeeId === employeeId);
    if (item) { item[field] = value; setPlanning(newPlanning); }
  };

  const dayPlanning = planning[selectedDay] || [];
  const pharmaciens = employees.filter(e => e.role === "Pharmacien");
  const preparateurs = employees.filter(e => e.role === "Preparateur");
  const apprentis = employees.filter(e => e.role === "Apprenti");
  const etudiants = employees.filter(e => e.role === "Etudiant");

  const planningMatin = dayPlanning.filter(p => heureToMinutes(p.debut) < heureToMinutes("14:00")).sort((a, b) => heureToMinutes(a.debut) - heureToMinutes(b.debut));
  const planningAprem = dayPlanning.filter(p => heureToMinutes(p.fin) > heureToMinutes("14:00")).sort((a, b) => heureToMinutes(a.debut) - heureToMinutes(b.debut));

  const countByRole = (role: string) => dayPlanning.filter(p => getEmployeeById(p.employeeId)?.role === role).length;
  const countPharmaciensMatin = planningMatin.filter(p => getEmployeeById(p.employeeId)?.role === "Pharmacien").length;
  const countPharmacienAprem = planningAprem.filter(p => getEmployeeById(p.employeeId)?.role === "Pharmacien").length;
  const employeesNotInPlanning = employees.filter(e => !dayPlanning.find(p => p.employeeId === e.id));

  const styles = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); min-height: 100vh; }
    .header { position: sticky; top: 0; z-index: 100; background: linear-gradient(135deg, #1e293b, #0f172a); color: white; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
    .header-content { max-width: 1400px; margin: 0 auto; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; }
    .logo-section { display: flex; align-items: center; gap: 12px; text-decoration: none; color: white; }
    .logo { width: 44px; height: 44px; background: linear-gradient(135deg, #34d399, #059669); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 4px 12px rgba(16,185,129,0.4); }
    .logo-text h1 { font-size: 18px; font-weight: 700; }
    .logo-text p { font-size: 12px; color: #94a3b8; }
    .header-center { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 12px; }
    .header-center button { background: none; border: none; color: white; cursor: pointer; padding: 4px 8px; font-size: 14px; }
    .week-info { text-align: center; min-width: 180px; }
    .week-info .label { font-size: 11px; color: #94a3b8; }
    .week-info .dates { font-weight: 700; font-size: 15px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .notif-btn { position: relative; width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; font-size: 18px; }
    .notif-badge { position: absolute; top: -4px; right: -4px; width: 20px; height: 20px; background: #ef4444; border-radius: 50%; font-size: 11px; font-weight: 700; color: white; display: flex; align-items: center; justify-content: center; }
    .user-badge { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 10px; }
    .user-avatar-header { width: 32px; height: 32px; background: linear-gradient(135deg, #ec4899, #be185d); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
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
    .card-title { font-size: 18px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 8px; }
    .card-subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
    .card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn { padding: 10px 16px; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-primary { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
    .btn-success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .btn-success:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
    .btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
    .btn-danger:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
    .btn-lg { padding: 14px 24px; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 14px 16px; font-weight: 600; color: #475569; background: #f8fafc; font-size: 13px; }
    td { padding: 14px 16px; border-top: 1px solid #f1f5f9; }
    tr:hover { background: #f8fafc; }
    .employee-cell { display: flex; align-items: center; gap: 12px; }
    .employee-avatar { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 700; flex-shrink: 0; }
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
    .card-footer { padding: 16px 20px; background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-top: 1px solid #a7f3d0; }
    .summary-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .summary-badge { background: white; padding: 8px 14px; border-radius: 10px; font-size: 13px; display: flex; align-items: center; gap: 6px; }
    .summary-count { font-weight: 700; padding: 2px 8px; border-radius: 6px; font-size: 11px; }
    .count-good { background: #d1fae5; color: #047857; }
    .count-warning { background: #fef3c7; color: #b45309; }
    .count-bad { background: #fee2e2; color: #dc2626; }
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
    .demande-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .demande-actions .btn { flex: 1; min-width: 120px; justify-content: center; }
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
    .section-status.danger { background: #fee2e2; color: #dc2626; }
    .timeline-container { padding: 20px; }
    .planning-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 14px; margin-bottom: 10px; }
    .planning-item-avatar { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .planning-item-info { flex: 1; min-width: 0; }
    .planning-item-name { font-weight: 600; color: #1e293b; font-size: 14px; }
    .planning-item-role { font-size: 12px; color: #64748b; }
    .planning-item-hours { display: flex; align-items: center; gap: 8px; }
    .planning-item-hours select { padding: 8px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: inherit; background: white; cursor: pointer; min-width: 90px; }
    .planning-item-hours select:focus { outline: none; border-color: #10b981; }
    .planning-item-hours span { color: #94a3b8; }
    .planning-item-duration { background: linear-gradient(135deg, #ecfdf5, #d1fae5); padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; color: #059669; min-width: 50px; text-align: center; }
    .planning-item-remove { width: 32px; height: 32px; border-radius: 8px; border: none; background: #fee2e2; color: #dc2626; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .add-employee-btn { width: 100%; padding: 14px; border: 2px dashed #cbd5e1; border-radius: 14px; background: none; color: #64748b; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .add-employee-btn:hover { border-color: #10b981; color: #10b981; background: #ecfdf5; }
    .planning-footer { background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 20px; padding: 24px 32px; color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 24px; }
    .footer-stats { display: flex; gap: 48px; }
    .footer-stat { text-align: center; }
    .footer-stat-value { font-size: 32px; font-weight: 800; }
    .footer-stat-value.total { color: white; }
    .footer-stat-value.green { color: #34d399; }
    .footer-stat-value.blue { color: #60a5fa; }
    .footer-stat-value.purple { color: #a78bfa; }
    .footer-stat-value.orange { color: #fb923c; }
    .footer-stat-label { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .footer-actions { display: flex; gap: 12px; }
    .footer-btn { padding: 14px 24px; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 8px; }
    .footer-btn.secondary { background: rgba(255,255,255,0.1); color: white; }
    .footer-btn.primary { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .legend { display: flex; gap: 24px; padding: 16px 20px; background: white; border-radius: 14px; margin-top: 16px; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; }
    .legend-color { width: 18px; height: 18px; border-radius: 6px; }
    .legend-color.green { background: linear-gradient(135deg, #34d399, #059669); }
    .legend-color.blue { background: linear-gradient(135deg, #60a5fa, #2563eb); }
    .legend-color.purple { background: linear-gradient(135deg, #a78bfa, #7c3aed); }
    .legend-color.orange { background: linear-gradient(135deg, #fb923c, #ea580c); }
    .equipe-section-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
    .equipe-section-title { font-weight: 700; color: #1e293b; font-size: 16px; display: flex; align-items: center; gap: 8px; }
    .equipe-count { background: #e2e8f0; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #64748b; }
    .equipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding: 20px; }
    .equipe-card { background: #f8fafc; border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 14px; border: 2px solid transparent; }
    .equipe-card:hover { background: #f1f5f9; border-color: #e2e8f0; }
    .equipe-card-avatar { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: 700; flex-shrink: 0; }
    .equipe-card-info { flex: 1; min-width: 0; }
    .equipe-card-name { font-weight: 700; color: #1e293b; font-size: 15px; margin-bottom: 2px; }
    .equipe-card-role { font-size: 13px; color: #64748b; }
    .equipe-card-email { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .equipe-card-actions { display: flex; gap: 6px; }
    .equipe-card-btn { width: 38px; height: 38px; border-radius: 10px; border: none; cursor: pointer; font-size: 15px; display: flex; align-items: center; justify-content: center; }
    .equipe-card-btn.edit { background: #dbeafe; color: #2563eb; }
    .equipe-card-btn.delete { background: #fee2e2; color: #dc2626; }
    .modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 500; align-items: center; justify-content: center; padding: 20px; }
    .modal-overlay.active { display: flex; }
    .modal { background: white; border-radius: 24px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.25); }
    .modal-header { padding: 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-title { font-size: 20px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 10px; }
    .modal-close { width: 38px; height: 38px; border-radius: 10px; border: none; background: #f1f5f9; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; }
    .modal-body { padding: 24px; }
    .modal-footer { padding: 20px 24px; border-top: 1px solid #e2e8f0; display: flex; gap: 12px; justify-content: flex-end; }
    .form-group { margin-bottom: 20px; }
    .form-label { display: block; font-weight: 600; color: #334155; font-size: 14px; margin-bottom: 8px; }
    .form-input { width: 100%; padding: 14px 16px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-family: inherit; color: #1e293b; }
    .form-input:focus { outline: none; border-color: #10b981; background: white; }
    .form-select { width: 100%; padding: 14px 16px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-family: inherit; color: #1e293b; cursor: pointer; }
    .role-selector { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .role-option { padding: 16px; border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer; text-align: center; background: white; }
    .role-option:hover { border-color: #cbd5e1; }
    .role-option.selected { border-color: #10b981; background: #ecfdf5; }
    .role-option .role-icon { font-size: 28px; margin-bottom: 6px; }
    .role-option .role-name { font-weight: 600; color: #1e293b; font-size: 13px; }
    .confirm-text { font-size: 15px; color: #475569; line-height: 1.6; text-align: center; padding: 20px 0; }
    .confirm-name { font-weight: 700; color: #1e293b; }
    .confirm-warning { background: #fef3c7; border-radius: 12px; padding: 14px; margin-top: 16px; display: flex; align-items: center; gap: 10px; font-size: 13px; color: #92400e; }
    .toast { position: fixed; bottom: 24px; right: 24px; padding: 16px 24px; border-radius: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 1000; opacity: 0; transform: translateY(20px); transition: all 0.3s; font-weight: 600; }
    .toast.success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .toast.error { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
    .toast.active { opacity: 1; transform: translateY(0); }
    .empty-state { text-align: center; padding: 40px 20px; color: #64748b; }
    .empty-state-icon { font-size: 48px; margin-bottom: 12px; }
    @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .planning-container { grid-template-columns: 1fr; } }
    @media (max-width: 768px) { .header-center { display: none; } .demande-info-grid { grid-template-columns: 1fr; } .day-selector { grid-template-columns: repeat(3, 1fr); } }
  `;

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <a href="/" className="logo-section">
            <div className="logo">📅</div>
            <div className="logo-text"><h1>BaggPlanning</h1><p>Espace Titulaire</p></div>
          </a>
          <div className="header-center">
            <button>◀</button>
            <div className="week-info"><div className="label">Semaine du</div><div className="dates">20 - 25 Janvier 2025</div></div>
            <button>▶</button>
          </div>
          <div className="header-right">
            <button className="notif-btn" onClick={() => showToast("5 nouvelles notifications")}>🔔<span className="notif-badge">5</span></button>
            <div className="user-badge"><div className="user-avatar-header">TI</div><span>Titulaire</span></div>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="nav">
        <div className="nav-content">
          <button className={`tab ${onglet === "dispos" ? "active" : ""}`} onClick={() => setOnglet("dispos")}>
            <span>✋</span><span>Disponibilités</span><span className="badge">{Object.keys(dispoData).length}/{etudiants.length}</span>
          </button>
          <button className={`tab ${onglet === "demandes" ? "active" : ""}`} onClick={() => setOnglet("demandes")}>
            <span>📋</span><span>Demandes</span><span className="badge alert">3</span>
          </button>
          <button className={`tab ${onglet === "planning" ? "active" : ""}`} onClick={() => setOnglet("planning")}>
            <span>📅</span><span>Planning</span>
          </button>
          <button className={`tab ${onglet === "equipe" ? "active" : ""}`} onClick={() => setOnglet("equipe")}>
            <span>👥</span><span>Équipe</span><span className="badge">{employees.length}</span>
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="main">
        {/* VUE DISPONIBILITÉS */}
        <div className={`view ${onglet === "dispos" ? "active" : ""}`}>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon green">✅</div><div><div className="stat-value">{Object.keys(dispoData).length}</div><div className="stat-label">Ont répondu</div></div></div>
            <div className="stat-card"><div className="stat-icon yellow">⏳</div><div><div className="stat-value">{etudiants.length - Object.keys(dispoData).length}</div><div className="stat-label">En attente</div></div></div>
            <div className="stat-card"><div className="stat-icon blue">📊</div><div><div className="stat-value">{Math.round((Object.keys(dispoData).length / etudiants.length) * 100)}%</div><div className="stat-label">Taux de réponse</div></div></div>
            <div className="stat-card"><div className="stat-icon red">⏰</div><div><div className="stat-value">2j 4h</div><div className="stat-label">Avant deadline</div></div></div>
          </div>

          <div className="card">
            <div className="card-header">
              <div><div className="card-title">📊 Matrice des disponibilités</div><div className="card-subtitle">Semaine du 20 au 25 janvier 2025</div></div>
              <div className="card-actions">
                <button className="btn btn-secondary" onClick={() => showToast("Données actualisées")}>🔄 Actualiser</button>
                <button className="btn btn-primary" onClick={() => showToast("Rappel envoyé !")}>📤 Envoyer rappel</button>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Étudiant</th><th>Lun 20</th><th>Mar 21</th><th>Mer 22</th><th>Jeu 23</th><th>Ven 24</th><th>Sam 25</th></tr></thead>
                <tbody>
                  {etudiants.map(e => {
                    const d = dispoData[e.id] || null;
                    const hasDispos = d !== null;
                    return (
                      <tr key={e.id} style={!hasDispos ? { background: "#fef3c7" } : {}}>
                        <td>
                          <div className="employee-cell">
                            <div className={`employee-avatar ${hasDispos ? "avatar-orange" : "avatar-yellow"}`}>{getInitiales(e.prenom, e.nom)}</div>
                            <div>
                              <div className="employee-name">{e.prenom}</div>
                              <div className={`employee-status ${hasDispos ? "status-ok" : "status-pending"}`}>{hasDispos ? "✓ Rempli" : "⏳ En attente"}</div>
                            </div>
                          </div>
                        </td>
                        {(d || ["?","?","?","?","?","?"]).map((slot, i) => (
                          <td key={i}><span className={`dispo-badge ${slot === "?" ? "pending" : slot === "-" ? "unavailable" : "available"}`}>{slot}</span></td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="card-footer">
              <p style={{ fontWeight: 600, color: "#059669", fontSize: 14, marginBottom: 12 }}>📊 Résumé par jour</p>
              <div className="summary-row">
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((j, i) => {
                  const count = Object.values(dispoData).filter(d => d[i] !== "-" && d[i] !== "?").length;
                  return (<div key={j} className="summary-badge">{j} <span className={`summary-count ${count >= 3 ? "count-good" : count >= 2 ? "count-warning" : "count-bad"}`}>{count} dispo</span></div>);
                })}
              </div>
            </div>
          </div>
        </div>

        {/* VUE DEMANDES */}
        <div className={`view ${onglet === "demandes" ? "active" : ""}`}>
          <div className="page-header"><div><h2 className="page-title">📋 Demandes à traiter</h2><p className="page-subtitle">3 demandes en attente</p></div></div>
          
          {[
            { nom: "Ludovic", role: "Préparateur", type: "conge", urgent: true, date: "Vendredi 24", creneau: "Journée", demandeLe: "16 jan", motif: "RDV médical" },
            { nom: "Sarah", role: "Pharmacien", type: "echange", urgent: false, date: "Samedi 25", creneau: "Matin", demandeLe: "15 jan", motif: "Échange avec Laura" },
            { nom: "Celya", role: "Étudiant", type: "maladie", urgent: false, date: "Mercredi 22", creneau: "Après-midi", demandeLe: "17 jan", motif: "Grippe" },
          ].map((dem, i) => (
            <div key={i} className="demande-card">
              <div className={`demande-header ${dem.urgent ? "urgent" : ""}`}>
                <div className="demande-employee">
                  <div className={`demande-avatar ${dem.type === "conge" ? "avatar-blue" : dem.type === "echange" ? "avatar-green" : "avatar-orange"}`}>{dem.nom.substring(0,2).toUpperCase()}</div>
                  <div><div className="demande-name">{dem.nom}</div><div className="demande-role">{dem.role}</div></div>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span className={`demande-type type-${dem.type}`}>{dem.type === "conge" ? "🏖️ Congé" : dem.type === "echange" ? "🔄 Échange" : "🏥 Maladie"}</span>
                  {dem.urgent && <span className="urgent-badge">URGENT</span>}
                </div>
              </div>
              <div className="demande-body">
                <div className="demande-info-grid">
                  <div className="demande-info"><div className="demande-info-label">📅 Date</div><div className="demande-info-value">{dem.date}</div></div>
                  <div className="demande-info"><div className="demande-info-label">🕐 Créneau</div><div className="demande-info-value">{dem.creneau}</div></div>
                  <div className="demande-info"><div className="demande-info-label">📆 Demandé</div><div className="demande-info-value">{dem.demandeLe}</div></div>
                </div>
                <div className="demande-motif"><div className="demande-info-label">💬 Motif</div><div className="demande-motif-text">"{dem.motif}"</div></div>
                <div className="demande-actions">
                  <button className="btn btn-success" onClick={() => showToast("Approuvé !")}>✓ Approuver</button>
                  <button className="btn btn-primary" onClick={() => showToast("Recherche...")}>🔍 Remplaçant</button>
                  <button className="btn btn-secondary">✗ Refuser</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* VUE PLANNING */}
        <div className={`view ${onglet === "planning" ? "active" : ""}`}>
          <div className="page-header">
            <div><h2 className="page-title">📅 Créer le planning</h2><p className="page-subtitle">Semaine du 20 au 25 janvier 2025</p></div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-secondary">🔄 Réinitialiser</button>
              <button className="btn btn-success btn-lg" onClick={() => showToast("Planning publié !")}>✓ Valider et publier</button>
            </div>
          </div>

          <div className="day-selector">
            {jours.map((jour, i) => {
              const dayPlan = planning[i] || [];
              const pharmCount = dayPlan.filter(p => getEmployeeById(p.employeeId)?.role === "Pharmacien").length;
              return (
                <button key={i} className={`day-btn ${selectedDay === i ? "active" : ""}`} onClick={() => setSelectedDay(i)}>
                  <div className="day-name">{jour.nom}</div>
                  <div className="day-date">{jour.date}</div>
                  <span className={`day-count ${pharmCount >= 2 ? "ok" : "warning"}`}>{pharmCount >= 2 ? `✓ ${dayPlan.length} pers.` : `⚠️ ${pharmCount} pharm.`}</span>
                </button>
              );
            })}
          </div>

          <div className="planning-container">
            {/* Matin */}
            <div className="planning-section">
              <div className="planning-section-header matin">
                <div className="section-left">
                  <div className="section-icon matin">🌅</div>
                  <div><div className="section-title">MATIN</div><div className="section-hours">8h30 - 14h00</div></div>
                </div>
                <span className={`section-status ${countPharmaciensMatin >= 2 ? "ok" : "warning"}`}>{countPharmaciensMatin} pharmacien(s)</span>
              </div>
              <div className="timeline-container">
                {planningMatin.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-icon">📭</div><div>Aucun employé le matin</div></div>
                ) : (
                  planningMatin.map(p => {
                    const emp = getEmployeeById(p.employeeId);
                    if (!emp) return null;
                    return (
                      <div key={p.employeeId} className="planning-item">
                        <div className={`planning-item-avatar ${getAvatarClass(emp.role)}`}>{getInitiales(emp.prenom, emp.nom)}</div>
                        <div className="planning-item-info"><div className="planning-item-name">{emp.prenom} {emp.nom}</div><div className="planning-item-role">{emp.role}</div></div>
                        <div className="planning-item-hours">
                          <select value={p.debut} onChange={(e) => updatePlanningHours(p.employeeId, "debut", e.target.value)}>
                            {heures.filter(h => heureToMinutes(h) < heureToMinutes("14:00")).map(h => <option key={h} value={h}>{formatHeure(h)}</option>)}
                          </select>
                          <span>→</span>
                          <select value={p.fin} onChange={(e) => updatePlanningHours(p.employeeId, "fin", e.target.value)}>
                            {heures.filter(h => heureToMinutes(h) > heureToMinutes(p.debut)).map(h => <option key={h} value={h}>{formatHeure(h)}</option>)}
                          </select>
                        </div>
                        <div className="planning-item-duration">{calculerDuree(p.debut, p.fin)}</div>
                        <button className="planning-item-remove" onClick={() => removeFromPlanning(p.employeeId)}>✕</button>
                      </div>
                    );
                  })
                )}
                <button className="add-employee-btn" onClick={() => { setPlanningForm({ ...planningForm, debut: "08:30", fin: "14:00" }); setShowAddToPlanning("matin"); }}>➕ Ajouter un employé le matin</button>
              </div>
            </div>

            {/* Après-midi */}
            <div className="planning-section">
              <div className="planning-section-header aprem">
                <div className="section-left">
                  <div className="section-icon aprem">🌆</div>
                  <div><div className="section-title">APRÈS-MIDI</div><div className="section-hours">14h00 - 20h30</div></div>
                </div>
                <span className={`section-status ${countPharmacienAprem >= 2 ? "ok" : "warning"}`}>{countPharmacienAprem} pharmacien(s)</span>
              </div>
              <div className="timeline-container">
                {planningAprem.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-icon">📭</div><div>Aucun employé l'après-midi</div></div>
                ) : (
                  planningAprem.map(p => {
                    const emp = getEmployeeById(p.employeeId);
                    if (!emp) return null;
                    return (
                      <div key={p.employeeId} className="planning-item">
                        <div className={`planning-item-avatar ${getAvatarClass(emp.role)}`}>{getInitiales(emp.prenom, emp.nom)}</div>
                        <div className="planning-item-info"><div className="planning-item-name">{emp.prenom} {emp.nom}</div><div className="planning-item-role">{emp.role}</div></div>
                        <div className="planning-item-hours">
                          <select value={p.debut} onChange={(e) => updatePlanningHours(p.employeeId, "debut", e.target.value)}>
                            {heures.map(h => <option key={h} value={h}>{formatHeure(h)}</option>)}
                          </select>
                          <span>→</span>
                          <select value={p.fin} onChange={(e) => updatePlanningHours(p.employeeId, "fin", e.target.value)}>
                            {heures.filter(h => heureToMinutes(h) > heureToMinutes(p.debut)).map(h => <option key={h} value={h}>{formatHeure(h)}</option>)}
                          </select>
                        </div>
                        <div className="planning-item-duration">{calculerDuree(p.debut, p.fin)}</div>
                        <button className="planning-item-remove" onClick={() => removeFromPlanning(p.employeeId)}>✕</button>
                      </div>
                    );
                  })
                )}
                <button className="add-employee-btn" onClick={() => { setPlanningForm({ ...planningForm, debut: "14:00", fin: "20:30" }); setShowAddToPlanning("aprem"); }}>➕ Ajouter un employé l'après-midi</button>
              </div>
            </div>
          </div>

          <div className="planning-footer">
            <div className="footer-stats">
              <div className="footer-stat"><div className="footer-stat-value total">{dayPlanning.length}</div><div className="footer-stat-label">Total</div></div>
              <div className="footer-stat"><div className="footer-stat-value green">{countByRole("Pharmacien")}</div><div className="footer-stat-label">Pharmaciens</div></div>
              <div className="footer-stat"><div className="footer-stat-value blue">{countByRole("Preparateur")}</div><div className="footer-stat-label">Préparateurs</div></div>
              <div className="footer-stat"><div className="footer-stat-value orange">{countByRole("Etudiant")}</div><div className="footer-stat-label">Étudiants</div></div>
            </div>
            <div className="footer-actions">
              <button className="footer-btn secondary">📄 Exporter PDF</button>
              <button className="footer-btn primary" onClick={() => showToast(`${jours[selectedDay].nom} validé !`)}>✓ Valider {jours[selectedDay].nom}</button>
            </div>
          </div>

          <div className="legend">
            <div className="legend-item"><div className="legend-color green"></div><span>Pharmacien</span></div>
            <div className="legend-item"><div className="legend-color blue"></div><span>Préparateur</span></div>
            <div className="legend-item"><div className="legend-color purple"></div><span>Apprenti</span></div>
            <div className="legend-item"><div className="legend-color orange"></div><span>Étudiant</span></div>
          </div>
        </div>

        {/* VUE ÉQUIPE */}
        <div className={`view ${onglet === "equipe" ? "active" : ""}`}>
          <div className="page-header">
            <div><h2 className="page-title">👥 Gestion de l'équipe</h2><p className="page-subtitle">{employees.length} membres au total</p></div>
            <button className="btn btn-success btn-lg" onClick={openAddModal}>➕ Ajouter un employé</button>
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

      {/* MODAL AJOUTER */}
      <div className={`modal-overlay ${showModal === "add" ? "active" : ""}`} onClick={() => setShowModal(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><div className="modal-title">➕ Ajouter un employé</div><button className="modal-close" onClick={() => setShowModal(null)}>✕</button></div>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Prénom *</label><input className="form-input" placeholder="Ex: Marie" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Nom</label><input className="form-input" placeholder="Ex: Dupont" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="Ex: marie@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" placeholder="Ex: 06 12 34 56 78" value={formData.tel} onChange={e => setFormData({...formData, tel: e.target.value})} /></div>
            <div className="form-group">
              <label className="form-label">Fonction *</label>
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

      {/* MODAL MODIFIER */}
      <div className={`modal-overlay ${showModal === "edit" ? "active" : ""}`} onClick={() => setShowModal(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><div className="modal-title">✏️ Modifier un employé</div><button className="modal-close" onClick={() => setShowModal(null)}>✕</button></div>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Prénom *</label><input className="form-input" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" value={formData.tel} onChange={e => setFormData({...formData, tel: e.target.value})} /></div>
            <div className="form-group">
              <label className="form-label">Fonction *</label>
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

      {/* MODAL SUPPRIMER */}
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

      {/* MODAL AJOUTER AU PLANNING */}
      <div className={`modal-overlay ${showAddToPlanning ? "active" : ""}`} onClick={() => setShowAddToPlanning(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><div className="modal-title">➕ Ajouter au planning - {jours[selectedDay]?.nom}</div><button className="modal-close" onClick={() => setShowAddToPlanning(null)}>✕</button></div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Employé *</label>
              <select className="form-select" value={planningForm.employeeId} onChange={e => setPlanningForm({...planningForm, employeeId: Number(e.target.value)})}>
                <option value={0}>-- Sélectionner --</option>
                <optgroup label="Pharmaciens">{employeesNotInPlanning.filter(e => e.role === "Pharmacien").map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}</optgroup>
                <optgroup label="Préparateurs">{employeesNotInPlanning.filter(e => e.role === "Preparateur").map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}</optgroup>
                <optgroup label="Apprentis">{employeesNotInPlanning.filter(e => e.role === "Apprenti").map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}</optgroup>
                <optgroup label="Étudiants">{employeesNotInPlanning.filter(e => e.role === "Etudiant").map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}</optgroup>
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
                  {heures.filter(h => heureToMinutes(h) > heureToMinutes(planningForm.debut)).map(h => <option key={h} value={h}>{formatHeure(h)}</option>)}
                </select>
              </div>
              {planningForm.debut && planningForm.fin && heureToMinutes(planningForm.fin) > heureToMinutes(planningForm.debut) && (
                <p style={{ marginTop: 12, fontSize: 14, color: "#059669", fontWeight: 600 }}>⏱️ Durée : {calculerDuree(planningForm.debut, planningForm.fin)}</p>
              )}
            </div>
            <div style={{ background: "#eff6ff", borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 13, color: "#1e40af" }}>💡 Vous pouvez ajuster les heures même si l'étudiant est disponible plus longtemps</p>
            </div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowAddToPlanning(null)}>Annuler</button><button className="btn btn-success" onClick={addToPlanning}>✓ Ajouter</button></div>
        </div>
      </div>

      {/* Toast */}
      <div className={`toast ${toast.type} ${toast.visible ? "active" : ""}`}>
        <span>{toast.type === "success" ? "✓" : "✗"}</span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}