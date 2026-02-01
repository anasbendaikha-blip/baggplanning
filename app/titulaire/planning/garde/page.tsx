'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  MOCK_EMPLOYEES,
  MOCK_GARDES,
  MockGarde,
  MockEmployee,
  getRoleColor,
  EmployeeRole,
} from '@/lib/mock-data'
import { getWeekStart, formatWeekRange, addWeeks } from '@/lib/date-utils'

// ============================================================
// 📁 app/titulaire/gardes/page.tsx
// ============================================================
// Page de gestion des gardes (nuit, soir, dimanche)
// Modal custom pour ajout - State local (V1 démo)
// ============================================================

const TXT = { primary: '#111827', secondary: '#374151', muted: '#6b7280' }
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

// Types locaux pour la garde étendue (avec équipe)
interface LocalGarde extends MockGarde {
  start_time?: string
  end_time?: string
  team?: string[] // IDs des accompagnants
}

// Utilitaires date (format français)
const formatDateFr = (dateStr: string): { day: string; date: string } => {
  const d = new Date(`${dateStr}T00:00:00`)
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
  return {
    day: days[d.getDay()],
    date: `${d.getDate()} ${months[d.getMonth()]}`,
  }
}

const addDaysToDate = (dateStr: string, days: number): string => {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const getDateFromWeekDay = (weekStart: Date, dayIndex: number): string => {
  const d = new Date(weekStart)
  d.setDate(weekStart.getDate() + dayIndex)
  return d.toISOString().split('T')[0]
}

// Initialiser les gardes avec données mock
const initGardes = (): LocalGarde[] => {
  return MOCK_GARDES.map(g => ({
    ...g,
    start_time: g.type === 'nuit' ? '20:30' : g.type === 'soir' ? '19:00' : '09:00',
    end_time: g.type === 'nuit' ? '08:30' : g.type === 'soir' ? '23:00' : '20:00',
    team: g.accompagnant_name ? [g.accompagnant_name] : [],
  }))
}

export default function GardesPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date(2026, 0, 26)))
  const [gardes, setGardes] = useState<LocalGarde[]>(() => initGardes())
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Formulaire
  const [formData, setFormData] = useState({
    day: '',
    type: 'nuit' as 'soir' | 'nuit' | 'dimanche',
    startTime: '20:30',
    endTime: '08:30',
    pharmacistId: '',
    team: [] as string[],
  })

  const weekLabel = formatWeekRange(weekStart)

  // Pharmaciens uniquement
  const pharmacists = MOCK_EMPLOYEES.filter(e => e.fonction === 'Pharmacien' && e.actif)
  
  // Tous les autres (pour l'équipe)
  const otherEmployees = MOCK_EMPLOYEES.filter(e => e.fonction !== 'Pharmacien' && e.actif)

  // Gardes de la semaine courante
  const weekEnd = addDaysToDate(weekStart.toISOString().split('T')[0], 6)
  const weekGardes = gardes.filter(g => {
    return g.date >= weekStart.toISOString().split('T')[0] && g.date <= weekEnd
  })

  // Fermer modal avec Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalOpen(false)
        setDeleteConfirm(null)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  // Reset form
  const resetForm = () => {
    setFormData({
      day: '',
      type: 'nuit',
      startTime: '20:30',
      endTime: '08:30',
      pharmacistId: '',
      team: [],
    })
  }

  // Ouvrir modal
  const openModal = () => {
    resetForm()
    setModalOpen(true)
  }

  // Fermer modal
  const closeModal = () => {
    setModalOpen(false)
    resetForm()
  }

  // Ajouter une garde
  const handleAddGarde = () => {
    if (!formData.day || !formData.pharmacistId) return

    const dayIndex = DAYS.indexOf(formData.day)
    const date = getDateFromWeekDay(weekStart, dayIndex)
    const pharmacist = pharmacists.find(p => p.id === formData.pharmacistId)

    const newGarde: LocalGarde = {
      id: `garde-${Date.now()}`,
      type: formData.type,
      date,
      pharmacien_name: pharmacist?.prenom || '',
      accompagnant_name: formData.team.length > 0 
        ? formData.team.map(id => MOCK_EMPLOYEES.find(e => e.id === id)?.prenom || '').join(', ')
        : undefined,
      status: 'assignee',
      start_time: formData.startTime,
      end_time: formData.endTime,
      team: formData.team,
    }

    setGardes(prev => [...prev, newGarde])
    closeModal()
  }

  // Supprimer une garde
  const handleDeleteGarde = (id: string) => {
    setGardes(prev => prev.filter(g => g.id !== id))
    setDeleteConfirm(null)
  }

  // Ajouter un membre à l'équipe
  const addTeamMember = () => {
    setFormData(prev => ({ ...prev, team: [...prev.team, ''] }))
  }

  // Mettre à jour un membre
  const updateTeamMember = (index: number, value: string) => {
    const newTeam = [...formData.team]
    newTeam[index] = value
    setFormData(prev => ({ ...prev, team: newTeam }))
  }

  // Supprimer un membre
  const removeTeamMember = (index: number) => {
    setFormData(prev => ({ ...prev, team: prev.team.filter((_, i) => i !== index) }))
  }

  // Obtenir les infos du pharmacien
  const getPharmacistInfo = (garde: LocalGarde) => {
    const pharmacist = pharmacists.find(p => 
      p.prenom.toLowerCase() === garde.pharmacien_name.toLowerCase()
    )
    return pharmacist
  }

  // Type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'soir': return '🌆 Soir'
      case 'nuit': return '🌙 Nuit'
      case 'dimanche': return '☀️ Dimanche'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'soir': return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' }
      case 'nuit': return { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' }
      case 'dimanche': return { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' }
      default: return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' }
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'validee': return { label: '✓ Validée', bg: '#dcfce7', color: '#166534' }
      case 'assignee': return { label: '📋 Assignée', bg: '#dbeafe', color: '#1d4ed8' }
      case 'a_assigner': return { label: '⚠️ À assigner', bg: '#fef3c7', color: '#92400e' }
      default: return { label: status, bg: '#f3f4f6', color: '#374151' }
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* HEADER */}
      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: TXT.primary, margin: '0 0 8px 0' }}>
              🌙 Gardes
            </h1>
            <p style={{ fontSize: '16px', color: TXT.secondary, margin: 0 }}>
              Semaine du {weekLabel}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              href="/titulaire/planning"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: TXT.primary,
                textDecoration: 'none',
              }}
            >
              ← Retour planning
            </Link>
            <Link
              href="/titulaire/recap"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: TXT.primary,
                textDecoration: 'none',
              }}
            >
              📊 Récap semaine
            </Link>
          </div>
        </div>

        {/* Navigation semaine */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, -1))}
            style={{
              width: '36px',
              height: '36px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              color: TXT.primary,
              fontSize: '16px',
            }}
          >
            ←
          </button>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            style={{
              width: '36px',
              height: '36px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              color: TXT.primary,
              fontSize: '16px',
            }}
          >
            →
          </button>
          <button
            onClick={() => setWeekStart(getWeekStart(new Date(2026, 0, 26)))}
            style={{
              padding: '8px 12px',
              background: '#dbeafe',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: '#2563eb',
            }}
          >
            Semaine actuelle
          </button>
        </div>
      </header>

      {/* PANEL GARDES */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {/* Panel header */}
        <header style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: TXT.primary, margin: 0 }}>
              📅 Planning des gardes
            </h3>
            <span style={{
              padding: '4px 12px',
              background: '#ede9fe',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#7c3aed',
            }}>
              {weekGardes.length} garde{weekGardes.length > 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={openModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: '#7c3aed',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            + Ajouter une garde
          </button>
        </header>

        {/* Table */}
        <div style={{ padding: '20px 24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: TXT.secondary }}>Jour</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: TXT.secondary }}>Type</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: TXT.secondary }}>Horaire</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: TXT.secondary }}>Pharmacien</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: TXT.secondary }}>Équipe</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: TXT.secondary }}>Statut</th>
                <th style={{ width: '80px', padding: '12px 16px' }}></th>
              </tr>
            </thead>
            <tbody>
              {weekGardes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: TXT.muted }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌙</div>
                    <div style={{ fontSize: '15px', marginBottom: '8px' }}>Aucune garde planifiée pour cette semaine</div>
                    <div style={{ fontSize: '13px' }}>Cliquez sur "+ Ajouter une garde" pour commencer</div>
                  </td>
                </tr>
              ) : (
                weekGardes
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(garde => {
                    const { day, date } = formatDateFr(garde.date)
                    const pharmacist = getPharmacistInfo(garde)
                    const typeStyle = getTypeColor(garde.type)
                    const statusStyle = getStatusLabel(garde.status)

                    return (
                      <tr
                        key={garde.id}
                        style={{ borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        {/* Jour */}
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: '600', color: TXT.primary, fontSize: '14px' }}>{day}</div>
                          <div style={{ fontSize: '13px', color: TXT.muted }}>{date}</div>
                        </td>

                        {/* Type */}
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            background: typeStyle.bg,
                            color: typeStyle.color,
                            border: `1px solid ${typeStyle.border}`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}>
                            {getTypeLabel(garde.type)}
                          </span>
                        </td>

                        {/* Horaire */}
                        <td style={{ padding: '16px', color: TXT.primary, fontSize: '14px' }}>
                          {garde.start_time || '20:30'} → {garde.end_time || '08:30'}
                        </td>

                        {/* Pharmacien */}
                        <td style={{ padding: '16px' }}>
                          {garde.pharmacien_name ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: pharmacist ? getRoleColor(pharmacist.fonction) : '#7c3aed',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '700',
                                fontSize: '11px',
                              }}>
                                {pharmacist?.initiales || garde.pharmacien_name.slice(0, 2).toUpperCase()}
                              </div>
                              <span style={{ fontWeight: '500', color: TXT.primary, fontSize: '14px' }}>
                                {garde.pharmacien_name}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: TXT.muted, fontStyle: 'italic' }}>Non assigné</span>
                          )}
                        </td>

                        {/* Équipe */}
                        <td style={{ padding: '16px', color: TXT.secondary, fontSize: '14px' }}>
                          {garde.accompagnant_name || '—'}
                        </td>

                        {/* Statut */}
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}>
                            {statusStyle.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px' }}>
                          <button
                            onClick={() => setDeleteConfirm(garde.id)}
                            style={{
                              width: '32px',
                              height: '32px',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc',
        }}>
          <Link
            href="/titulaire/planning"
            style={{
              padding: '10px 16px',
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: TXT.primary,
              textDecoration: 'none',
            }}
          >
            ← Retour au planning
          </Link>
          <button
            style={{
              padding: '10px 16px',
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: TXT.primary,
              cursor: 'pointer',
            }}
          >
            📄 Exporter PDF
          </button>
        </div>
      </div>

      {/* ========== MODAL AJOUT ========== */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: TXT.primary, margin: 0 }}>
                  🌙 Ajouter une garde
                </h2>
                <p style={{ fontSize: '14px', color: TXT.muted, margin: '4px 0 0 0' }}>
                  Définissez les informations de la garde
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '24px' }}>
              {/* Grid 2 colonnes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                {/* Jour */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TXT.secondary, marginBottom: '6px' }}>
                    Jour <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    value={formData.day}
                    onChange={e => setFormData(prev => ({ ...prev, day: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: TXT.primary,
                      background: 'white',
                    }}
                  >
                    <option value="">Sélectionner...</option>
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TXT.secondary, marginBottom: '6px' }}>
                    Type <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => {
                      const type = e.target.value as 'soir' | 'nuit' | 'dimanche'
                      let startTime = '20:30', endTime = '08:30'
                      if (type === 'soir') { startTime = '19:00'; endTime = '23:00' }
                      if (type === 'dimanche') { startTime = '09:00'; endTime = '20:00' }
                      setFormData(prev => ({ ...prev, type, startTime, endTime }))
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: TXT.primary,
                      background: 'white',
                    }}
                  >
                    <option value="nuit">🌙 Nuit</option>
                    <option value="soir">🌆 Soir</option>
                    <option value="dimanche">☀️ Dimanche</option>
                  </select>
                </div>

                {/* Heure début */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TXT.secondary, marginBottom: '6px' }}>
                    Heure début <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: TXT.primary,
                    }}
                  />
                </div>

                {/* Heure fin */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TXT.secondary, marginBottom: '6px' }}>
                    Heure fin <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: TXT.primary,
                    }}
                  />
                </div>
              </div>

              {/* Pharmacien */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TXT.secondary, marginBottom: '6px' }}>
                  Pharmacien de garde <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={formData.pharmacistId}
                  onChange={e => setFormData(prev => ({ ...prev, pharmacistId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: TXT.primary,
                    background: 'white',
                  }}
                >
                  <option value="">Sélectionner un pharmacien...</option>
                  {pharmacists.map(p => (
                    <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                  ))}
                </select>
              </div>

              {/* Équipe optionnelle */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: TXT.secondary }}>
                      Équipe (optionnel)
                    </label>
                    <p style={{ fontSize: '12px', color: TXT.muted, margin: '2px 0 0 0' }}>
                      Préparateurs, étudiants...
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addTeamMember}
                    style={{
                      padding: '6px 12px',
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: TXT.primary,
                      cursor: 'pointer',
                    }}
                  >
                    + Ajouter
                  </button>
                </div>

                {formData.team.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {formData.team.map((memberId, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px' }}>
                        <select
                          value={memberId}
                          onChange={e => updateTeamMember(index, e.target.value)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: TXT.primary,
                            background: 'white',
                          }}
                        >
                          <option value="">Sélectionner...</option>
                          {otherEmployees.map(e => (
                            <option key={e.id} value={e.id}>
                              {e.prenom} {e.nom} ({e.fonction})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeTeamMember(index)}
                          style={{
                            width: '36px',
                            height: '36px',
                            background: '#fee2e2',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{
                padding: '12px 16px',
                background: '#ede9fe',
                borderRadius: '8px',
                border: '1px solid #c4b5fd',
              }}>
                <p style={{ fontSize: '13px', color: '#5b21b6', margin: 0 }}>
                  💡 Les horaires sont pré-remplis selon le type de garde sélectionné.
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              background: '#f8fafc',
            }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: TXT.primary,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleAddGarde}
                disabled={!formData.day || !formData.pharmacistId}
                style={{
                  padding: '10px 20px',
                  background: !formData.day || !formData.pharmacistId ? '#d1d5db' : '#7c3aed',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: !formData.day || !formData.pharmacistId ? 'not-allowed' : 'pointer',
                }}
              >
                Enregistrer la garde
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL CONFIRMATION SUPPRESSION ========== */}
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: TXT.primary, margin: '0 0 8px 0' }}>
              🗑️ Supprimer cette garde ?
            </h3>
            <p style={{ fontSize: '14px', color: TXT.secondary, margin: '0 0 20px 0' }}>
              Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: TXT.primary,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteGarde(deleteConfirm)}
                style={{
                  padding: '10px 20px',
                  background: '#dc2626',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}