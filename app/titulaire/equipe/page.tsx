'use client'

import { useEffect, useMemo, useState } from 'react'

type Role = 'Pharmacien' | 'Preparateur' | 'Apprenti' | 'Etudiant' | 'Conditionneur'
type PlanningType = 'fixe' | 'variable'

type Employee = {
  id: string
  prenom: string
  nom: string
  email?: string
  tel?: string
  initiales?: string
  role: Role
  planning_type?: PlanningType
}

const FUNCTION_CONFIG: Record<
  Role,
  {
    icon: string
    bg: string
    border: string
    badgeBg: string
    badgeText: string
    avatarBg: string
    avatarText: string
    avatarBorder: string
  }
> = {
  Pharmacien: {
    icon: '💊',
    bg: 'bg-emerald-100',
    border: 'border-emerald-200',
    badgeBg: 'bg-emerald-200',
    badgeText: 'text-emerald-900',
    avatarBg: 'bg-emerald-50',
    avatarText: 'text-emerald-900',
    avatarBorder: 'border-emerald-300',
  },
  Preparateur: {
    icon: '💉',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    badgeBg: 'bg-blue-200',
    badgeText: 'text-blue-900',
    avatarBg: 'bg-blue-50',
    avatarText: 'text-blue-900',
    avatarBorder: 'border-blue-300',
  },
  Apprenti: {
    icon: '📚',
    bg: 'bg-amber-100',
    border: 'border-amber-200',
    badgeBg: 'bg-amber-200',
    badgeText: 'text-amber-900',
    avatarBg: 'bg-amber-50',
    avatarText: 'text-amber-900',
    avatarBorder: 'border-amber-300',
  },
  Etudiant: {
    icon: '🎓',
    bg: 'bg-violet-100',
    border: 'border-violet-200',
    badgeBg: 'bg-violet-200',
    badgeText: 'text-violet-900',
    avatarBg: 'bg-violet-50',
    avatarText: 'text-violet-900',
    avatarBorder: 'border-violet-300',
  },
  Conditionneur: {
    icon: '📦',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-900',
    avatarBg: 'bg-slate-50',
    avatarText: 'text-slate-900',
    avatarBorder: 'border-slate-300',
  },
}

const ROLE_LABEL: Record<Role, string> = {
  Pharmacien: 'Pharmaciens',
  Preparateur: 'Préparateurs',
  Apprenti: 'Apprentis',
  Etudiant: 'Étudiants',
  Conditionneur: 'Conditionneurs',
}

