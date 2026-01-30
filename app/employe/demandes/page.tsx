'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { MOCK_DEMANDES } from '@/lib/mock-data'

interface Session {
  role: string
  employeeId: string
  employeeName: string
}

type RequestStatus = 'en_attente' | 'approuvee' | 'refusee'
type RequestType = keyof typeof TYPE_CONFIG
type CreneauKey = 'journee' | 'matin' | 'aprem'

interface Demande {
  id: string
  employee_id: string
  type: string
  date: string
  creneau: string
  motif: string
  status: RequestStatus
  demande_le?: string
  urgente?: boolean
}

const TYPE_CONFIG = {
  conge: { icon: '🏖️', label: 'Congé', color: '#8b5cf6', bg: '#f5f3ff' },
  echange: { icon: '🔄', label: 'Échange', color: '#3b82f6', bg: '#eff6ff' },
  maladie: { icon: '🏥', label: 'Maladie', color: '#ef4444', bg: '#fef2f2' },
  autre: { icon: '📝', label: 'Autre', color: '#64748b', bg: '#f1f5f9' },
} as const

const FALLBACK_TYPE = { icon: '📝', label: 'Autre', color: '#64748b', bg: '#f1f5f9' } as const

const CRENEAU_LABEL: Record<CreneauKey, string> = {
  journee: 'Journée',
  matin: 'Matin',
  aprem: 'Après-midi',
}

