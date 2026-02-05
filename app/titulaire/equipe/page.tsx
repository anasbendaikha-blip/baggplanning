'use client'

import { useEffect, useMemo, useState } from 'react'
import { T, ROLE_PALETTE, getRolePalette, type RoleColorSet } from '@/lib/ui-tokens'
import type { EmployeeRole } from '@/lib/mock-data'

// ============================================================
// Types
// ============================================================

type Role = EmployeeRole
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

// ============================================================
// Config couleurs & labels (via ui-tokens)
// ============================================================

const ROLE_COLORS: Record<Role, string> = {
  Pharmacien: ROLE_PALETTE.Pharmacien.bg,
  Preparateur: ROLE_PALETTE.Preparateur.bg,
  Apprenti: ROLE_PALETTE.Apprenti.bg,
  Etudiant: ROLE_PALETTE.Etudiant.bg,
  Conditionneur: ROLE_PALETTE.Conditionneur.bg,
}

const ROLE_ICONS: Record<Role, string> = {
  Pharmacien: '\u{1F48A}',
  Preparateur: '\u{1F489}',
  Apprenti: '\u{1F4DA}',
  Etudiant: '\u{1F393}',
  Conditionneur: '\u{1F4E6}',
}

const ROLE_LABELS: Record<Role, string> = {
  Pharmacien: 'Pharmacien',
  Preparateur: 'Préparateur',
  Apprenti: 'Apprenti',
  Etudiant: 'Étudiant',
  Conditionneur: 'Conditionneur',
}

const ROLE_LABELS_PLURAL: Record<Role, string> = {
  Pharmacien: 'Pharmaciens',
  Preparateur: 'Préparateurs',
  Apprenti: 'Apprentis',
  Etudiant: 'Étudiants',
  Conditionneur: 'Conditionneurs',
}

const ALL_ROLES: Role[] = ['Pharmacien', 'Preparateur', 'Apprenti', 'Etudiant', 'Conditionneur']

// ============================================================
// Seed data (demo)
// ============================================================

