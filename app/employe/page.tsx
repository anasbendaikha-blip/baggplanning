'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { Employee } from '@/types/supabase'

type DisponibiliteRow = Record<string, any>

type PlanningRow = {
  id: string
  employee_id: string
  date: string
  debut: string
  fin: string
}

type DemandeRow = {
  id: string
  employee_id: string
  type: 'conge' | 'echange' | 'maladie' | 'autre'
  date_debut: string
  date_fin: string
  creneau: 'journee' | 'matin' | 'apres-midi'
  motif: string | null
  urgent: boolean
  status: 'en_attente' | 'approuve' | 'refuse'
  created_at?: string | null
}

export default function EmployePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [employee, setEmployee] = useState<Employee | null>(null)

  const [onglet, setOnglet] = useState<'dispos' | 'demande' | 'planning' | 'historique'>('dispos')
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  })

  // Disponibilités
  const [disponibilite, setDisponibilite] = useState<DisponibiliteRow | null>(null)
  const [dispoForm, setDispoForm] = useState<Record<string, { disponible: boolean; debut: string; fin: string }>>({
    lundi: { disponible: false, debut: '08:30', fin: '20:30' },
    mardi: { disponible: false, debut: '08:30', fin: '20:30' },
    mercredi: { disponible: false, debut: '08:30', fin: '20:30' },
    jeudi: { disponible: false, debut: '08:30', fin: '20:30' },
    vendredi: { disponible: false, debut: '08:30', fin: '20:30' },
    samedi: { disponible: false, debut: '08:30', fin: '19:30' },
  })

  // Planning
  const [planning, setPlanning] = useState<PlanningRow[]>([])

  // Demandes
  const [demandes, setDemandes] = useState<DemandeRow[]>([])
  const [demandeForm, setDemandeForm] = useState({
    type: 'conge' as const,
    date_debut: '',
    date_fin: '',
    creneau: 'journee' as const,
    motif: '',
    urgent: false,
  })

  const [savingDispo, setSavingDispo] = useState(false)
  const [sendingDemande, setSendingDemande] = useState(false)

  // Calculer le lundi de la semaine courante
  const getMondayOfWeek = () => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  }

  const [semaineDebut, setSemaineDebut] = useState(getMondayOfWeek())

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type })
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3500)
  }

  // =========================
  // AUTH + LOAD DATA
  // =========================
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)

      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser()

      if (authErr) console.error('auth.getUser error', authErr)

      if (!user) {
        router.replace('/auth/login')
        return
      }

      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('id, user_type, employee_id, employees(*)')
        .eq('id', user.id)
        .single()

      if (userErr) {
        console.error('Erreur fetch users:', userErr)
        router.replace('/auth/login')
        return
      }

      if (!userData || userData.user_type !== 'employe') {
        router.replace('/auth/login')
        return
      }

      // ⚠️ Selon la relation Supabase, `employees` peut être un objet OU un tableau
      const employeesData = (userData as any).employees
      const emp: Employee | null = Array.isArray(employeesData) ? (employeesData[0] ?? null) : (employeesData ?? null)

      if (!emp) {
        console.error('Aucun employee relié à ce user')
        router.replace('/auth/login')
        return
      }

      setEmployee(emp)

      await Promise.all([loadDisponibilite(emp.id), loadPlanning(emp.id), loadDemandes(emp.id)])

      setLoading(false)
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, semaineDebut])

  // =========================
  // LOADERS
  // =========================
  const loadDisponibilite = async (employeeId: string) => {
    const { data, error } = await supabase
      .from('disponibilites')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('semaine_debut', semaineDebut)
      .single()

    if (error) {
      // pas grave si pas de ligne (pas encore saisi)
      // PGRST116 = "No rows" sur .single()
      if ((error as any).code !== 'PGRST116') console.error('Erreur loadDisponibilite:', error)
      return
    }

    if (data) {
      setDisponibilite(data)

      const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
      const newForm: typeof dispoForm = { ...dispoForm }

      jours.forEach((jour) => {
        newForm[jour] = {
          disponible: Boolean((data as any)[`${jour}_disponible`]),
          debut: (data as any)[`${jour}_debut`] ?? '08:30',
          fin: (data as any)[`${jour}_fin`] ?? (jour === 'samedi' ? '19:30' : '20:30'),
        }
      })

      setDispoForm(newForm)
    }
  }

  const loadPlanning = async (employeeId: string) => {
    const dateFin = new Date(semaineDebut)
    dateFin.setDate(dateFin.getDate() + 5)
    const dateFinStr = dateFin.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('planning')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('date', semaineDebut)
      .lte('date', dateFinStr)
      .order('date')

    if (error) {
      console.error('Erreur loadPlanning:', error)
      setPlanning([])
      return
    }

    setPlanning((data as PlanningRow[]) ?? [])
  }

  const loadDemandes = async (employeeId: string) => {
    const { data, error } = await supabase
      .from('demandes')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Erreur loadDemandes:', error)
      setDemandes([])
      return
    }

    setDemandes((data as DemandeRow[]) ?? [])
  }

  // =========================
  // ACTIONS
  // =========================
  const saveDisponibilites = async () => {
    if (!employee) return
    setSavingDispo(true)

    const payload: Record<string, any> = {
      employee_id: employee.id,
      semaine_debut: semaineDebut,
    }

    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
    jours.forEach((jour) => {
      payload[`${jour}_disponible`] = dispoForm[jour].disponible
      payload[`${jour}_debut`] = dispoForm[jour].disponible ? dispoForm[jour].debut : null
      payload[`${jour}_fin`] = dispoForm[jour].disponible ? dispoForm[jour].fin : null
    })

    const { error } = await supabase.from('disponibilites').upsert([payload], { onConflict: 'employee_id,semaine_debut' })

    setSavingDispo(false)

    if (error) {
      showToast('Erreur: ' + error.message, 'error')
      return
    }

    showToast('Disponibilités enregistrées !')
    await loadDisponibilite(employee.id)
  }

  const sendDemande = async () => {
    if (!employee) return
    if (!demandeForm.date_debut || !demandeForm.date_fin) {
      showToast('Veuillez remplir les dates', 'error')
      return
    }

    setSendingDemande(true)

    const { error } = await supabase.from('demandes').insert([
      {
        employee_id: employee.id,
        type: demandeForm.type,
        date_debut: demandeForm.date_debut,
        date_fin: demandeForm.date_fin,
        creneau: demandeForm.creneau,
        motif: demandeForm.motif || null,
        urgent: demandeForm.urgent,
        status: 'en_attente',
      },
    ])

    setSendingDemande(false)

    if (error) {
      showToast('Erreur: ' + error.message, 'error')
      return
    }

    showToast('Demande envoyée !')
    setDemandeForm({
      type: 'conge',
      date_debut: '',
      date_fin: '',
      creneau: 'journee',
      motif: '',
      urgent: false,
    })
    await loadDemandes(employee.id)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/auth/login')
  }

  // =========================
  // UI HELPERS
  // =========================
  const toggleDispo = (jour: string) => {
    setDispoForm((prev) => ({
      ...prev,
      [jour]: { ...prev[jour], disponible: !prev[jour].disponible },
    }))
  }

  const updateHeure = (jour: string, field: 'debut' | 'fin', value: string) => {
    setDispoForm((prev) => ({
      ...prev,
      [jour]: { ...prev[jour], [field]: value },
    }))
  }

  const setAllAvailable = () => {
    const newForm: typeof dispoForm = {}
    Object.keys(dispoForm).forEach((jour) => {
      newForm[jour] = { ...dispoForm[jour], disponible: true }
    })
    setDispoForm(newForm)
  }

  const clearAll = () => {
    const newForm: typeof dispoForm = {}
    Object.keys(dispoForm).forEach((jour) => {
      newForm[jour] = { ...dispoForm[jour], disponible: false }
    })
    setDispoForm(newForm)
  }

  const heures = [
    '08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
    '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00',
    '17:30','18:00','18:30','19:00','19:30','20:00','20:30',
  ]

  const joursLabels = [
    { key: 'lundi', label: 'Lundi', short: 'Lun' },
    { key: 'mardi', label: 'Mardi', short: 'Mar' },
    { key: 'mercredi', label: 'Mercredi', short: 'Mer' },
    { key: 'jeudi', label: 'Jeudi', short: 'Jeu' },
    { key: 'vendredi', label: 'Vendredi', short: 'Ven' },
    { key: 'samedi', label: 'Samedi', short: 'Sam' },
  ]

  const getDateForDay = (index: number) => {
    const d = new Date(semaineDebut)
    d.setDate(d.getDate() + index)
    return d.getDate()
  }

  const calculerTotalHeures = () => {
    let total = 0
    Object.values(dispoForm).forEach((jour) => {
      if (jour.disponible && jour.debut && jour.fin) {
        const [hd, md] = jour.debut.split(':').map(Number)
        const [hf, mf] = jour.fin.split(':').map(Number)
        total += hf * 60 + mf - (hd * 60 + md)
      }
    })
    const h = Math.floor(total / 60)
    const m = total % 60
    return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
  }

  const formatHeure = (h: string) => (h ? h.replace(':', 'h') : '')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approuve':
        return { bg: '#d1fae5', color: '#047857', text: '✓ Approuvé' }
      case 'refuse':
        return { bg: '#fee2e2', color: '#b91c1c', text: '✗ Refusé' }
      default:
        return { bg: '#fef3c7', color: '#b45309', text: '⏳ En attente' }
    }
  }

  const styles = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); min-height: 100vh; }
    .header { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); box-shadow: 0 2px 20px rgba(0,0,0,0.08); }
    .header-content { max-width: 800px; margin: 0 auto; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; }
    .logo-section { display: flex; align-items: center; gap: 12px; }
    .logo { width: 44px; height: 44px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; color: white; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
    .logo-text h1 { font-size: 18px; font-weight: 700; color: #1e293b; }
    .logo-text p { font-size: 12px; color: #64748b; }
    .user-section { display: flex; align-items: center; gap: 12px; }
    .user-badge { display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); padding: 8px 14px; border-radius: 12px; }
    .user-avatar { width: 32px; height: 32px; background: linear-gradient(135deg, #fb923c, #ea580c); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 700; }
    .user-name { font-weight: 600; color: #334155; font-size: 14px; }
    .logout-btn { padding: 8px 12px; background: none; border: 1px solid #e2e8f0; border-radius: 8px; color: #64748b; font-size: 13px; cursor: pointer; }
    .logout-btn:hover { background: #f1f5f9; }
    .nav { position: sticky; top: 68px; z-index: 90; background: white; border-bottom: 1px solid #e2e8f0; }
    .nav-content { max-width: 800px; margin: 0 auto; padding: 8px 20px; display: flex; gap: 6px; }
    .tab { flex: 1; padding: 12px; border: none; background: none; border-radius: 10px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; font-family: inherit; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: all 0.2s; }
    .tab:hover { background: #f1f5f9; }
    .tab.active { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
    .tab-icon { font-size: 18px; }
    .main { max-width: 800px; margin: 0 auto; padding: 20px; }
    .view { display: none; }
    .view.active { display: block; }
    .card { background: white; border-radius: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); overflow: hidden; margin-bottom: 20px; }
    .card-header { padding: 20px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; }
    .card-header-purple { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    .card-header-green { background: linear-gradient(135deg, #10b981, #059669); }
    .card-title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
    .card-subtitle { font-size: 13px; opacity: 0.9; margin-top: 4px; }
    .card-body { padding: 20px; }
    .quick-actions { display: flex; gap: 10px; margin-bottom: 20px; }
    .quick-btn { flex: 1; padding: 12px; border: 2px solid #e2e8f0; border-radius: 12px; background: white; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .quick-btn:hover { border-color: #3b82f6; color: #3b82f6; }
    .day-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .day-card { border: 2px solid #e2e8f0; border-radius: 16px; padding: 16px; transition: all 0.2s; }
    .day-card.available { border-color: #10b981; background: linear-gradient(135deg, #ecfdf5, #d1fae5); }
    .day-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .day-name { font-weight: 700; color: #1e293b; }
    .day-date { font-size: 12px; color: #64748b; }
    .toggle-btn { width: 52px; height: 28px; border-radius: 14px; border: none; cursor: pointer; position: relative; transition: all 0.2s; }
    .toggle-btn.off { background: #e2e8f0; }
    .toggle-btn.on { background: #10b981; }
    .toggle-btn::after { content: ''; position: absolute; top: 2px; width: 24px; height: 24px; border-radius: 50%; background: white; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .toggle-btn.off::after { left: 2px; }
    .toggle-btn.on::after { left: 26px; }
    .time-selectors { display: flex; gap: 8px; align-items: center; }
    .time-select { flex: 1; padding: 10px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: inherit; background: white; cursor: pointer; }
    .time-select:focus { outline: none; border-color: #3b82f6; }
    .time-arrow { color: #94a3b8; font-size: 14px; }
    .btn { padding: 14px 24px; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; width: 100%; }
    .btn-primary { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
    .btn-success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .form-group { margin-bottom: 20px; }
    .form-label { display: block; font-weight: 600; color: #334155; font-size: 14px; margin-bottom: 8px; }
    .form-input { width: 100%; padding: 14px 16px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-family: inherit; }
    .form-input:focus { outline: none; border-color: #3b82f6; background: white; }
    .form-textarea { min-height: 100px; resize: vertical; }
    .type-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .type-option { padding: 16px; border: 2px solid #e2e8f0; border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.2s; }
    .type-option.selected { border-color: #3b82f6; background: #eff6ff; }
    .creneau-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .creneau-option { padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; text-align: center; cursor: pointer; font-size: 13px; font-weight: 600; color: #475569; }
    .creneau-option.selected { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; }
    .planning-day { background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .planning-day-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .planning-day-name { font-weight: 700; color: #1e293b; }
    .planning-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .planning-badge.working { background: #d1fae5; color: #047857; }
    .planning-badge.off { background: #f1f5f9; color: #64748b; }
    .planning-hours { font-size: 14px; color: #475569; }
    .demande-card { background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .demande-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .demande-type { font-weight: 600; color: #1e293b; }
    .demande-status { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .demande-details { font-size: 13px; color: #64748b; }
    .total-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 8px; font-size: 13px; margin-top: 8px; }
    .toast { position: fixed; bottom: 24px; right: 24px; padding: 16px 24px; border-radius: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 1000; opacity: 0; transform: translateY(20px); transition: all 0.3s; font-weight: 600; color: white; }
    .toast.success { background: linear-gradient(135deg, #10b981, #059669); }
    .toast.error { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .toast.active { opacity: 1; transform: translateY(0); }
    .loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; font-size: 18px; color: #64748b; }
    .empty-state { text-align: center; padding: 40px 20px; color: #64748b; }
    .checkbox-label { display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .checkbox-label input { width: 20px; height: 20px; cursor: pointer; }
    @media (max-width: 600px) { .day-grid { grid-template-columns: 1fr; } .type-grid { grid-template-columns: 1fr; } }
  `

  if (loading) {
    return (
      <div>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div className="loading">⏳ Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">📅</div>
            <div className="logo-text">
              <h1>BaggPlanning</h1>
              <p>Espace Employé</p>
            </div>
          </div>
          <div className="user-section">
            <div className="user-badge">
              <div className="user-avatar">{employee?.prenom?.substring(0, 2).toUpperCase()}</div>
              <span className="user-name">{employee?.prenom}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="nav">
        <div className="nav-content">
          <button className={`tab ${onglet === 'dispos' ? 'active' : ''}`} onClick={() => setOnglet('dispos')}>
            <span className="tab-icon">✋</span>
            <span>Disponibilités</span>
          </button>
          <button className={`tab ${onglet === 'demande' ? 'active' : ''}`} onClick={() => setOnglet('demande')}>
            <span className="tab-icon">📝</span>
            <span>Demande</span>
          </button>
          <button className={`tab ${onglet === 'planning' ? 'active' : ''}`} onClick={() => setOnglet('planning')}>
            <span className="tab-icon">📅</span>
            <span>Planning</span>
          </button>
          <button
            className={`tab ${onglet === 'historique' ? 'active' : ''}`}
            onClick={() => setOnglet('historique')}
          >
            <span className="tab-icon">📋</span>
            <span>Historique</span>
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="main">
        {/* Vue Disponibilités */}
        <div className={`view ${onglet === 'dispos' ? 'active' : ''}`}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">✋ Mes disponibilités</div>
              <div className="card-subtitle">
                Semaine du {new Date(semaineDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </div>
              <div className="total-badge">⏱️ Total: {calculerTotalHeures()}</div>
            </div>
            <div className="card-body">
              <div className="quick-actions">
                <button className="quick-btn" onClick={setAllAvailable}>
                  ✅ Tout disponible
                </button>
                <button className="quick-btn" onClick={clearAll}>
                  ❌ Tout effacer
                </button>
              </div>

              <div className="day-grid">
                {joursLabels.map((jour, index) => (
                  <div key={jour.key} className={`day-card ${dispoForm[jour.key].disponible ? 'available' : ''}`}>
                    <div className="day-header">
                      <div>
                        <div className="day-name">{jour.label}</div>
                        <div className="day-date">{getDateForDay(index)} janvier</div>
                      </div>
                      <button
                        className={`toggle-btn ${dispoForm[jour.key].disponible ? 'on' : 'off'}`}
                        onClick={() => toggleDispo(jour.key)}
                      />
                    </div>

                    {dispoForm[jour.key].disponible && (
                      <div className="time-selectors">
                        <select
                          className="time-select"
                          value={dispoForm[jour.key].debut}
                          onChange={(e) => updateHeure(jour.key, 'debut', e.target.value)}
                        >
                          {heures.map((h) => (
                            <option key={h} value={h}>
                              {formatHeure(h)}
                            </option>
                          ))}
                        </select>
                        <span className="time-arrow">→</span>
                        <select
                          className="time-select"
                          value={dispoForm[jour.key].fin}
                          onChange={(e) => updateHeure(jour.key, 'fin', e.target.value)}
                        >
                          {heures.map((h) => (
                            <option key={h} value={h}>
                              {formatHeure(h)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20 }}>
                <button className="btn btn-primary" onClick={saveDisponibilites} disabled={savingDispo}>
                  {savingDispo ? '⏳ Enregistrement...' : '💾 Enregistrer mes disponibilités'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Vue Demande */}
        <div className={`view ${onglet === 'demande' ? 'active' : ''}`}>
          <div className="card">
            <div className="card-header card-header-purple">
              <div className="card-title">📝 Nouvelle demande</div>
              <div className="card-subtitle">Congé, échange ou absence</div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Type de demande</label>
                <div className="type-grid">
                  {[
                    { id: 'conge', icon: '🏖️', label: 'Congé' },
                    { id: 'echange', icon: '🔄', label: 'Échange' },
                    { id: 'maladie', icon: '🏥', label: 'Maladie' },
                    { id: 'autre', icon: '📋', label: 'Autre' },
                  ].map((type) => (
                    <div
                      key={type.id}
                      className={`type-option ${demandeForm.type === type.id ? 'selected' : ''}`}
                      onClick={() => setDemandeForm({ ...demandeForm, type: type.id as any })}
                    >
                      <div className="type-icon">{type.icon}</div>
                      <div className="type-label">{type.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Date de début</label>
                <input
                  type="date"
                  className="form-input"
                  value={demandeForm.date_debut}
                  onChange={(e) => setDemandeForm({ ...demandeForm, date_debut: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date de fin</label>
                <input
                  type="date"
                  className="form-input"
                  value={demandeForm.date_fin}
                  onChange={(e) => setDemandeForm({ ...demandeForm, date_fin: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Créneau</label>
                <div className="creneau-grid">
                  {[
                    { id: 'journee', label: 'Journée' },
                    { id: 'matin', label: 'Matin' },
                    { id: 'apres-midi', label: 'Après-midi' },
                  ].map((creneau) => (
                    <div
                      key={creneau.id}
                      className={`creneau-option ${demandeForm.creneau === creneau.id ? 'selected' : ''}`}
                      onClick={() => setDemandeForm({ ...demandeForm, creneau: creneau.id as any })}
                    >
                      {creneau.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Motif</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Expliquez brièvement la raison..."
                  value={demandeForm.motif}
                  onChange={(e) => setDemandeForm({ ...demandeForm, motif: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={demandeForm.urgent}
                    onChange={(e) => setDemandeForm({ ...demandeForm, urgent: e.target.checked })}
                  />
                  <span>⚡ Demande urgente</span>
                </label>
              </div>

              <button className="btn btn-success" onClick={sendDemande} disabled={sendingDemande}>
                {sendingDemande ? '⏳ Envoi...' : '📤 Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>

        {/* Vue Planning */}
        <div className={`view ${onglet === 'planning' ? 'active' : ''}`}>
          <div className="card">
            <div className="card-header card-header-green">
              <div className="card-title">📅 Mon planning</div>
              <div className="card-subtitle">
                Semaine du {new Date(semaineDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </div>
            </div>
            <div className="card-body">
              {joursLabels.map((jour, index) => {
                const d = new Date(semaineDebut)
                d.setDate(d.getDate() + index)
                const dateStr = d.toISOString().split('T')[0]

                const dayPlan = planning.find((p) => p.date === dateStr)

                return (
                  <div key={jour.key} className="planning-day">
                    <div className="planning-day-header">
                      <span className="planning-day-name">
                        {jour.label} {getDateForDay(index)}
                      </span>
                      <span className={`planning-badge ${dayPlan ? 'working' : 'off'}`}>
                        {dayPlan ? '✓ Travail' : 'Repos'}
                      </span>
                    </div>

                    {dayPlan && (
                      <div className="planning-hours">
                        🕐 {formatHeure(dayPlan.debut)} → {formatHeure(dayPlan.fin)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Vue Historique */}
        <div className={`view ${onglet === 'historique' ? 'active' : ''}`}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">📋 Historique des demandes</div>
            </div>
            <div className="card-body">
              {demandes.length === 0 ? (
                <div className="empty-state">
                  <p>Aucune demande pour le moment</p>
                </div>
              ) : (
                demandes.map((demande) => {
                  const status = getStatusBadge(demande.status)
                  return (
                    <div key={demande.id} className="demande-card">
                      <div className="demande-header">
                        <span className="demande-type">
                          {demande.type === 'conge' && '🏖️ Congé'}
                          {demande.type === 'echange' && '🔄 Échange'}
                          {demande.type === 'maladie' && '🏥 Maladie'}
                          {demande.type === 'autre' && '📋 Autre'}
                        </span>
                        <span className="demande-status" style={{ background: status.bg, color: status.color }}>
                          {status.text}
                        </span>
                      </div>
                      <div className="demande-details">
                        📅 {new Date(demande.date_debut).toLocaleDateString('fr-FR')}
                        {demande.date_debut !== demande.date_fin && ` → ${new Date(demande.date_fin).toLocaleDateString('fr-FR')}`}
                        <br />
                        💬 {demande.motif || 'Pas de motif'}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Toast */}
      <div className={`toast ${toast.type} ${toast.visible ? 'active' : ''}`}>
        <span>{toast.type === 'success' ? '✓' : '✗'}</span>
        <span>{toast.message}</span>
      </div>
    </div>
  )
}