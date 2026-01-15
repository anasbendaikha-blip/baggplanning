"use client";
import { useState, useEffect } from "react";

export default function EmployePage() {
  // === ÉTATS ===
  const [onglet, setOnglet] = useState("dispos");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState({ initiales: "AN", nom: "Anas" });

  const users = [
    { initiales: "AN", nom: "Anas" },
    { initiales: "CE", nom: "Celya" },
    { initiales: "NI", nom: "Nicolas" },
    { initiales: "MA", nom: "Maissa" },
    { initiales: "RO", nom: "Robin" },
  ];

  const jours = [
    { id: "lundi", nom: "Lundi", date: "20 janvier", shortDate: "20" },
    { id: "mardi", nom: "Mardi", date: "21 janvier", shortDate: "21" },
    { id: "mercredi", nom: "Mercredi", date: "22 janvier", shortDate: "22" },
    { id: "jeudi", nom: "Jeudi", date: "23 janvier", shortDate: "23" },
    { id: "vendredi", nom: "Vendredi", date: "24 janvier", shortDate: "24" },
    { id: "samedi", nom: "Samedi", date: "25 janvier", shortDate: "25" },
  ];

  const heuresDebut = ["08:30", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  const heuresFin = ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "19:30", "20:30"];

  const [disponibilites, setDisponibilites] = useState(() => {
    const init: Record<string, { disponible: boolean; debut: string; fin: string }> = {};
    jours.forEach((j) => {
      init[j.id] = { disponible: false, debut: "17:00", fin: "20:30" };
    });
    return init;
  });

  const [formDemande, setFormDemande] = useState({
    type: "conge",
    dateDebut: "2025-01-24",
    dateFin: "2025-01-24",
    creneau: "journee",
    motif: "",
  });

  // === FONCTIONS ===
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3500);
  };

  const formatHeure = (h: string) => h.replace(":", "h");

  const calculerHeures = () => {
    let total = 0;
    Object.values(disponibilites).forEach((d) => {
      if (d.disponible) {
        const [hD, mD] = d.debut.split(":").map(Number);
        const [hF, mF] = d.fin.split(":").map(Number);
        total += hF + mF / 60 - (hD + mD / 60);
      }
    });
    return total.toFixed(1);
  };

  const toggleDispo = (jourId: string, value: boolean) => {
    setDisponibilites((prev) => ({
      ...prev,
      [jourId]: { ...prev[jourId], disponible: value },
    }));
  };

  const updateHeure = (jourId: string, type: "debut" | "fin", value: string) => {
    setDisponibilites((prev) => ({
      ...prev,
      [jourId]: { ...prev[jourId], [type]: value },
    }));
  };

  const quickSelect = (jourId: string, slot: string) => {
    const slots: Record<string, { debut: string; fin: string }> = {
      matin: { debut: "08:30", fin: "14:00" },
      aprem: { debut: "14:00", fin: "20:30" },
      soir: { debut: "17:00", fin: "20:30" },
      journee: { debut: "08:30", fin: "20:30" },
    };
    if (slots[slot]) {
      setDisponibilites((prev) => ({
        ...prev,
        [jourId]: { disponible: true, ...slots[slot] },
      }));
    }
  };

  const setAllAvailable = (value: boolean) => {
    setDisponibilites((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        newState[key] = { ...newState[key], disponible: value };
      });
      return newState;
    });
  };

  const saveDisponibilites = () => {
    showToast("Disponibilités enregistrées avec succès !");
  };

  const sendDemande = () => {
    if (!formDemande.motif.trim()) {
      showToast("Veuillez indiquer un motif", "error");
      return;
    }
    showToast("Demande envoyée avec succès !");
    setFormDemande({ ...formDemande, motif: "" });
  };

  const selectUser = (user: { initiales: string; nom: string }) => {
    setCurrentUser(user);
    setShowUserDropdown(false);
  };

  return (
    <>
      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #f1f5f9 100%); min-height: 100vh; }
        
        .header { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(226,232,240,0.5); }
        .header-content { max-width: 500px; margin: 0 auto; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
        .logo-section { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .logo { width: 40px; height: 40px; background: linear-gradient(135deg, #34d399, #059669); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
        .logo-text h1 { font-size: 16px; font-weight: 700; color: #1e293b; }
        .logo-text p { font-size: 11px; color: #64748b; }
        
        .user-selector { position: relative; }
        .user-btn { display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); padding: 8px 12px; border-radius: 12px; border: none; cursor: pointer; }
        .user-avatar { width: 32px; height: 32px; background: linear-gradient(135deg, #fb923c, #ea580c); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 700; }
        .user-info { text-align: left; }
        .user-name { font-size: 13px; font-weight: 600; color: #1e293b; }
        .user-role { font-size: 11px; color: #64748b; }
        .user-dropdown { display: none; position: absolute; right: 0; top: 100%; margin-top: 8px; width: 180px; background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden; z-index: 200; }
        .user-dropdown.active { display: block; }
        .user-option { width: 100%; padding: 12px 16px; display: flex; align-items: center; gap: 12px; border: none; background: none; cursor: pointer; font-family: inherit; }
        .user-option:hover { background: #f8fafc; }
        .user-option.selected { background: #ecfdf5; }
        .user-option .avatar { width: 32px; height: 32px; background: linear-gradient(135deg, #fb923c, #ea580c); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 700; }
        .user-option span { font-weight: 500; color: #334155; }
        
        .nav { position: sticky; top: 64px; z-index: 90; background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(226,232,240,0.5); }
        .nav-content { max-width: 500px; margin: 0 auto; padding: 8px 16px; }
        .tabs { display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 12px; }
        .tab { flex: 1; padding: 10px 8px; border: none; background: none; border-radius: 8px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s; }
        .tab:hover { color: #334155; }
        .tab.active { background: white; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        
        .main { max-width: 500px; margin: 0 auto; padding: 20px 16px 100px; }
        .view { display: none; }
        .view.active { display: block; }
        
        .week-header { background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 20px; padding: 20px; color: white; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(59,130,246,0.3); }
        .week-header-top { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .week-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }
        .week-dates { font-size: 20px; font-weight: 800; }
        .week-hours { font-size: 24px; font-weight: 800; text-align: right; }
        .week-hours-label { font-size: 11px; opacity: 0.8; text-align: right; }
        .deadline-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.2); padding: 8px 14px; border-radius: 10px; font-size: 13px; }
        
        .quick-actions { display: flex; gap: 8px; margin-bottom: 16px; }
        .quick-action-btn { flex: 1; padding: 10px 16px; border: none; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .quick-action-btn.primary { background: #ecfdf5; color: #059669; }
        .quick-action-btn.primary:hover { background: #d1fae5; }
        .quick-action-btn.secondary { background: #f1f5f9; color: #64748b; }
        .quick-action-btn.secondary:hover { background: #e2e8f0; }
        
        .day-card { background: white; border-radius: 20px; overflow: hidden; margin-bottom: 12px; border: 2px solid transparent; transition: all 0.2s; }
        .day-card.available { border-color: #6ee7b7; box-shadow: 0 4px 12px rgba(16,185,129,0.15); }
        .day-header { padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .day-card.available .day-header { background: #ecfdf5; border-bottom-color: #a7f3d0; }
        .day-header-left { display: flex; align-items: center; gap: 12px; }
        .day-number { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; background: #e2e8f0; color: #64748b; }
        .day-card.available .day-number { background: #10b981; color: white; }
        .day-name { font-weight: 600; color: #1e293b; }
        .day-date { font-size: 12px; color: #64748b; }
        .day-hours { font-size: 13px; font-weight: 600; color: #10b981; }
        .day-content { padding: 16px; }
        
        .toggle-btns { display: flex; gap: 8px; margin-bottom: 12px; }
        .toggle-btn { flex: 1; padding: 12px 16px; border: none; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; background: #f1f5f9; color: #64748b; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; }
        .toggle-btn:hover { background: #e2e8f0; }
        .toggle-btn.available { background: #10b981; color: white; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
        .toggle-btn.unavailable { background: #ef4444; color: white; box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
        
        .time-selector { display: none; gap: 12px; align-items: center; margin-bottom: 12px; animation: slideDown 0.2s ease; }
        .time-selector.visible { display: flex; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .time-input { flex: 1; }
        .time-input label { display: block; font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 6px; }
        .time-input select { width: 100%; padding: 12px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 14px; font-family: inherit; color: #1e293b; cursor: pointer; }
        .time-input select:focus { outline: none; border-color: #10b981; }
        .time-arrow { color: #cbd5e1; margin-top: 20px; }
        
        .quick-select { display: none; flex-wrap: wrap; gap: 8px; }
        .quick-select.visible { display: flex; }
        .quick-btn { padding: 8px 14px; background: #f1f5f9; border: none; border-radius: 10px; font-size: 12px; font-weight: 500; color: #64748b; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .quick-btn:hover { background: #ecfdf5; color: #059669; }
        
        .submit-btn { width: 100%; padding: 18px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 16px; color: white; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 16px rgba(16,185,129,0.3); margin-top: 16px; font-family: inherit; transition: all 0.2s; }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(16,185,129,0.4); }
        .submit-btn.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 4px 16px rgba(59,130,246,0.3); }
        .submit-btn.blue:hover { box-shadow: 0 8px 24px rgba(59,130,246,0.4); }
        
        .card { background: white; border-radius: 20px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .card-title { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-weight: 600; color: #334155; font-size: 14px; margin-bottom: 10px; }
        
        .type-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .type-option { padding: 16px; border: 2px solid #e2e8f0; border-radius: 14px; text-align: center; cursor: pointer; background: white; transition: all 0.2s; }
        .type-option:hover { border-color: #cbd5e1; }
        .type-option.selected { border-color: #10b981; background: #ecfdf5; }
        .type-option .icon { font-size: 28px; margin-bottom: 6px; }
        .type-option .label { font-weight: 600; color: #1e293b; font-size: 13px; }
        
        .date-row { display: flex; gap: 12px; align-items: center; }
        .date-input { flex: 1; }
        .date-input label { display: block; font-size: 11px; color: #64748b; margin-bottom: 6px; }
        .date-input input { width: 100%; padding: 12px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 14px; font-family: inherit; }
        .date-input input:focus { outline: none; border-color: #10b981; }
        .date-arrow { color: #cbd5e1; margin-top: 18px; }
        
        .creneau-btns { display: flex; gap: 8px; }
        .creneau-btn { flex: 1; padding: 12px; border: 2px solid #e2e8f0; border-radius: 12px; background: white; font-size: 12px; font-weight: 600; color: #64748b; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .creneau-btn:hover { border-color: #cbd5e1; }
        .creneau-btn.selected { border-color: #10b981; background: #ecfdf5; color: #059669; }
        
        .form-textarea { width: 100%; padding: 14px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 14px; font-size: 14px; font-family: inherit; min-height: 100px; resize: none; }
        .form-textarea:focus { outline: none; border-color: #10b981; }
        
        .info-box { background: #eff6ff; border-radius: 14px; padding: 16px; display: flex; gap: 12px; margin-bottom: 20px; }
        .info-box .icon { font-size: 20px; }
        .info-box .title { font-weight: 600; color: #1e40af; font-size: 14px; margin-bottom: 4px; }
        .info-box .text { color: #3b82f6; font-size: 12px; }
        
        .planning-header { background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 20px; padding: 20px; color: white; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(99,102,241,0.3); }
        .planning-header .label { font-size: 11px; font-weight: 600; text-transform: uppercase; opacity: 0.8; }
        .planning-header .dates { font-size: 20px; font-weight: 800; }
        
        .planning-day { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
        .planning-day:last-child { border-bottom: none; }
        .planning-day-left { display: flex; align-items: center; gap: 12px; }
        .planning-day-number { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .planning-day-number.working { background: #ecfdf5; color: #059669; }
        .planning-day-number.off { background: #f1f5f9; color: #94a3b8; }
        .planning-day-name { font-weight: 600; color: #1e293b; }
        .planning-day-date { font-size: 12px; color: #64748b; }
        .planning-badge { padding: 10px 16px; border-radius: 12px; font-size: 13px; font-weight: 600; }
        .planning-badge.working { background: linear-gradient(135deg, #10b981, #059669); color: white; box-shadow: 0 2px 8px rgba(16,185,129,0.3); }
        .planning-badge.off { background: #f1f5f9; color: #94a3b8; }
        
        .planning-total { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 1px solid #a7f3d0; border-radius: 16px; padding: 20px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; }
        .planning-total-label { font-weight: 600; color: #059669; }
        .planning-total-value { font-size: 28px; font-weight: 800; color: #047857; }
        .planning-total-icon { width: 56px; height: 56px; background: #a7f3d0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; }
        
        .history-item { background: white; border-radius: 16px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .history-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .history-left { display: flex; align-items: center; gap: 12px; }
        .history-icon { width: 40px; height: 40px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .history-type { font-weight: 600; color: #1e293b; }
        .history-date { font-size: 12px; color: #64748b; }
        .status-badge { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; }
        .status-badge.approved { background: #d1fae5; color: #047857; }
        .status-badge.rejected { background: #fee2e2; color: #b91c1c; }
        .history-details { font-size: 13px; color: #475569; line-height: 1.6; }
        .history-note { margin-top: 8px; font-size: 12px; }
        .history-note.success { color: #059669; }
        .history-note.error { color: #dc2626; }
        
        .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(100px); padding: 16px 24px; border-radius: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 1000; opacity: 0; transition: all 0.3s; font-weight: 600; }
        .toast.success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
        .toast.error { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
        .toast.active { transform: translateX(-50%) translateY(0); opacity: 1; }
        
        .back-link { display: block; text-align: center; margin-top: 24px; color: #64748b; text-decoration: none; }
        .back-link:hover { color: #334155; }
        
        @media (max-width: 480px) { .user-info { display: none; } }
      `}</style>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <a href="/" className="logo-section">
            <div className="logo">📅</div>
            <div className="logo-text">
              <h1>BaggPlanning</h1>
              <p>Espace Employé</p>
            </div>
          </a>

          <div className="user-selector">
            <button className="user-btn" onClick={() => setShowUserDropdown(!showUserDropdown)}>
              <div className="user-avatar">{currentUser.initiales}</div>
              <div className="user-info">
                <div className="user-name">{currentUser.nom}</div>
                <div className="user-role">Étudiant</div>
              </div>
              <span>▼</span>
            </button>

            <div className={`user-dropdown ${showUserDropdown ? "active" : ""}`}>
              {users.map((user) => (
                <button
                  key={user.initiales}
                  className={`user-option ${currentUser.initiales === user.initiales ? "selected" : ""}`}
                  onClick={() => selectUser(user)}
                >
                  <div className="avatar">{user.initiales}</div>
                  <span>{user.nom}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-content">
          <div className="tabs">
            <button className={`tab ${onglet === "dispos" ? "active" : ""}`} onClick={() => setOnglet("dispos")}>
              <span>✋</span>
              <span>Dispos</span>
            </button>
            <button className={`tab ${onglet === "demande" ? "active" : ""}`} onClick={() => setOnglet("demande")}>
              <span>📋</span>
              <span>Demande</span>
            </button>
            <button className={`tab ${onglet === "planning" ? "active" : ""}`} onClick={() => setOnglet("planning")}>
              <span>📅</span>
              <span>Planning</span>
            </button>
            <button className={`tab ${onglet === "historique" ? "active" : ""}`} onClick={() => setOnglet("historique")}>
              <span>📜</span>
              <span>Historique</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="main">
        {/* === VUE DISPONIBILITÉS === */}
        <div className={`view ${onglet === "dispos" ? "active" : ""}`}>
          <div className="week-header">
            <div className="week-header-top">
              <div>
                <p className="week-label">Semaine</p>
                <p className="week-dates">20 - 25 Janvier 2025</p>
              </div>
              <div>
                <p className="week-hours-label">Total prévu</p>
                <p className="week-hours">{calculerHeures()}h</p>
              </div>
            </div>
            <div className="deadline-badge">
              ⏰ Date limite : <strong>Dimanche 19 janvier à 20h</strong>
            </div>
          </div>

          <div className="quick-actions">
            <button className="quick-action-btn primary" onClick={() => setAllAvailable(true)}>
              ✓ Tout disponible
            </button>
            <button className="quick-action-btn secondary" onClick={() => setAllAvailable(false)}>
              ✗ Tout effacer
            </button>
          </div>

          {jours.map((jour) => {
            const dispo = disponibilites[jour.id];
            return (
              <div key={jour.id} className={`day-card ${dispo.disponible ? "available" : ""}`}>
                <div className="day-header">
                  <div className="day-header-left">
                    <div className="day-number">{jour.shortDate}</div>
                    <div>
                      <div className="day-name">{jour.nom}</div>
                      <div className="day-date">{jour.date}</div>
                    </div>
                  </div>
                  {dispo.disponible && (
                    <div className="day-hours">
                      {formatHeure(dispo.debut)} - {formatHeure(dispo.fin)}
                    </div>
                  )}
                </div>
                <div className="day-content">
                  <div className="toggle-btns">
                    <button
                      className={`toggle-btn ${dispo.disponible ? "available" : ""}`}
                      onClick={() => toggleDispo(jour.id, true)}
                    >
                      ✓ Disponible
                    </button>
                    <button
                      className={`toggle-btn ${!dispo.disponible ? "unavailable" : ""}`}
                      onClick={() => toggleDispo(jour.id, false)}
                    >
                      ✗ Indisponible
                    </button>
                  </div>

                  <div className={`time-selector ${dispo.disponible ? "visible" : ""}`}>
                    <div className="time-input">
                      <label>Début</label>
                      <select value={dispo.debut} onChange={(e) => updateHeure(jour.id, "debut", e.target.value)}>
                        {heuresDebut.map((h) => (
                          <option key={h} value={h}>
                            {formatHeure(h)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="time-arrow">→</span>
                    <div className="time-input">
                      <label>Fin</label>
                      <select value={dispo.fin} onChange={(e) => updateHeure(jour.id, "fin", e.target.value)}>
                        {heuresFin.map((h) => (
                          <option key={h} value={h}>
                            {formatHeure(h)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={`quick-select ${dispo.disponible ? "visible" : ""}`}>
                    <button className="quick-btn" onClick={() => quickSelect(jour.id, "matin")}>
                      🌅 Matin
                    </button>
                    <button className="quick-btn" onClick={() => quickSelect(jour.id, "aprem")}>
                      🌆 Après-midi
                    </button>
                    <button className="quick-btn" onClick={() => quickSelect(jour.id, "soir")}>
                      🌙 Soir
                    </button>
                    <button className="quick-btn" onClick={() => quickSelect(jour.id, "journee")}>
                      ☀️ Journée
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <button className="submit-btn" onClick={saveDisponibilites}>
            ✓ Enregistrer mes disponibilités
          </button>
        </div>

        {/* === VUE DEMANDE === */}
        <div className={`view ${onglet === "demande" ? "active" : ""}`}>
          <div className="card">
            <h2 className="card-title">📋 Nouvelle demande</h2>

            <div className="form-group">
              <label className="form-label">Type de demande</label>
              <div className="type-grid">
                {[
                  { id: "conge", icon: "🏖️", label: "Congé" },
                  { id: "echange", icon: "🔄", label: "Échange" },
                  { id: "maladie", icon: "🏥", label: "Maladie" },
                  { id: "autre", icon: "📝", label: "Autre" },
                ].map((type) => (
                  <div
                    key={type.id}
                    className={`type-option ${formDemande.type === type.id ? "selected" : ""}`}
                    onClick={() => setFormDemande({ ...formDemande, type: type.id })}
                  >
                    <div className="icon">{type.icon}</div>
                    <div className="label">{type.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Période concernée</label>
              <div className="date-row">
                <div className="date-input">
                  <label>Du</label>
                  <input
                    type="date"
                    value={formDemande.dateDebut}
                    onChange={(e) => setFormDemande({ ...formDemande, dateDebut: e.target.value })}
                  />
                </div>
                <span className="date-arrow">→</span>
                <div className="date-input">
                  <label>Au</label>
                  <input
                    type="date"
                    value={formDemande.dateFin}
                    onChange={(e) => setFormDemande({ ...formDemande, dateFin: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Créneau horaire</label>
              <div className="creneau-btns">
                {[
                  { id: "journee", label: "☀️ Journée" },
                  { id: "matin", label: "🌅 Matin" },
                  { id: "apres-midi", label: "🌆 Après-midi" },
                ].map((creneau) => (
                  <button
                    key={creneau.id}
                    className={`creneau-btn ${formDemande.creneau === creneau.id ? "selected" : ""}`}
                    onClick={() => setFormDemande({ ...formDemande, creneau: creneau.id })}
                  >
                    {creneau.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Motif</label>
              <textarea
                className="form-textarea"
                placeholder="Expliquez brièvement la raison..."
                value={formDemande.motif}
                onChange={(e) => setFormDemande({ ...formDemande, motif: e.target.value })}
              />
            </div>

            <div className="info-box">
              <div className="icon">ℹ️</div>
              <div>
                <p className="title">Que se passe-t-il ensuite ?</p>
                <p className="text">Votre demande sera transmise à la titulaire qui cherchera un remplaçant.</p>
              </div>
            </div>

            <button className="submit-btn blue" onClick={sendDemande}>
              📤 Envoyer ma demande
            </button>
          </div>
        </div>

        {/* === VUE PLANNING === */}
        <div className={`view ${onglet === "planning" ? "active" : ""}`}>
          <div className="planning-header">
            <p className="label">Votre planning</p>
            <p className="dates">Semaine du 13 - 18 Janvier</p>
          </div>

          <div className="card">
            {[
              { jour: "Lundi", date: "13 jan", num: "13", horaire: "17h00 - 20h30", working: true },
              { jour: "Mardi", date: "14 jan", num: "14", horaire: "17h00 - 20h30", working: true },
              { jour: "Mercredi", date: "15 jan", num: "15", horaire: "Repos", working: false },
              { jour: "Jeudi", date: "16 jan", num: "16", horaire: "Repos", working: false },
              { jour: "Vendredi", date: "17 jan", num: "17", horaire: "14h00 - 20h30", working: true },
              { jour: "Samedi", date: "18 jan", num: "18", horaire: "8h30 - 14h00", working: true },
            ].map((item) => (
              <div key={item.jour} className="planning-day">
                <div className="planning-day-left">
                  <div className={`planning-day-number ${item.working ? "working" : "off"}`}>{item.num}</div>
                  <div>
                    <div className="planning-day-name">{item.jour}</div>
                    <div className="planning-day-date">{item.date}</div>
                  </div>
                </div>
                <div className={`planning-badge ${item.working ? "working" : "off"}`}>{item.horaire}</div>
              </div>
            ))}

            <div className="planning-total">
              <div>
                <p className="planning-total-label">Total cette semaine</p>
                <p className="planning-total-value">17h30</p>
              </div>
              <div className="planning-total-icon">📊</div>
            </div>
          </div>
        </div>

        {/* === VUE HISTORIQUE === */}
        <div className={`view ${onglet === "historique" ? "active" : ""}`}>
          <h2 className="card-title">📜 Historique des demandes</h2>

          <div className="history-item">
            <div className="history-header">
              <div className="history-left">
                <div className="history-icon">🏖️</div>
                <div>
                  <div className="history-type">Congé</div>
                  <div className="history-date">Demandé le 8 janvier 2025</div>
                </div>
              </div>
              <span className="status-badge approved">✓ Approuvé</span>
            </div>
            <div className="history-details">
              <p>
                <strong>Date :</strong> Vendredi 10 janvier (après-midi)
              </p>
              <p>
                <strong>Motif :</strong> Examen à la fac
              </p>
              <p className="history-note success">→ Remplacé par Nicolas</p>
            </div>
          </div>

          <div className="history-item">
            <div className="history-header">
              <div className="history-left">
                <div className="history-icon">🔄</div>
                <div>
                  <div className="history-type">Échange</div>
                  <div className="history-date">Demandé le 2 janvier 2025</div>
                </div>
              </div>
              <span className="status-badge approved">✓ Approuvé</span>
            </div>
            <div className="history-details">
              <p>
                <strong>Date :</strong> Samedi 4 janvier
              </p>
              <p>
                <strong>Motif :</strong> Échange avec Celya
              </p>
            </div>
          </div>

          <div className="history-item">
            <div className="history-header">
              <div className="history-left">
                <div className="history-icon">🏖️</div>
                <div>
                  <div className="history-type">Congé</div>
                  <div className="history-date">Demandé le 15 décembre 2024</div>
                </div>
              </div>
              <span className="status-badge rejected">✗ Refusé</span>
            </div>
            <div className="history-details">
              <p>
                <strong>Date :</strong> Samedi 21 décembre
              </p>
              <p>
                <strong>Motif :</strong> Fête de famille
              </p>
              <p className="history-note error">→ Aucun remplaçant disponible</p>
            </div>
          </div>
        </div>

        <a href="/" className="back-link">
          ← Retour à l'accueil
        </a>
      </main>

      {/* Toast */}
      <div className={`toast ${toast.type} ${toast.visible ? "active" : ""}`}>
        <span>{toast.type === "success" ? "✓" : "✗"}</span>
        <span>{toast.message}</span>
      </div>

      {/* Overlay pour fermer dropdown */}
      {showUserDropdown && <div style={{ position: "fixed", inset: 0, zIndex: 50 }} onClick={() => setShowUserDropdown(false)} />}
    </>
  );
}