const SEED_EMPLOYEES: Employee[] = [
  { id: 'isabelle-maurer', prenom: 'Isabelle', nom: 'MAURER', role: 'Pharmacien', email: 'isabelle.maurer@pharmabagg.fr', tel: '0601020304', planning_type: 'fixe', initiales: 'IM' },
  { id: 'lina', prenom: 'Lina', nom: '', role: 'Pharmacien', email: 'lina@pharmabagg.fr', tel: '0601020305', planning_type: 'fixe', initiales: 'LI' },
  { id: 'laura', prenom: 'Laura', nom: '', role: 'Pharmacien', email: 'laura@pharmabagg.fr', tel: '0601020306', planning_type: 'fixe', initiales: 'LA' },
  { id: 'maryam', prenom: 'Maryam', nom: '', role: 'Pharmacien', email: 'maryam@pharmabagg.fr', tel: '0601020307', planning_type: 'fixe', initiales: 'MA' },
  { id: 'remy', prenom: 'Rémy', nom: '', role: 'Pharmacien', email: 'remy@pharmabagg.fr', tel: '0601020308', planning_type: 'fixe', initiales: 'RE' },
  { id: 'raafa', prenom: 'Raafa', nom: '', role: 'Pharmacien', email: 'raafa@pharmabagg.fr', tel: '0601020309', planning_type: 'fixe', initiales: 'RA' },
  { id: 'sarah', prenom: 'Sarah', nom: '', role: 'Pharmacien', email: 'sarah@pharmabagg.fr', tel: '0601020310', planning_type: 'fixe', initiales: 'SA' },
  { id: 'aurelien', prenom: 'Aurélien', nom: '', role: 'Pharmacien', email: 'aurelien@pharmabagg.fr', tel: '0601020311', planning_type: 'fixe', initiales: 'AU' },
  { id: 'sylvie', prenom: 'Sylvie', nom: '', role: 'Preparateur', email: 'sylvie@pharmabagg.fr', tel: '0601020312', planning_type: 'fixe', initiales: 'SY' },
  { id: 'didi', prenom: 'Didi', nom: '', role: 'Preparateur', email: 'didi@pharmabagg.fr', tel: '0601020313', planning_type: 'fixe', initiales: 'DI' },
  { id: 'leila', prenom: 'Leila', nom: '', role: 'Preparateur', email: 'leila@pharmabagg.fr', tel: '0601020314', planning_type: 'fixe', initiales: 'LE' },
  { id: 'ludovic', prenom: 'Ludovic', nom: '', role: 'Preparateur', email: 'ludovic@pharmabagg.fr', tel: '0601020315', planning_type: 'fixe', initiales: 'LU' },
  { id: 'hamide', prenom: 'Hamide', nom: '', role: 'Preparateur', email: 'hamide@pharmabagg.fr', tel: '0601020316', planning_type: 'fixe', initiales: 'HA' },
  { id: 'safia', prenom: 'Safia', nom: '', role: 'Preparateur', email: 'safia@pharmabagg.fr', tel: '0601020317', planning_type: 'fixe', initiales: 'SF' },
  { id: 'romena', prenom: 'Romena', nom: '', role: 'Apprenti', email: 'romena@pharmabagg.fr', tel: '0601020318', planning_type: 'variable', initiales: 'RO' },
  { id: 'manon', prenom: 'Manon', nom: '', role: 'Apprenti', email: 'manon@pharmabagg.fr', tel: '0601020319', planning_type: 'variable', initiales: 'MN' },
  { id: 'celya', prenom: 'Celya', nom: '', role: 'Etudiant', email: 'celya@pharmabagg.fr', tel: '0601020320', planning_type: 'variable', initiales: 'CE' },
  { id: 'anas', prenom: 'Anas', nom: '', role: 'Etudiant', email: 'anas@pharmabagg.fr', tel: '0601020321', planning_type: 'variable', initiales: 'AN' },
  { id: 'jean-baptiste', prenom: 'Jean-Baptiste', nom: '', role: 'Etudiant', email: 'jeanbaptiste@pharmabagg.fr', tel: '0601020322', planning_type: 'variable', initiales: 'JB' },
  { id: 'eloise', prenom: 'Eloise', nom: '', role: 'Etudiant', email: 'eloise@pharmabagg.fr', tel: '0601020323', planning_type: 'variable', initiales: 'EL' },
  { id: 'nicolas', prenom: 'Nicolas', nom: '', role: 'Etudiant', email: 'nicolas@pharmabagg.fr', tel: '0601020324', planning_type: 'variable', initiales: 'NI' },
  { id: 'matteo', prenom: 'Matteo', nom: '', role: 'Etudiant', email: 'matteo@pharmabagg.fr', tel: '0601020325', planning_type: 'variable', initiales: 'MT' },
  { id: 'robin', prenom: 'Robin', nom: '', role: 'Etudiant', email: 'robin@pharmabagg.fr', tel: '0601020326', planning_type: 'variable', initiales: 'RO' },
  { id: 'kenza', prenom: 'Kenza', nom: '', role: 'Etudiant', email: 'kenza@pharmabagg.fr', tel: '0601020327', planning_type: 'variable', initiales: 'KE' },
  { id: 'maissa', prenom: 'Maissa', nom: '', role: 'Etudiant', email: 'maissa@pharmabagg.fr', tel: '0601020328', planning_type: 'variable', initiales: 'MS' },
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

// ============================================================
// Page
// ============================================================

export default function EquipePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [search, setSearch] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<Set<Role>>(() => new Set(ALL_ROLES))
  const [sortBy, setSortBy] = useState<'role' | 'name'>('role')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Congé modal
  const [congeModal, setCongeModal] = useState<{ open: boolean; employee: Employee | null }>({ open: false, employee: null })
  const [congeData, setCongeData] = useState({ dateDebut: '', dateFin: '', motif: '' })

  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleCongeSubmit = () => {
    if (!congeModal.employee || !congeData.dateDebut || !congeData.dateFin) return
    showToast(`Congé enregistré pour ${congeModal.employee.prenom}`)
    setCongeModal({ open: false, employee: null })
    setCongeData({ dateDebut: '', dateFin: '', motif: '' })
  }

  // Form state
  const [form, setForm] = useState<Employee>({
    id: '', prenom: '', nom: '', email: '', tel: '',
    role: 'Pharmacien', planning_type: 'fixe', initiales: '',
  })

  // Load / persist
  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (raw) {
      try { setEmployees(JSON.parse(raw) as Employee[]); return } catch { /* ignore */ }
    }
    setEmployees(SEED_EMPLOYEES)
  }, [])

  useEffect(() => {
    if (!employees.length) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees))
  }, [employees])

  // Close menu on outside click
  useEffect(() => {
    if (!openMenuId) return
    const handler = () => setOpenMenuId(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openMenuId])

  // Filtered + sorted
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    let list = employees.filter(e => selectedRoles.has(e.role))
    if (q) {
      list = list.filter(e =>
        `${e.prenom} ${e.nom}`.toLowerCase().includes(q) ||
        (e.initiales || '').toLowerCase().includes(q)
      )
    }
    const roleOrder: Record<Role, number> = { Pharmacien: 0, Preparateur: 1, Apprenti: 2, Etudiant: 3, Conditionneur: 4 }
    if (sortBy === 'role') {
      list.sort((a, b) => roleOrder[a.role] - roleOrder[b.role] || a.prenom.localeCompare(b.prenom, 'fr'))
    } else {
      list.sort((a, b) => a.prenom.localeCompare(b.prenom, 'fr'))
    }
    return list
  }, [employees, search, selectedRoles, sortBy])

  // Counts per role
  const roleCounts = useMemo(() => {
    const c: Record<Role, number> = { Pharmacien: 0, Preparateur: 0, Apprenti: 0, Etudiant: 0, Conditionneur: 0 }
    employees.forEach(e => c[e.role]++)
    return c
  }, [employees])

  // CRUD
  const openAdd = () => {
    setEditing(null)
    setForm({ id: '', prenom: '', nom: '', email: '', tel: '', role: 'Pharmacien', planning_type: 'fixe', initiales: '' })
    setModalOpen(true)
  }
  const openEdit = (emp: Employee) => { setEditing(emp); setForm({ ...emp }); setModalOpen(true); setOpenMenuId(null) }
  const closeModal = () => { setModalOpen(false); setEditing(null) }
  const openConge = (emp: Employee) => {
    const today = new Date().toISOString().split('T')[0]
    setCongeModal({ open: true, employee: emp })
    setCongeData({ dateDebut: today, dateFin: today, motif: '' })
    setOpenMenuId(null)
  }

  const saveEmployee = () => {
    if (!form.prenom.trim()) return alert('Prénom requis')
    if (!form.role) return alert('Fonction requise')
    const fixed: Employee = {
      ...form,
      prenom: form.prenom.trim(),
      nom: (form.nom ?? '').trim(),
      initiales: (form.initiales?.trim() || initialsFrom(form.prenom, form.nom)).toUpperCase(),
    }
    if (editing) {
      setEmployees(prev => prev.map(e => e.id === editing.id ? { ...fixed, id: editing.id } : e))
    } else {
      setEmployees(prev => [{ ...fixed, id: makeId() }, ...prev])
    }
    closeModal()
  }

  const deleteEmployee = (emp: Employee) => {
    setOpenMenuId(null)
    const ok = confirm(`Supprimer ${emp.prenom} ${emp.nom || ''} ?`)
    if (!ok) return
    setEmployees(prev => prev.filter(e => e.id !== emp.id))
  }

  const toggleRole = (r: Role) => {
    setSelectedRoles(prev => {
      const next = new Set(prev)
      if (next.has(r)) next.delete(r); else next.add(r)
      return next
    })
  }

  return (
    <div className="eq-page">

      {/* ===================== HEADER ===================== */}
      <header className="eq-header">
        <div className="eq-header-top">
          <div>
            <h1 className="eq-title">Équipe</h1>
            <p className="eq-subtitle">{employees.length} membres &middot; Gérez les profils et fonctions</p>
          </div>
          <button className="eq-btn-add" onClick={openAdd}>
            + Ajouter un employé
          </button>
        </div>

        {/* Search */}
        <div className="eq-search-bar">
          <span className="eq-search-icon">&#x1F50D;</span>
          <input
            className="eq-search-input"
            placeholder="Rechercher un employé..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="eq-search-clear" onClick={() => setSearch('')}>&#x2715;</button>
          )}
        </div>

        {/* Filters */}
        <div className="eq-filters">
          <div className="eq-pills">
            {ALL_ROLES.map(r => {
              const active = selectedRoles.has(r)
              const color = ROLE_COLORS[r]
              return (
                <button
                  key={r}
                  className={`eq-pill ${active ? 'active' : ''}`}
                  style={{
                    background: active ? color : 'transparent',
                    color: active ? '#fff' : T.textSec,
                    borderColor: active ? color : '#d1d5db',
                  }}
                  onClick={() => toggleRole(r)}
                >
                  {ROLE_ICONS[r]} {ROLE_LABELS_PLURAL[r]}
                  <span className="eq-pill-count" style={{
                    background: active ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                    color: active ? '#fff' : T.muted,
                  }}>
                    {roleCounts[r]}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="eq-sort">
            <label className="eq-sort-label">Tri :</label>
            <select
              className="eq-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'role' | 'name')}
            >
              <option value="role">Par fonction</option>
              <option value="name">Par nom</option>
            </select>
          </div>
        </div>
      </header>

      {/* ===================== COUNTER CHIPS ===================== */}
      <div className="eq-stats-row">
        {ALL_ROLES.map(r => (
          <div key={r} className="eq-stat-chip">
            <span className="eq-stat-dot" style={{ background: ROLE_COLORS[r] }} />
            <span className="eq-stat-count">{roleCounts[r]}</span>
            <span className="eq-stat-name">{ROLE_LABELS_PLURAL[r]}</span>
          </div>
        ))}
      </div>

      {/* ===================== TABLE (desktop) / CARDS (mobile) ===================== */}
      <div className="eq-card">
        <div className="eq-card-header">
          <span className="eq-card-title">
            {filtered.length} employé{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="eq-empty">Aucun résultat pour cette recherche / filtre.</div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="eq-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Employé</th>
                  <th style={{ textAlign: 'left' }}>Fonction</th>
                  <th style={{ textAlign: 'left' }}>Contact</th>
                  <th style={{ textAlign: 'left' }}>Planning</th>
                  <th style={{ textAlign: 'right', width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, idx) => {
                  const color = ROLE_COLORS[emp.role]
                  const initials = (emp.initiales || initialsFrom(emp.prenom, emp.nom)).toUpperCase()
                  return (
                    <tr key={emp.id} className={idx < filtered.length - 1 ? 'eq-row-border' : ''}>
                      <td>
                        <div className="eq-emp-cell">
                          <div className="eq-avatar" style={{ background: color }}>{initials}</div>
                          <div>
                            <div className="eq-emp-name">{emp.prenom} {emp.nom}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="eq-role-badge" style={{ background: `${color}14`, color }}>
                          {ROLE_ICONS[emp.role]} {ROLE_LABELS[emp.role]}
                        </span>
                      </td>
                      <td>
                        <div className="eq-contact">
                          {emp.email && <span className="eq-contact-line">{emp.email}</span>}
                          {emp.tel && <span className="eq-contact-line">{emp.tel}</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`eq-planning-badge ${emp.planning_type === 'variable' ? 'variable' : 'fixe'}`}>
                          {emp.planning_type === 'variable' ? 'Variable' : 'Fixe'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', position: 'relative' }}>
                        <button
                          className="eq-menu-btn"
                          onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === emp.id ? null : emp.id) }}
                        >
                          &#x22EE;
                        </button>
                        {openMenuId === emp.id && (
                          <div className="eq-dropdown" onClick={e => e.stopPropagation()}>
                            <button className="eq-dropdown-item" onClick={() => openEdit(emp)}>Modifier</button>
                            <button className="eq-dropdown-item" onClick={() => openConge(emp)}>Déclarer congé</button>
                            <button className="eq-dropdown-item danger" onClick={() => deleteEmployee(emp)}>Supprimer</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="eq-mobile-list">
              {filtered.map(emp => {
                const color = ROLE_COLORS[emp.role]
                const initials = (emp.initiales || initialsFrom(emp.prenom, emp.nom)).toUpperCase()
                return (
                  <div key={emp.id} className="eq-mobile-card">
                    <div className="eq-mobile-top">
                      <div className="eq-avatar" style={{ background: color }}>{initials}</div>
                      <div className="eq-mobile-info">
                        <div className="eq-emp-name">{emp.prenom} {emp.nom}</div>
                        <span className="eq-role-badge small" style={{ background: `${color}14`, color }}>
                          {ROLE_ICONS[emp.role]} {ROLE_LABELS[emp.role]}
                        </span>
                      </div>
                      <button
                        className="eq-menu-btn"
                        onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === emp.id ? null : emp.id) }}
                      >
                        &#x22EE;
                      </button>
                      {openMenuId === emp.id && (
                        <div className="eq-dropdown mobile" onClick={e => e.stopPropagation()}>
                          <button className="eq-dropdown-item" onClick={() => openEdit(emp)}>Modifier</button>
                          <button className="eq-dropdown-item" onClick={() => openConge(emp)}>Déclarer congé</button>
                          <button className="eq-dropdown-item danger" onClick={() => deleteEmployee(emp)}>Supprimer</button>
                        </div>
                      )}
                    </div>
                    <div className="eq-mobile-meta">
                      {emp.email && <span className="eq-contact-line">{emp.email}</span>}
                      <span className={`eq-planning-badge ${emp.planning_type === 'variable' ? 'variable' : 'fixe'}`}>
                        {emp.planning_type === 'variable' ? 'Variable' : 'Fixe'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ===================== MODAL AJOUT / MODIF ===================== */}
      {modalOpen && (
        <div className="eq-overlay" onClick={closeModal}>
          <div className="eq-modal" onClick={e => e.stopPropagation()}>
            <div className="eq-modal-header">
              <h2 className="eq-modal-title">{editing ? 'Modifier un employé' : 'Ajouter un employé'}</h2>
              <button className="eq-modal-close" onClick={closeModal}>&#x2715;</button>
            </div>
            <div className="eq-modal-body">
              <p className="eq-modal-hint">Renseignez les informations de base. Le planning sera défini ultérieurement.</p>

              <div className="eq-form-grid">
                <div className="eq-field">
                  <label className="eq-label">Prénom *</label>
                  <input className="eq-input" value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} placeholder="Ex: Marie" />
                </div>
                <div className="eq-field">
                  <label className="eq-label">Nom</label>
                  <input className="eq-input" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Ex: Dupont" />
                </div>
                <div className="eq-field full">
                  <label className="eq-label">Email</label>
                  <input className="eq-input" value={form.email ?? ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Ex: marie@pharma.fr" />
                </div>
                <div className="eq-field">
                  <label className="eq-label">Téléphone</label>
                  <input className="eq-input" value={form.tel ?? ''} onChange={e => setForm(p => ({ ...p, tel: e.target.value }))} placeholder="06 12 34 56 78" />
                </div>
                <div className="eq-field">
                  <label className="eq-label">Initiales</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="eq-input" value={form.initiales ?? ''} onChange={e => setForm(p => ({ ...p, initiales: e.target.value.toUpperCase() }))} placeholder="AB" maxLength={3} style={{ textTransform: 'uppercase' }} />
                    <button className="eq-btn-secondary" type="button" onClick={() => setForm(p => ({ ...p, initiales: initialsFrom(p.prenom, p.nom) }))}>Auto</button>
                  </div>
                </div>
              </div>

              {/* Fonction */}
              <div className="eq-field" style={{ marginTop: '20px' }}>
                <label className="eq-label">Fonction *</label>
                <div className="eq-role-grid">
                  {ALL_ROLES.map(r => {
                    const active = form.role === r
                    const color = ROLE_COLORS[r]
                    return (
                      <button
                        key={r} type="button"
                        className={`eq-role-option ${active ? 'active' : ''}`}
                        style={active ? { borderColor: color, background: `${color}10` } : {}}
                        onClick={() => setForm(p => ({ ...p, role: r }))}
                      >
                        {ROLE_ICONS[r]} {ROLE_LABELS[r]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Type planning */}
              <div className="eq-field" style={{ marginTop: '20px' }}>
                <label className="eq-label">Type de planning *</label>
                <div className="eq-planning-grid">
                  {(['variable', 'fixe'] as PlanningType[]).map(pt => (
                    <button
                      key={pt} type="button"
                      className={`eq-planning-option ${form.planning_type === pt ? 'active' : ''}`}
                      onClick={() => setForm(p => ({ ...p, planning_type: pt }))}
                    >
                      <strong>{pt === 'variable' ? 'Variable' : 'Fixe'}</strong>
                      <span className="eq-planning-desc">
                        {pt === 'variable' ? 'Pas de planning prédéfini' : 'Planning hebdo Lun → Sam'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="eq-modal-actions">
                <button className="eq-btn-secondary" onClick={closeModal}>Annuler</button>
                <button className="eq-btn-primary" onClick={saveEmployee}>{editing ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL CONGÉ ===================== */}
      {congeModal.open && congeModal.employee && (
        <div className="eq-overlay" onClick={() => setCongeModal({ open: false, employee: null })}>
          <div className="eq-modal small" onClick={e => e.stopPropagation()}>
            <div className="eq-modal-header">
              <h2 className="eq-modal-title">Congé — {congeModal.employee.prenom}</h2>
              <button className="eq-modal-close" onClick={() => setCongeModal({ open: false, employee: null })}>&#x2715;</button>
            </div>
            <div className="eq-modal-body">
              <div className="eq-field">
                <label className="eq-label">Du (début)</label>
                <input type="date" className="eq-input" value={congeData.dateDebut}
                  onChange={e => setCongeData(p => ({ ...p, dateDebut: e.target.value, dateFin: p.dateFin < e.target.value ? e.target.value : p.dateFin }))} />
              </div>
              <div className="eq-field" style={{ marginTop: '12px' }}>
                <label className="eq-label">Au (fin)</label>
                <input type="date" className="eq-input" min={congeData.dateDebut} value={congeData.dateFin}
                  onChange={e => setCongeData(p => ({ ...p, dateFin: e.target.value }))} />
              </div>
              <div className="eq-field" style={{ marginTop: '12px' }}>
                <label className="eq-label">Motif (optionnel)</label>
                <input className="eq-input" value={congeData.motif} onChange={e => setCongeData(p => ({ ...p, motif: e.target.value }))} placeholder="Vacances, RDV..." />
              </div>
              <div className="eq-conge-summary">
                {congeData.dateDebut && congeData.dateFin
                  ? congeData.dateDebut === congeData.dateFin
                    ? '1 jour'
                    : `${Math.ceil((new Date(congeData.dateFin).getTime() - new Date(congeData.dateDebut).getTime()) / 86400000) + 1} jours`
                  : 'Sélectionnez les dates'}
              </div>
              <div className="eq-modal-actions">
                <button className="eq-btn-secondary" onClick={() => setCongeModal({ open: false, employee: null })}>Annuler</button>
                <button className="eq-btn-danger" onClick={handleCongeSubmit} disabled={!congeData.dateDebut || !congeData.dateFin}>Valider le congé</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="eq-toast">{toast}</div>}

      {/* ===================== STYLES ===================== */}
      <style jsx global>{`
        /* ---- Page ---- */
        .eq-page {
          padding: 24px;
          max-width: 1100px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* ---- Header ---- */
        .eq-header {
          margin-bottom: 20px;
        }
        .eq-header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }
        .eq-title {
          font-size: 26px;
          font-weight: 700;
          color: ${T.text};
          margin: 0 0 2px 0;
        }
        .eq-subtitle {
          font-size: 14px;
          color: ${T.muted};
          margin: 0;
        }
        .eq-btn-add {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: ${T.text};
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .eq-btn-add:hover { background: #1f2937; /* hover dark */ }

        /* ---- Search ---- */
        .eq-search-bar {
          position: relative;
          margin-bottom: 16px;
        }
        .eq-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          pointer-events: none;
        }
        .eq-search-input {
          width: 100%;
          padding: 11px 40px 11px 40px;
          border: 1px solid ${T.border};
          border-radius: 10px;
          font-size: 14px;
          color: ${T.text};
          background: ${T.bg};
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .eq-search-input:focus { border-color: ${T.muted}; background: ${T.card}; }
        .eq-search-input::placeholder { color: ${T.muted}; }
        .eq-search-clear {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: ${T.muted};
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
        }

        /* ---- Filters row ---- */
        .eq-filters {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .eq-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .eq-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1.5px solid;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          background: transparent;
        }
        .eq-pill:hover { opacity: 0.85; }
        .eq-pill-count {
          font-size: 11px;
          padding: 1px 6px;
          border-radius: 10px;
          font-weight: 700;
        }

        /* ---- Sort ---- */
        .eq-sort {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .eq-sort-label {
          font-size: 12px;
          color: ${T.muted};
          font-weight: 500;
        }
        .eq-sort-select {
          padding: 6px 10px;
          border: 1px solid ${T.border};
          border-radius: 6px;
          font-size: 12px;
          color: ${T.textSec};
          background: ${T.card};
          outline: none;
          cursor: pointer;
        }

        /* ---- Stats row ---- */
        .eq-stats-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
        }
        .eq-stat-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 10px;
        }
        .eq-stat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .eq-stat-count {
          font-size: 16px;
          font-weight: 700;
          color: ${T.text};
        }
        .eq-stat-name {
          font-size: 12px;
          color: ${T.muted};
        }

        /* ---- Card container ---- */
        .eq-card {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          overflow: hidden;
        }
        .eq-card-header {
          padding: 14px 20px;
          border-bottom: 1px solid ${T.border};
        }
        .eq-card-title {
          font-size: 13px;
          font-weight: 500;
          color: ${T.muted};
        }
        .eq-empty {
          padding: 48px 20px;
          text-align: center;
          color: ${T.muted};
          font-size: 14px;
        }

        /* ---- Desktop table ---- */
        .eq-table {
          width: 100%;
          border-collapse: collapse;
        }
        .eq-table th {
          padding: 12px 20px;
          font-size: 11px;
          font-weight: 600;
          color: ${T.muted};
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid ${T.border};
        }
        .eq-table td {
          padding: 14px 20px;
          vertical-align: middle;
        }
        .eq-row-border td { border-bottom: 1px solid ${T.borderLt}; }
        .eq-table tr:hover td { background: #fafbfc; }

        .eq-emp-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .eq-avatar {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          flex-shrink: 0;
        }
        .eq-emp-name {
          font-size: 14px;
          font-weight: 600;
          color: ${T.text};
        }
        .eq-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        .eq-role-badge.small {
          font-size: 11px;
          padding: 3px 8px;
          margin-top: 2px;
        }
        .eq-contact {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .eq-contact-line {
          font-size: 12px;
          color: ${T.muted};
        }
        .eq-planning-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
        }
        .eq-planning-badge.fixe {
          background: ${T.infoLt};
          color: ${T.infoDk};
        }
        .eq-planning-badge.variable {
          background: #f0fdf4;
          color: #166534;
        }

        /* ---- Action menu ---- */
        .eq-menu-btn {
          background: none;
          border: 1px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          font-size: 18px;
          color: ${T.muted};
          padding: 4px 8px;
          line-height: 1;
          transition: all 0.1s;
        }
        .eq-menu-btn:hover {
          background: ${T.borderLt};
          border-color: ${T.border};
        }
        .eq-dropdown {
          position: absolute;
          right: 20px;
          top: 100%;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 10px;
          box-shadow: ${T.shadowLg};
          z-index: 40;
          min-width: 160px;
          padding: 4px;
          margin-top: 4px;
        }
        .eq-dropdown.mobile {
          right: 0;
          top: 32px;
        }
        .eq-dropdown-item {
          display: block;
          width: 100%;
          padding: 9px 14px;
          border: none;
          background: none;
          font-size: 13px;
          color: ${T.textSec};
          cursor: pointer;
          text-align: left;
          border-radius: 6px;
          transition: background 0.1s;
        }
        .eq-dropdown-item:hover { background: ${T.bg}; }
        .eq-dropdown-item.danger { color: ${T.dangerDk}; }
        .eq-dropdown-item.danger:hover { background: ${T.dangerBg}; }

        /* ---- Mobile cards ---- */
        .eq-mobile-list { display: none; }
        .eq-mobile-card {
          padding: 14px 16px;
          border-bottom: 1px solid ${T.borderLt};
        }
        .eq-mobile-card:last-child { border-bottom: none; }
        .eq-mobile-top {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }
        .eq-mobile-info {
          flex: 1;
          min-width: 0;
        }
        .eq-mobile-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
          padding-left: 50px;
          flex-wrap: wrap;
        }

        /* ---- Modal ---- */
        .eq-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${T.overlayLt};
          padding: 16px;
        }
        .eq-modal {
          width: 100%;
          max-width: 560px;
          background: ${T.card};
          border-radius: 16px;
          box-shadow: ${T.shadowXl};
          max-height: 90vh;
          overflow-y: auto;
        }
        .eq-modal.small { max-width: 400px; }
        .eq-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid ${T.border};
        }
        .eq-modal-title {
          font-size: 17px;
          font-weight: 700;
          color: ${T.text};
          margin: 0;
        }
        .eq-modal-close {
          background: none;
          border: none;
          color: ${T.muted};
          cursor: pointer;
          font-size: 16px;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .eq-modal-close:hover { background: ${T.borderLt}; }
        .eq-modal-body { padding: 20px 24px 24px; }
        .eq-modal-hint {
          font-size: 13px;
          color: ${T.muted};
          margin: 0 0 20px 0;
        }

        /* ---- Form ---- */
        .eq-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .eq-field { }
        .eq-field.full { grid-column: 1 / -1; }
        .eq-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: ${T.textSec};
          margin-bottom: 6px;
        }
        .eq-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid ${T.border};
          border-radius: 8px;
          font-size: 14px;
          color: ${T.text};
          background: ${T.bg};
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .eq-input:focus { border-color: ${T.muted}; background: ${T.card}; }
        .eq-input::placeholder { color: ${T.muted}; }

        .eq-role-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 8px;
        }
        .eq-role-option {
          padding: 10px;
          border: 1.5px solid ${T.border};
          border-radius: 10px;
          background: ${T.card};
          font-size: 13px;
          font-weight: 600;
          color: ${T.textSec};
          cursor: pointer;
          text-align: center;
          transition: all 0.15s;
        }
        .eq-role-option:hover { border-color: ${T.borderMd}; }
        .eq-role-option.active { font-weight: 700; color: ${T.text}; }

        .eq-planning-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 8px;
        }
        .eq-planning-option {
          padding: 14px;
          border: 1.5px solid ${T.border};
          border-radius: 10px;
          background: ${T.card};
          text-align: left;
          cursor: pointer;
          transition: all 0.15s;
        }
        .eq-planning-option:hover { border-color: ${T.borderMd}; }
        .eq-planning-option.active { border-color: #10b981; background: #f0fdf4; }
        .eq-planning-option strong {
          display: block;
          font-size: 14px;
          color: ${T.text};
        }
        .eq-planning-desc {
          display: block;
          font-size: 12px;
          color: ${T.muted};
          margin-top: 4px;
        }

        .eq-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 24px;
        }
        .eq-btn-secondary {
          padding: 10px 18px;
          border: 1px solid ${T.border};
          border-radius: 8px;
          background: ${T.card};
          font-size: 13px;
          font-weight: 600;
          color: ${T.textSec};
          cursor: pointer;
          transition: background 0.1s;
        }
        .eq-btn-secondary:hover { background: ${T.bg}; }
        .eq-btn-primary {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          background: ${T.text};
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: background 0.15s;
        }
        .eq-btn-primary:hover { background: #1f2937; /* hover dark */ }
        .eq-btn-danger {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          background: ${T.dangerDk};
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
        }
        .eq-btn-danger:hover { background: #b91c1c; /* danger hover */ }
        .eq-btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Congé summary */
        .eq-conge-summary {
          margin-top: 14px;
          padding: 10px;
          background: ${T.dangerBg};
          border-radius: 8px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          color: ${T.dangerDk};
        }

        /* ---- Toast ---- */
        .eq-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 60;
          padding: 12px 20px;
          background: ${T.primary};
          color: #fff;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: ${T.shadowLg};
          animation: eq-toast-in 0.25s ease-out;
        }
        @keyframes eq-toast-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ---- Responsive ---- */
        @media (max-width: 768px) {
          .eq-page { padding: 16px; }
          .eq-title { font-size: 22px; }
          .eq-table { display: none; }
          .eq-mobile-list { display: block; }
          .eq-form-grid { grid-template-columns: 1fr; }
          .eq-field.full { grid-column: 1; }
          .eq-role-grid { grid-template-columns: repeat(2, 1fr); }
          .eq-stats-row { display: none; }
          .eq-sort { display: none; }
          .eq-header-top { flex-direction: column; }
          .eq-btn-add { width: 100%; justify-content: center; }
        }

        @media (min-width: 769px) {
          .eq-mobile-list { display: none; }
        }
      `}</style>
    </div>
  )
}