// ✅ Liste initiale (démo)
const SEED_EMPLOYEES: Employee[] = [
  // Titulaire (tu peux garder ou retirer)
  { id: 'isabelle-maurer', prenom: 'Isabelle', nom: 'MAURER', role: 'Pharmacien', email: 'isabelle.maurer@pharmabagg.fr', tel: '0601020304', planning_type: 'fixe', initiales: 'IM' },

  // Pharmaciens
  { id: 'lina', prenom: 'Lina', nom: '', role: 'Pharmacien', email: 'lina@pharmabagg.fr', tel: '0601020305', planning_type: 'fixe', initiales: 'LI' },
  { id: 'laura', prenom: 'Laura', nom: '', role: 'Pharmacien', email: 'laura@pharmabagg.fr', tel: '0601020306', planning_type: 'fixe', initiales: 'LA' },
  { id: 'maryam', prenom: 'Maryam', nom: '', role: 'Pharmacien', email: 'maryam@pharmabagg.fr', tel: '0601020307', planning_type: 'fixe', initiales: 'MA' },
  { id: 'remy', prenom: 'Rémy', nom: '', role: 'Pharmacien', email: 'remy@pharmabagg.fr', tel: '0601020308', planning_type: 'fixe', initiales: 'RE' },
  { id: 'raafa', prenom: 'Raafa', nom: '', role: 'Pharmacien', email: 'raafa@pharmabagg.fr', tel: '0601020309', planning_type: 'fixe', initiales: 'RA' },
  { id: 'sarah', prenom: 'Sarah', nom: '', role: 'Pharmacien', email: 'sarah@pharmabagg.fr', tel: '0601020310', planning_type: 'fixe', initiales: 'SA' },
  { id: 'aurelien', prenom: 'Aurélien', nom: '', role: 'Pharmacien', email: 'aurelien@pharmabagg.fr', tel: '0601020311', planning_type: 'fixe', initiales: 'AU' },

  // Préparateurs
  { id: 'sylvie', prenom: 'Sylvie', nom: '', role: 'Preparateur', email: 'sylvie@pharmabagg.fr', tel: '0601020312', planning_type: 'fixe', initiales: 'SY' },
  { id: 'didi', prenom: 'Didi', nom: '', role: 'Preparateur', email: 'didi@pharmabagg.fr', tel: '0601020313', planning_type: 'fixe', initiales: 'DI' },
  { id: 'leila', prenom: 'Leila', nom: '', role: 'Preparateur', email: 'leila@pharmabagg.fr', tel: '0601020314', planning_type: 'fixe', initiales: 'LE' },
  { id: 'ludovic', prenom: 'Ludovic', nom: '', role: 'Preparateur', email: 'ludovic@pharmabagg.fr', tel: '0601020315', planning_type: 'fixe', initiales: 'LU' },
  { id: 'hamide', prenom: 'Hamide', nom: '', role: 'Preparateur', email: 'hamide@pharmabagg.fr', tel: '0601020316', planning_type: 'fixe', initiales: 'HA' },
  { id: 'safia', prenom: 'Safia', nom: '', role: 'Preparateur', email: 'safia@pharmabagg.fr', tel: '0601020317', planning_type: 'fixe', initiales: 'SA' },

  // Apprentis
  { id: 'romena', prenom: 'Romena', nom: '', role: 'Apprenti', email: 'romena@pharmabagg.fr', tel: '0601020318', planning_type: 'variable', initiales: 'RO' },
  { id: 'manon', prenom: 'Manon', nom: '', role: 'Apprenti', email: 'manon@pharmabagg.fr', tel: '0601020319', planning_type: 'variable', initiales: 'MA' },

  // Étudiants
  { id: 'celya', prenom: 'Celya', nom: '', role: 'Etudiant', email: 'celya@pharmabagg.fr', tel: '0601020320', planning_type: 'variable', initiales: 'CE' },
  { id: 'anas', prenom: 'Anas', nom: '', role: 'Etudiant', email: 'anas@pharmabagg.fr', tel: '0601020321', planning_type: 'variable', initiales: 'AN' },
  { id: 'jean-baptiste', prenom: 'Jean-Baptiste', nom: '', role: 'Etudiant', email: 'jeanbaptiste@pharmabagg.fr', tel: '0601020322', planning_type: 'variable', initiales: 'JB' },
  { id: 'eloise', prenom: 'Eloise', nom: '', role: 'Etudiant', email: 'eloise@pharmabagg.fr', tel: '0601020323', planning_type: 'variable', initiales: 'EL' },
  { id: 'nicolas', prenom: 'Nicolas', nom: '', role: 'Etudiant', email: 'nicolas@pharmabagg.fr', tel: '0601020324', planning_type: 'variable', initiales: 'NI' },
  { id: 'matteo', prenom: 'Matteo', nom: '', role: 'Etudiant', email: 'matteo@pharmabagg.fr', tel: '0601020325', planning_type: 'variable', initiales: 'MA' },
  { id: 'robin', prenom: 'Robin', nom: '', role: 'Etudiant', email: 'robin@pharmabagg.fr', tel: '0601020326', planning_type: 'variable', initiales: 'RO' },
  { id: 'kenza', prenom: 'Kenza', nom: '', role: 'Etudiant', email: 'kenza@pharmabagg.fr', tel: '0601020327', planning_type: 'variable', initiales: 'KE' },
  { id: 'maissa', prenom: 'Maissa', nom: '', role: 'Etudiant', email: 'maissa@pharmabagg.fr', tel: '0601020328', planning_type: 'variable', initiales: 'MA' },

  // Conditionneurs
  { id: 'charles', prenom: 'Charles', nom: '', role: 'Conditionneur', email: 'charles@pharmabagg.fr', tel: '0601020329', planning_type: 'variable', initiales: 'CH' },
  { id: 'parmida', prenom: 'Parmida', nom: '', role: 'Conditionneur', email: 'parmida@pharmabagg.fr', tel: '0601020330', planning_type: 'variable', initiales: 'PA' },
  { id: 'melanie', prenom: 'Mélanie', nom: '', role: 'Conditionneur', email: 'melanie@pharmabagg.fr', tel: '0601020331', planning_type: 'variable', initiales: 'ME' },
]