function todayLabel() {
  const d = new Date()
  // format simple sans lib : dd/mm/yyyy
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export default function EmployeDemandes() {
  const [isMobile, setIsMobile] = useState(false)
  const [session, setSession] = useState<Session | null>(null)

  // Toast (Code 2)
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type })
    window.setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3500)
  }

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 480px)')
    const apply = () => setIsMobile(mq.matches)
    apply()
    if (mq.addEventListener) mq.addEventListener('change', apply)
    else mq.addListener(apply)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', apply)
      else mq.removeListener(apply)
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('baggplanning_session')
    if (stored) setSession(JSON.parse(stored))
  }, [])

  // Etat local des demandes (pour voir la nouvelle demande ajoutée sans toucher aux mocks)
  const [demandesState, setDemandesState] = useState<Demande[]>(() => MOCK_DEMANDES as unknown as Demande[])

  const mesDemandes = useMemo(() => {
    if (!session) return []
    return (demandesState || []).filter((d) => d.employee_id === session.employeeId)
  }, [demandesState, session])

  const [showModal, setShowModal] = useState(false)

  // Form (fusion + correction creneau/détail)
  const [newDemande, setNewDemande] = useState<{
    type: RequestType
    dateDebut: string
    dateFin: string
    creneau: CreneauKey
    detailsCreneau: string
    motif: string
  }>({
    type: 'conge',
    dateDebut: '',
    dateFin: '',
    creneau: 'journee',
    detailsCreneau: '',
    motif: '',
  })

  const [attachedFiles, setAttachedFiles] = useState<File[]>([])

  if (!session) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // (optionnel) anti-doublon simple name+size
    const incoming = Array.from(files)
    setAttachedFiles((prev) => {
      const existingKey = new Set(prev.map((f) => `${f.name}-${f.size}`))
      const filtered = incoming.filter((f) => !existingKey.has(`${f.name}-${f.size}`))
      return [...prev, ...filtered]
    })
  }

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setNewDemande({
      type: 'conge',
      dateDebut: '',
      dateFin: '',
      creneau: 'journee',
      detailsCreneau: '',
      motif: '',
    })
    setAttachedFiles([])
  }

  const handleSubmit = () => {
    if (!newDemande.dateDebut || !newDemande.dateFin || !newDemande.motif.trim()) {
      showToast('Veuillez remplir tous les champs obligatoires (dates + motif).', 'error')
      return
    }
    if (newDemande.dateFin < newDemande.dateDebut) {
      showToast('La date de fin doit être supérieure ou égale à la date de début.', 'error')
      return
    }

    // Simulation ajout à l'état local
    const period =
      newDemande.dateDebut === newDemande.dateFin
        ? newDemande.dateDebut
        : `${newDemande.dateDebut} → ${newDemande.dateFin}`

    const creneauLabel = CRENEAU_LABEL[newDemande.creneau]
    const creneauFinal = newDemande.detailsCreneau.trim()
      ? `${creneauLabel} (${newDemande.detailsCreneau.trim()})`
      : creneauLabel

    const newItem: Demande = {
      id: `local-${Date.now()}`,
      employee_id: session.employeeId,
      type: newDemande.type,
      date: period,
      creneau: creneauFinal,
      motif: newDemande.motif.trim(),
      status: 'en_attente',
      demande_le: todayLabel(),
      urgente: false,
    }

    setDemandesState((prev) => [newItem, ...prev])
    showToast('Demande envoyée avec succès !', 'success')
    setShowModal(false)
    resetForm()
  }

  const statusBadgeStyle = (status: RequestStatus) => {
    if (status === 'approuvee') return { bg: '#dcfce7', color: '#16a34a', text: '✓ Approuvée' }
    if (status === 'refusee') return { bg: '#fee2e2', color: '#dc2626', text: '✕ Refusée' }
    return { bg: '#fef3c7', color: '#d97706', text: '⏳ En attente' }
  }

  return (
    <>
      {/* Styles toast + petits correctifs */}
      <style jsx global>{`
        .bp-toast {
          position: fixed;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%) translateY(110px);
          padding: 14px 18px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          z-index: 1200;
          opacity: 0;
          transition: all 0.25s ease;
          font-weight: 800;
          max-width: calc(100vw - 24px);
        }
        .bp-toast.active {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
        .bp-toast.success {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }
        .bp-toast.error {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          padding: isMobile ? '12px' : '24px',
          background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)',
        }}
      >
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: isMobile ? '12px' : '20px',
            }}
          >
            <div>
              <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 900, color: '#111827', margin: '0 0 2px 0' }}>
                📋 Mes demandes
              </h1>
              <p style={{ color: '#4B5563', margin: 0, fontSize: isMobile ? '12px' : '13px' }}>
                Congés, échanges et absences
              </p>
            </div>

            {!isMobile && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '12px 18px',
                  background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(72, 187, 120, 0.35)',
                }}
              >
                ➕ Nouvelle
              </button>
            )}
          </div>

          {/* CTA sticky mobile */}
          {isMobile && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                position: 'fixed',
                left: '12px',
                right: '12px',
                bottom: '12px',
                padding: '16px',
                background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontWeight: 900,
                cursor: 'pointer',
                fontSize: '16px',
                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.35)',
                zIndex: 50,
              }}
            >
              ➕ Nouvelle demande
            </button>
          )}

          {/* Liste / Historique */}
          {mesDemandes.length === 0 ? (
            <div
              style={{
                padding: isMobile ? '24px' : '48px',
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '48px' }}>📭</span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: '16px 0 8px 0' }}>
                Aucune demande
              </h2>
              <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>
                Vous n&apos;avez pas encore fait de demande de congé ou d&apos;échange.
              </p>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontSize: '16px',
                  boxShadow: '0 4px 15px rgba(72, 187, 120, 0.35)',
                }}
              >
                ➕ Faire une demande
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ margin: '18px 0 10px', fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                📜 Historique des demandes
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {mesDemandes.map((demande) => {
                  const typeKey = demande.type as keyof typeof TYPE_CONFIG
                  const config = TYPE_CONFIG[typeKey] ?? FALLBACK_TYPE
                  const badge = statusBadgeStyle(demande.status)

                  return (
                    <div
                      key={demande.id}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: demande.urgente ? '2px solid #ef4444' : '1px solid #e2e8f0',
                        overflow: 'hidden',
                      }}
                    >
                      {demande.urgente && (
                        <div
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#fef2f2',
                            borderBottom: '1px solid #fecaca',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span>🚨</span>
                          <span style={{ fontSize: '12px', fontWeight: 900, color: '#dc2626' }}>URGENT</span>
                        </div>
                      )}

                      <div style={{ padding: isMobile ? '14px' : '18px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div
                          style={{
                            width: isMobile ? '42px' : '48px',
                            height: isMobile ? '42px' : '48px',
                            borderRadius: '12px',
                            backgroundColor: config.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            flexShrink: 0,
                          }}
                        >
                          {config.icon}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <span
                              style={{
                                padding: '4px 12px',
                                backgroundColor: config.bg,
                                color: config.color,
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: 900,
                              }}
                            >
                              {config.label}
                            </span>

                            <span
                              style={{
                                padding: '4px 12px',
                                backgroundColor: badge.bg,
                                color: badge.color,
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: 900,
                              }}
                            >
                              {badge.text}
                            </span>
                          </div>

                          <p style={{ fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', fontSize: '14px' }}>
                            {demande.date} — {demande.creneau}
                          </p>
                          <p style={{ color: '#475569', margin: 0, fontSize: '14px', lineHeight: 1.45 }}>
                            {demande.motif}
                          </p>
                        </div>

                        {!isMobile && (
                          <div style={{ textAlign: 'right', fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            Demandé le<br />
                            {demande.demande_le ?? '—'}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Modal nouvelle demande */}
          {showModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
              onClick={() => setShowModal(false)}
            >
              <div
                style={
                  isMobile
                    ? {
                        backgroundColor: 'white',
                        borderTopLeftRadius: '18px',
                        borderTopRightRadius: '18px',
                        padding: '16px',
                        width: '100%',
                        maxWidth: '100vw',
                        position: 'fixed',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        boxShadow: '0 -12px 40px rgba(0,0,0,0.25)',
                      }
                    : {
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        width: '460px',
                        maxWidth: '92vw',
                      }
                }
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '0 0 18px 0' }}>
                  ➕ Nouvelle demande
                </h2>

                {/* Type */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 900, color: '#334155', marginBottom: '8px' }}>
                    Type de demande
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                      const active = newDemande.type === (key as RequestType)
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setNewDemande((p) => ({ ...p, type: key as RequestType }))}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            border: active ? `2px solid ${cfg.color}` : '2px solid #e2e8f0',
                            backgroundColor: active ? cfg.bg : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            minHeight: '64px',
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>{cfg.icon}</span>
                          <span style={{ fontSize: '12px', fontWeight: 900, color: active ? cfg.color : '#64748b' }}>
                            {cfg.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Dates */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 900, color: '#334155', marginBottom: '8px' }}>
                    Période (de quand à quand)
                  </label>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 900, marginBottom: '6px' }}>Début</div>
                      <input
                        type="date"
                        value={newDemande.dateDebut}
                        onChange={(e) => setNewDemande((p) => ({ ...p, dateDebut: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          fontSize: '14px',
                          color: '#111827',
                          caretColor: '#111827',
                          minHeight: '44px',
                          backgroundColor: '#fff',
                        }}
                      />
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 900, marginBottom: '6px' }}>Fin</div>
                      <input
                        type="date"
                        value={newDemande.dateFin}
                        onChange={(e) => setNewDemande((p) => ({ ...p, dateFin: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          fontSize: '14px',
                          color: '#111827',
                          caretColor: '#111827',
                          minHeight: '44px',
                          backgroundColor: '#fff',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Créneau */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 900, color: '#334155', marginBottom: '8px' }}>
                    Créneau concerné
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
                    {(['journee', 'matin', 'aprem'] as CreneauKey[]).map((key) => {
                      const active = newDemande.creneau === key
                      const label =
                        key === 'journee' ? '☀️ Journée' : key === 'matin' ? '🌅 Matin' : '🌆 Après-midi'
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setNewDemande((p) => ({ ...p, creneau: key }))}
                          style={{
                            padding: '14px 12px',
                            borderRadius: '12px',
                            border: active ? '2px solid #48bb78' : '2px solid #e2e8f0',
                            background: active ? '#f0fff4' : 'white',
                            cursor: 'pointer',
                            fontWeight: 900,
                            fontSize: '13px',
                            color: active ? '#276749' : '#475569',
                            minHeight: '44px',
                          }}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>

                  <input
                    type="text"
                    value={newDemande.detailsCreneau}
                    onChange={(e) => setNewDemande((p) => ({ ...p, detailsCreneau: e.target.value }))}
                    placeholder="Optionnel : détails (ex: 08:30-14:00)"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '14px',
                      minHeight: '44px',
                      color: '#111827',
                      caretColor: '#111827',
                      backgroundColor: '#fff',
                    }}
                  />
                </div>

                {/* Motif */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 900, color: '#334155', marginBottom: '8px' }}>
                    Motif
                  </label>
                  <textarea
                    value={newDemande.motif}
                    onChange={(e) => setNewDemande((p) => ({ ...p, motif: e.target.value }))}
                    placeholder="Expliquez votre demande..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '14px',
                      resize: 'vertical',
                      color: '#111827',
                      caretColor: '#111827',
                      backgroundColor: '#fff',
                    }}
                  />
                </div>

                {/* Pièce jointe */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 900, color: '#334155', marginBottom: '8px' }}>
                    Pièce jointe (optionnel)
                  </label>

                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '2px dashed #cbd5e1',
                      backgroundColor: 'white',
                      color: '#111827',
                      fontWeight: 900,
                      cursor: 'pointer',
                      minHeight: '44px',
                    }}
                  >
                    📎 Ajouter une pièce jointe
                  </button>

                  {attachedFiles.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {attachedFiles.map((file, idx) => (
                        <div
                          key={`${file.name}-${file.size}-${idx}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '13px',
                                fontWeight: 900,
                                color: '#111827',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {file.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{(file.size / 1024).toFixed(1)} KB</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '10px',
                              border: '1px solid #fecaca',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              fontWeight: 900,
                              cursor: 'pointer',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Formats acceptés : PDF, JPG, PNG, DOC
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div
                  style={{
                    background: '#ebf8ff',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ fontSize: '18px' }}>ℹ️</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 900, color: '#1e40af', fontSize: '14px', margin: 0 }}>
                      Que se passe-t-il ensuite ?
                    </p>
                    <p style={{ color: '#334155', fontSize: '13px', margin: '4px 0 0 0' }}>
                      Votre demande sera transmise à la titulaire. Vous serez informé dès qu’elle est traitée.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'auto auto', gap: '12px', justifyContent: 'end' }}>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    style={{
                      width: isMobile ? '100%' : undefined,
                      padding: '14px 16px',
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      fontSize: '15px',
                      minHeight: '44px',
                    }}
                  >
                    Annuler
                  </button>

                  <button
                    onClick={handleSubmit}
                    style={{
                      width: isMobile ? '100%' : undefined,
                      padding: '14px 16px',
                      background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      fontSize: '15px',
                      minHeight: '44px',
                      boxShadow: '0 4px 15px rgba(72, 187, 120, 0.35)',
                    }}
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <div className={`bp-toast ${toast.type} ${toast.visible ? 'active' : ''}`}>
        <span>{toast.type === 'success' ? '✓' : '✗'}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toast.message}</span>
      </div>
    </>
  )
}