const STORAGE_KEY = 'bp_employees_demo_v1'

function makeId() {
  return crypto?.randomUUID?.() ?? `emp_${Math.random().toString(16).slice(2)}`
}

function initialsFrom(prenom: string, nom: string) {
  const p = (prenom || '').trim()
  const n = (nom || '').trim()
  const a = p ? p[0] : ''
  const b = n ? n[0] : (p.length > 1 ? p[1] : '')
  return (a + b).toUpperCase()
}

export default function EquipePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)

  // Congés (démo)
  const [congeModal, setCongeModal] = useState<{ open: boolean; employee: Employee | null }>({
    open: false,
    employee: null,
  })
  const [congeData, setCongeData] = useState({ dateDebut: '', dateFin: '', motif: '' })

  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleCongeSubmit = () => {
    if (!congeModal.employee || !congeData.dateDebut || !congeData.dateFin) return
    showToast(`✓ Congé enregistré pour ${congeModal.employee.prenom}`)
    setCongeModal({ open: false, employee: null })
    setCongeData({ dateDebut: '', dateFin: '', motif: '' })
  }

  // form state
  const [form, setForm] = useState<Employee>({
    id: '',
    prenom: '',
    nom: '',
    email: '',
    tel: '',
    role: 'Pharmacien',
    planning_type: 'fixe',
    initiales: '',
  })

  // ✅ load seed/localStorage once
  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Employee[]
        setEmployees(parsed)
        return
      } catch {
        // ignore
      }
    }
    setEmployees(SEED_EMPLOYEES)
  }, [])

  // ✅ persist
  useEffect(() => {
    if (!employees.length) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees))
  }, [employees])

  const grouped = useMemo(() => {
    const roles: Role[] = ['Pharmacien', 'Preparateur', 'Apprenti', 'Etudiant', 'Conditionneur']
    const map: Record<Role, Employee[]> = {
      Pharmacien: [],
      Preparateur: [],
      Apprenti: [],
      Etudiant: [],
      Conditionneur: [],
    }
    for (const e of employees) map[e.role].push(e)
    for (const r of roles) map[r].sort((a, b) => a.prenom.localeCompare(b.prenom, 'fr'))
    return { roles, map }
  }, [employees])

  const total = employees.length

  const openAdd = () => {
    setEditing(null)
    setForm({
      id: '',
      prenom: '',
      nom: '',
      email: '',
      tel: '',
      role: 'Pharmacien',
      planning_type: 'fixe',
      initiales: '',
    })
    setModalOpen(true)
  }

  const openEdit = (emp: Employee) => {
    setEditing(emp)
    setForm({ ...emp })
    setModalOpen(true)
  }

  const openConge = (emp: Employee) => {
    const today = new Date().toISOString().split('T')[0]
    setCongeModal({ open: true, employee: emp })
    setCongeData({ dateDebut: today, dateFin: today, motif: '' })
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const saveEmployee = () => {
    // validations mini
    if (!form.prenom.trim()) return alert('Prénom requis')
    if (!form.role) return alert('Fonction requise')

    const fixed: Employee = {
      ...form,
      prenom: form.prenom.trim(),
      nom: (form.nom ?? '').trim(),
      initiales: (form.initiales?.trim() || initialsFrom(form.prenom, form.nom)).toUpperCase(),
    }

    if (editing) {
      setEmployees((prev) => prev.map((e) => (e.id === editing.id ? { ...fixed, id: editing.id } : e)))
    } else {
      setEmployees((prev) => [{ ...fixed, id: makeId() }, ...prev])
    }
    closeModal()
  }

  const deleteEmployee = (emp: Employee) => {
    const ok = confirm(`Supprimer ${emp.prenom} ${emp.nom || ''} ?`)
    if (!ok) return
    setEmployees((prev) => prev.filter((e) => e.id !== emp.id))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Gestion de l’équipe
            </h1>
            <p className="mt-1 text-sm text-slate-700">
              {total} membres au total
            </p>
            
          </div>

          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <span className="text-base">＋</span>
            Ajouter un employé
          </button>
        </div>

        {/* Sections */}
        <div className="mt-8 space-y-8">
          {grouped.roles.map((role) => {
            const cfg = FUNCTION_CONFIG[role]
            const items = grouped.map[role]
            return (
              <div key={role} className="space-y-4">
                <div className={`flex items-center justify-between rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3 text-slate-900`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cfg.icon}</span>
                    <span className="font-extrabold text-slate-900">{ROLE_LABEL[role]}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cfg.badgeBg} ${cfg.badgeText}`}>
                      {items.length}
                    </span>
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-700">
                    Aucun {ROLE_LABEL[role].toLowerCase()} pour le moment
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((emp) => {
                      const cfgEmp = FUNCTION_CONFIG[emp.role]
                      const initials = (emp.initiales || initialsFrom(emp.prenom, emp.nom)).toUpperCase()

                      return (
                        <div
                          key={emp.id}
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-4">
                              <div
                                className={[
                                  'flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-extrabold',
                                  cfgEmp.avatarBg,
                                  cfgEmp.avatarText,
                                  cfgEmp.avatarBorder,
                                ].join(' ')}
                              >
                                {initials}
                              </div>

                              <div>
                                <div className="text-base font-extrabold text-slate-900">
                                  {emp.prenom} {emp.nom}
                                </div>

                                <div className="text-sm font-medium text-slate-700">
                                  {role === 'Preparateur' ? 'Préparateur' : role === 'Etudiant' ? 'Étudiant' : role}
                                </div>

                                {emp.email && (
                                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-700">
                                    <span>✉️</span>
                                    <span className="break-all">{emp.email}</span>
                                  </div>
                                )}

                                {emp.tel && (
                                  <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-700">
                                    <span>📞</span>
                                    <span>{emp.tel}</span>
                                  </div>
                                )}

                                <div
                                  className={[
                                    'mt-3 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-semibold',
                                    cfgEmp.border,
                                    cfgEmp.bg,
                                    cfgEmp.badgeText,
                                  ].join(' ')}
                                >
                                  🗓️ {emp.planning_type === 'variable' ? 'Variable' : 'Fixe'}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => openEdit(emp)}
                                className="rounded-lg p-2 text-blue-700 hover:bg-blue-50"
                                title="Modifier"
                              >
                                ✏️
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openConge(emp)
                                }}
                                className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100"
                                title="Déclarer un congé"
                              >
                                🏖️
                              </button>

                              <button
                                onClick={() => deleteEmployee(emp)}
                                className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                                title="Supprimer"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white text-slate-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="text-lg font-extrabold text-slate-900">
                {editing ? 'Modifier un employé' : 'Ajouter un employé'}
              </div>
              <button onClick={closeModal} className="rounded-lg px-3 py-1 text-slate-900 hover:bg-slate-100">
                ✕
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-slate-900">
                Renseignez les informations de base. Le planning sera défini ultérieurement.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-900">Prénom *</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-400"
                    value={form.prenom}
                    onChange={(e) => setForm((p) => ({ ...p, prenom: e.target.value }))}
                    placeholder="Ex: Marie"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-900">Nom</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-400"
                    value={form.nom}
                    onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                    placeholder="Ex: Dupont"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-slate-900">Email</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-400"
                    value={form.email ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Ex: marie.dupont@email.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-900">Téléphone</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-400"
                    value={form.tel ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, tel: e.target.value }))}
                    placeholder="Ex: 06 12 34 56 78"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-900">Initiales *</label>
                  <div className="mt-2 flex gap-2">
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 uppercase outline-none focus:border-slate-400"
                      value={form.initiales ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, initiales: e.target.value.toUpperCase() }))}
                      placeholder="MD"
                      maxLength={3}
                    />
                    <button
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          initiales: initialsFrom(p.prenom, p.nom),
                        }))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
                      type="button"
                    >
                      Auto
                    </button>
                  </div>
                </div>
              </div>

              {/* Function */}
              <div className="mt-5">
                <label className="text-sm font-semibold text-slate-900">Fonction *</label>
                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                  {(['Pharmacien', 'Preparateur', 'Apprenti', 'Etudiant', 'Conditionneur'] as Role[]).map((r) => {
                    const cfg = FUNCTION_CONFIG[r]
                    const active = form.role === r
                    const label =
                      r === 'Preparateur' ? 'Préparateur' : r === 'Etudiant' ? 'Étudiant' : r

                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, role: r }))}
                        className={[
                          'rounded-xl border p-3 text-left text-sm font-semibold text-slate-900 transition',
                          active ? `${cfg.border} ${cfg.bg}` : 'border-slate-200 bg-white hover:bg-slate-50',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-2">
                          <span>{cfg.icon}</span>
                          <span>{label}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Planning type */}
              <div className="mt-5">
                <label className="text-sm font-semibold text-slate-900">Type de planning *</label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, planning_type: 'variable' }))}
                    className={[
                      'rounded-xl border p-4 text-left text-sm text-slate-900 transition',
                      form.planning_type === 'variable'
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <div className="font-bold">Planning variable</div>
                    <div className="mt-1 text-xs text-slate-900">Aucun planning à renseigner maintenant</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, planning_type: 'fixe' }))}
                    className={[
                      'rounded-xl border p-4 text-left text-sm text-slate-900 transition',
                      form.planning_type === 'fixe'
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <div className="font-bold">Planning fixe</div>
                    <div className="mt-1 text-xs text-slate-900">Définir un planning hebdo (Lun → Sam)</div>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEmployee}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  {editing ? '✔ Modifier' : '✔ Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Congé (démo) */}
      {congeModal.open && congeModal.employee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setCongeModal({ open: false, employee: null })}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                🏖️ Congé — {congeModal.employee.prenom}
              </h3>
              <button
                onClick={() => setCongeModal({ open: false, employee: null })}
                className="rounded-lg bg-slate-100 px-3 py-1 text-slate-900 hover:bg-slate-200"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900">Du (début)</label>
                <input
                  type="date"
                  value={congeData.dateDebut}
                  onChange={(e) =>
                    setCongeData((p) => ({
                      ...p,
                      dateDebut: e.target.value,
                      dateFin: p.dateFin < e.target.value ? e.target.value : p.dateFin,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900">Au (fin)</label>
                <input
                  type="date"
                  min={congeData.dateDebut}
                  value={congeData.dateFin}
                  onChange={(e) => setCongeData((p) => ({ ...p, dateFin: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900">Motif (optionnel)</label>
                <input
                  type="text"
                  value={congeData.motif}
                  onChange={(e) => setCongeData((p) => ({ ...p, motif: e.target.value }))}
                  placeholder="Vacances, RDV..."
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-400"
                />
              </div>

              <div className="rounded-xl bg-red-50 p-3 text-center text-xs font-semibold text-red-800">
                📅{' '}
                {congeData.dateDebut && congeData.dateFin
                  ? congeData.dateDebut === congeData.dateFin
                    ? '1 jour'
                    : `${
                        Math.ceil(
                          (new Date(congeData.dateFin).getTime() - new Date(congeData.dateDebut).getTime()) /
                            86400000
                        ) + 1
                      } jours`
                  : 'Sélectionnez les dates'}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCongeModal({ open: false, employee: null })}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  type="button"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCongeSubmit}
                  disabled={!congeData.dateDebut || !congeData.dateFin}
                  className="flex-[2] rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  type="button"
                >
                  🏖️ Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}