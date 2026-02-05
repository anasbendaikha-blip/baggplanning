// ============================================================
// 📁 app/titulaire/assistant-planning/components/Step2Creneaux.tsx
// ============================================================
// Étape 2 : Configuration des créneaux horaires
// ============================================================

'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { T, ROLE_PALETTE } from '@/lib/ui-tokens'
import {
  type Creneau,
  type BesoinRole,
  CRENEAUX_TEMPLATES,
  JOURS_SEMAINE,
  ROLES_DISPONIBLES,
  applyTemplate,
  createEmptyCreneau,
  generateCreneauId,
  getCreneauDuration,
  formatDuration,
  isCreneauValid
} from '@/lib/assistant-planning/templates'
import type { EmployeeRole } from '@/lib/mock-data'

// ============================================================
// Types
// ============================================================

export interface CreneauxConfig {
  templateId: string
  creneaux: Creneau[]
}

interface Step2CreneauxProps {
  config: CreneauxConfig
  joursActifs: boolean[]
  onChange: (config: CreneauxConfig) => void
  onValidChange: (isValid: boolean) => void
}

// ============================================================
// Composant Principal
// ============================================================

export function Step2Creneaux({ config, joursActifs, onChange, onValidChange }: Step2CreneauxProps) {
  // ============================================================
  // État local
  // ============================================================
  const [expandedCreneau, setExpandedCreneau] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  // ── Ref stable pour onValidChange (évite la boucle infinie) ──
  const onValidChangeRef = useRef(onValidChange)
  useEffect(() => {
    onValidChangeRef.current = onValidChange
  }, [onValidChange])

  // ============================================================
  // Validation globale (corrigée)
  // ============================================================
  useEffect(() => {
    // ── Guard : config.creneaux peut être undefined au mount ──
    if (!config?.creneaux) return

    const newErrors: string[] = []

    if (config.creneaux.length === 0) {
      newErrors.push('Définissez au moins un créneau')
    }

    // Vérifier chaque créneau
    config.creneaux.forEach((creneau) => {
      const validation = isCreneauValid(creneau)
      if (!validation.valid) {
        validation.errors.forEach(err => {
          newErrors.push(`Créneau "${creneau.nom}": ${err}`)
        })
      }
    })

    // Vérifier qu'au moins un créneau a un pharmacien
    const hasPharmacien = config.creneaux.some(c =>
      c.besoins.some(b => b.role === 'Pharmacien' && b.min > 0)
    )
    if (config.creneaux.length > 0 && !hasPharmacien) {
      newErrors.push('Au moins un créneau doit avoir un pharmacien (obligation légale)')
    }

    // ── Mise à jour conditionnelle pour éviter les re-renders inutiles ──
    setErrors(prev => {
      const next = JSON.stringify(newErrors)
      return JSON.stringify(prev) === next ? prev : newErrors
    })

    // ── Appel via ref (pas dans les dépendances → pas de boucle) ──
    onValidChangeRef.current(newErrors.length === 0)
  }, [config])
  // ☝️ onValidChange retiré des dépendances, utilisé via ref

  // ============================================================
  // Handlers - Template
  // ============================================================
  const handleTemplateSelect = useCallback((templateId: string) => {
    const newCreneaux = applyTemplate(templateId)
    onChange({
      templateId,
      creneaux: newCreneaux
    })
    if (templateId === 'custom' && newCreneaux.length > 0) {
      setExpandedCreneau(newCreneaux[0].id)
    } else {
      setExpandedCreneau(null)
    }
  }, [onChange])

  // ============================================================
  // Handlers - Créneaux
  // ============================================================
  const handleAddCreneau = useCallback(() => {
    const newCreneau = createEmptyCreneau()
    onChange({
      ...config,
      templateId: 'custom',
      creneaux: [...(config.creneaux || []), newCreneau]
    })
    setExpandedCreneau(newCreneau.id)
  }, [config, onChange])

  const handleRemoveCreneau = useCallback((id: string) => {
    onChange({
      ...config,
      templateId: 'custom',
      creneaux: (config.creneaux || []).filter(c => c.id !== id)
    })
    if (expandedCreneau === id) {
      setExpandedCreneau(null)
    }
  }, [config, onChange, expandedCreneau])

  const handleDuplicateCreneau = useCallback((creneau: Creneau) => {
    const newCreneau: Creneau = {
      ...creneau,
      id: generateCreneauId(),
      nom: `${creneau.nom} (copie)`
    }
    onChange({
      ...config,
      templateId: 'custom',
      creneaux: [...(config.creneaux || []), newCreneau]
    })
    setExpandedCreneau(newCreneau.id)
  }, [config, onChange])

  const handleUpdateCreneau = useCallback((id: string, updates: Partial<Creneau>) => {
    onChange({
      ...config,
      templateId: 'custom',
      creneaux: (config.creneaux || []).map(c =>
        c.id === id ? { ...c, ...updates } : c
      )
    })
  }, [config, onChange])

  // ============================================================
  // Handlers - Jours
  // ============================================================
  const handleToggleJour = useCallback((creneauId: string, jourIndex: number) => {
    const creneau = (config.creneaux || []).find(c => c.id === creneauId)
    if (!creneau) return

    const newJours = creneau.joursAppliques.includes(jourIndex)
      ? creneau.joursAppliques.filter(j => j !== jourIndex)
      : [...creneau.joursAppliques, jourIndex].sort((a, b) => a - b)

    handleUpdateCreneau(creneauId, { joursAppliques: newJours })
  }, [config.creneaux, handleUpdateCreneau])

  // ============================================================
  // Handlers - Besoins
  // ============================================================
  const handleUpdateBesoin = useCallback((
    creneauId: string,
    role: EmployeeRole,
    field: 'min' | 'max',
    value: number
  ) => {
    const creneau = (config.creneaux || []).find(c => c.id === creneauId)
    if (!creneau) return

    const existingBesoin = creneau.besoins.find(b => b.role === role)
    let newBesoins: BesoinRole[]

    if (existingBesoin) {
      newBesoins = creneau.besoins.map(b =>
        b.role === role ? { ...b, [field]: Math.max(0, value) } : b
      )
    } else {
      newBesoins = [
        ...creneau.besoins,
        { role, min: field === 'min' ? value : 0, max: field === 'max' ? value : 1 }
      ]
    }

    newBesoins = newBesoins.filter(b => b.min > 0 || b.max > 0)

    handleUpdateCreneau(creneauId, { besoins: newBesoins })
  }, [config.creneaux, handleUpdateCreneau])

  const handleAddRole = useCallback((creneauId: string, role: EmployeeRole) => {
    const creneau = (config.creneaux || []).find(c => c.id === creneauId)
    if (!creneau) return

    if (creneau.besoins.some(b => b.role === role)) return

    handleUpdateCreneau(creneauId, {
      besoins: [...creneau.besoins, { role, min: 0, max: 1 }]
    })
  }, [config.creneaux, handleUpdateCreneau])

  const handleRemoveRole = useCallback((creneauId: string, role: EmployeeRole) => {
    const creneau = (config.creneaux || []).find(c => c.id === creneauId)
    if (!creneau) return

    if (role === 'Pharmacien') return

    handleUpdateCreneau(creneauId, {
      besoins: creneau.besoins.filter(b => b.role !== role)
    })
  }, [config.creneaux, handleUpdateCreneau])

  // ============================================================
  // Calculs
  // ============================================================
  const totalHeuresParSemaine = useMemo(() => {
    if (!config?.creneaux) return 0
    let total = 0
    config.creneaux.forEach(creneau => {
      const duration = getCreneauDuration(creneau)
      const joursActifsCount = creneau.joursAppliques.filter(j => joursActifs[j]).length
      total += duration * joursActifsCount
    })
    return total
  }, [config.creneaux, joursActifs])

  // ============================================================
  // Rendu
  // ============================================================
  return (
    <div className="step2-container">
      {/* En-tête */}
      <div className="step2-header">
        <div className="step2-icon">⏰</div>
        <div>
          <h2 className="step2-title">Configurer les créneaux</h2>
          <p className="step2-subtitle">Définissez les horaires et les besoins en personnel</p>
        </div>
      </div>

      {/* Sélection du template */}
      <div className="step2-section">
        <h3 className="step2-section-title">Modèle de base</h3>
        <div className="step2-templates">
          {CRENEAUX_TEMPLATES.map(template => (
            <button
              key={template.id}
              type="button"
              className={`step2-template ${config.templateId === template.id ? 'active' : ''}`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <span className="step2-template-icon">{template.icon}</span>
              <span className="step2-template-name">{template.nom}</span>
              <span className="step2-template-desc">{template.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Liste des créneaux */}
      <div className="step2-section">
        <div className="step2-section-header">
          <h3 className="step2-section-title">
            Créneaux ({(config.creneaux || []).length})
          </h3>
          <button
            type="button"
            className="step2-add-btn"
            onClick={handleAddCreneau}
          >
            + Ajouter un créneau
          </button>
        </div>

        {(!config.creneaux || config.creneaux.length === 0) ? (
          <div className="step2-empty">
            <p>Aucun créneau défini</p>
            <button
              type="button"
              className="step2-empty-btn"
              onClick={handleAddCreneau}
            >
              Créer un créneau
            </button>
          </div>
        ) : (
          <div className="step2-creneaux-list">
            {config.creneaux.map(creneau => {
              const isExpanded = expandedCreneau === creneau.id
              const validation = isCreneauValid(creneau)
              const duration = getCreneauDuration(creneau)

              return (
                <div
                  key={creneau.id}
                  className={`step2-creneau ${isExpanded ? 'expanded' : ''} ${!validation.valid ? 'has-error' : ''}`}
                >
                  {/* Header du créneau */}
                  <div
                    className="step2-creneau-header"
                    onClick={() => setExpandedCreneau(isExpanded ? null : creneau.id)}
                  >
                    <div className="step2-creneau-info">
                      <span className="step2-creneau-chevron">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <span className="step2-creneau-name">{creneau.nom}</span>
                      <span className="step2-creneau-time">
                        {creneau.heureDebut} - {creneau.heureFin}
                      </span>
                      <span className="step2-creneau-duration">
                        ({formatDuration(duration)})
                      </span>
                    </div>
                    <div className="step2-creneau-actions">
                      <div className="step2-creneau-days">
                        {JOURS_SEMAINE.map((jour, idx) => (
                          <span
                            key={jour}
                            className={`step2-creneau-day ${creneau.joursAppliques.includes(idx) ? 'active' : ''} ${!joursActifs[idx] ? 'disabled' : ''}`}
                          >
                            {jour[0]}
                          </span>
                        ))}
                      </div>
                      {!validation.valid && (
                        <span className="step2-creneau-error-badge">⚠️</span>
                      )}
                    </div>
                  </div>

                  {/* Contenu étendu */}
                  {isExpanded && (
                    <div className="step2-creneau-content">
                      {/* Nom */}
                      <div className="step2-field">
                        <label>Nom du créneau</label>
                        <input
                          type="text"
                          value={creneau.nom}
                          onChange={(e) => handleUpdateCreneau(creneau.id, { nom: e.target.value })}
                          className="step2-input"
                          placeholder="Ex: Matin, Après-midi..."
                        />
                      </div>

                      {/* Horaires */}
                      <div className="step2-field-row">
                        <div className="step2-field">
                          <label>Début</label>
                          <input
                            type="time"
                            value={creneau.heureDebut}
                            onChange={(e) => handleUpdateCreneau(creneau.id, { heureDebut: e.target.value })}
                            className="step2-input"
                          />
                        </div>
                        <div className="step2-field">
                          <label>Fin</label>
                          <input
                            type="time"
                            value={creneau.heureFin}
                            onChange={(e) => handleUpdateCreneau(creneau.id, { heureFin: e.target.value })}
                            className="step2-input"
                          />
                        </div>
                      </div>

                      {/* Jours */}
                      <div className="step2-field">
                        <label>Jours d&apos;application</label>
                        <div className="step2-days-grid">
                          {JOURS_SEMAINE.map((jour, idx) => {
                            const isActive = creneau.joursAppliques.includes(idx)
                            const isDisabled = !joursActifs[idx]

                            return (
                              <button
                                key={jour}
                                type="button"
                                className={`step2-day-btn ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                                onClick={() => !isDisabled && handleToggleJour(creneau.id, idx)}
                                disabled={isDisabled}
                                title={isDisabled ? 'Jour non actif dans la période' : jour}
                              >
                                {jour}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Besoins par rôle */}
                      <div className="step2-field">
                        <label>Besoins en personnel</label>
                        <div className="step2-besoins">
                          {creneau.besoins.map(besoin => (
                            <div key={besoin.role} className="step2-besoin">
                              <div
                                className="step2-besoin-role"
                                style={{ borderLeftColor: ROLE_PALETTE[besoin.role]?.bg || T.border }}
                              >
                                <span>{besoin.role}</span>
                                {besoin.role !== 'Pharmacien' && (
                                  <button
                                    type="button"
                                    className="step2-besoin-remove"
                                    onClick={() => handleRemoveRole(creneau.id, besoin.role)}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                              <div className="step2-besoin-inputs">
                                <div className="step2-besoin-field">
                                  <span>Min</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={besoin.min}
                                    onChange={(e) => handleUpdateBesoin(creneau.id, besoin.role, 'min', parseInt(e.target.value) || 0)}
                                    className="step2-number-input"
                                  />
                                </div>
                                <div className="step2-besoin-field">
                                  <span>Max</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={besoin.max}
                                    onChange={(e) => handleUpdateBesoin(creneau.id, besoin.role, 'max', parseInt(e.target.value) || 0)}
                                    className="step2-number-input"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Ajouter un rôle */}
                          {creneau.besoins.length < ROLES_DISPONIBLES.length && (
                            <div className="step2-add-role">
                              <select
                                className="step2-select"
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAddRole(creneau.id, e.target.value as EmployeeRole)
                                  }
                                }}
                              >
                                <option value="">+ Ajouter un rôle</option>
                                {ROLES_DISPONIBLES.filter(
                                  role => !creneau.besoins.some(b => b.role === role)
                                ).map(role => (
                                  <option key={role} value={role}>{role}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Erreurs */}
                      {!validation.valid && (
                        <div className="step2-creneau-errors">
                          {validation.errors.map((err, i) => (
                            <div key={i} className="step2-creneau-error">
                              ⚠️ {err}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="step2-creneau-footer">
                        <button
                          type="button"
                          className="step2-btn secondary"
                          onClick={() => handleDuplicateCreneau(creneau)}
                        >
                          📋 Dupliquer
                        </button>
                        <button
                          type="button"
                          className="step2-btn danger"
                          onClick={() => handleRemoveCreneau(creneau.id)}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Résumé */}
      {config.creneaux && config.creneaux.length > 0 && (
        <div className="step2-summary">
          <div className="step2-summary-item">
            <span className="step2-summary-value">{config.creneaux.length}</span>
            <span className="step2-summary-label">créneau{config.creneaux.length > 1 ? 'x' : ''}</span>
          </div>
          <div className="step2-summary-item">
            <span className="step2-summary-value">{formatDuration(totalHeuresParSemaine)}</span>
            <span className="step2-summary-label">par semaine</span>
          </div>
        </div>
      )}

      {/* Erreurs globales */}
      {errors.length > 0 && (
        <div className="step2-alert error">
          {errors.slice(0, 3).map((err, i) => (
            <div key={i} className="step2-alert-item">
              <span>⚠️</span>
              <span>{err}</span>
            </div>
          ))}
          {errors.length > 3 && (
            <div className="step2-alert-more">
              +{errors.length - 3} autre{errors.length - 3 > 1 ? 's' : ''} erreur{errors.length - 3 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .step2-container {
          max-width: 700px;
          margin: 0 auto;
        }

        .step2-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }

        .step2-icon {
          width: 56px;
          height: 56px;
          background: ${T.warningLt};
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        .step2-title {
          font-size: 22px;
          font-weight: 700;
          color: ${T.text};
          margin: 0 0 4px 0;
        }

        .step2-subtitle {
          font-size: 14px;
          color: ${T.textSec};
          margin: 0;
        }

        .step2-section {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .step2-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .step2-section-title {
          font-size: 15px;
          font-weight: 600;
          color: ${T.text};
          margin: 0;
        }

        .step2-add-btn {
          padding: 6px 12px;
          background: ${T.primaryLt};
          border: 1px solid ${T.primary};
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: ${T.primaryDk};
          cursor: pointer;
          transition: all 0.15s;
        }

        .step2-add-btn:hover {
          background: ${T.primary};
          color: white;
        }

        .step2-templates {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }

        .step2-template {
          padding: 16px;
          background: ${T.card};
          border: 2px solid ${T.border};
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .step2-template:hover {
          border-color: ${T.borderMd};
          background: ${T.borderLt};
        }

        .step2-template.active {
          border-color: ${T.info};
          background: ${T.infoBg};
        }

        .step2-template-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }

        .step2-template-name {
          font-size: 14px;
          font-weight: 600;
          color: ${T.text};
        }

        .step2-template-desc {
          font-size: 11px;
          color: ${T.muted};
          line-height: 1.3;
        }

        .step2-empty {
          padding: 40px 20px;
          text-align: center;
          border: 2px dashed ${T.border};
          border-radius: 10px;
        }

        .step2-empty p {
          margin: 0 0 16px 0;
          color: ${T.muted};
        }

        .step2-empty-btn {
          padding: 10px 20px;
          background: ${T.info};
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .step2-creneaux-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .step2-creneau {
          background: ${T.borderLt};
          border: 1px solid ${T.border};
          border-radius: 10px;
          overflow: hidden;
        }

        .step2-creneau.has-error {
          border-color: ${T.dangerBd};
        }

        .step2-creneau.expanded {
          background: ${T.card};
        }

        .step2-creneau-header {
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background 0.15s;
        }

        .step2-creneau-header:hover {
          background: ${T.border};
        }

        .step2-creneau.expanded .step2-creneau-header {
          border-bottom: 1px solid ${T.border};
        }

        .step2-creneau-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .step2-creneau-chevron {
          font-size: 10px;
          color: ${T.muted};
          width: 12px;
        }

        .step2-creneau-name {
          font-weight: 600;
          color: ${T.text};
          font-size: 14px;
        }

        .step2-creneau-time {
          font-size: 13px;
          color: ${T.textSec};
        }

        .step2-creneau-duration {
          font-size: 12px;
          color: ${T.muted};
        }

        .step2-creneau-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .step2-creneau-days {
          display: flex;
          gap: 3px;
        }

        .step2-creneau-day {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background: ${T.card};
          border: 1px solid ${T.border};
          font-size: 10px;
          font-weight: 600;
          color: ${T.muted};
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step2-creneau-day.active {
          background: ${T.info};
          border-color: ${T.info};
          color: white;
        }

        .step2-creneau-day.disabled {
          opacity: 0.3;
        }

        .step2-creneau-error-badge {
          font-size: 14px;
        }

        .step2-creneau-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .step2-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .step2-field label {
          font-size: 12px;
          font-weight: 600;
          color: ${T.textSec};
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .step2-field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .step2-input {
          padding: 10px 12px;
          border: 1px solid ${T.border};
          border-radius: 8px;
          font-size: 14px;
          color: ${T.text};
          background: ${T.card};
          outline: none;
        }

        .step2-input:focus {
          border-color: ${T.info};
          box-shadow: 0 0 0 3px ${T.infoLt};
        }

        .step2-days-grid {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .step2-day-btn {
          padding: 8px 12px;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: ${T.textSec};
          cursor: pointer;
          transition: all 0.15s;
        }

        .step2-day-btn:hover:not(.disabled) {
          border-color: ${T.borderMd};
        }

        .step2-day-btn.active {
          background: ${T.info};
          border-color: ${T.info};
          color: white;
        }

        .step2-day-btn.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .step2-besoins {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .step2-besoin {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: ${T.borderLt};
          border-radius: 8px;
        }

        .step2-besoin-role {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 13px;
          color: ${T.text};
          border-left: 3px solid;
          padding-left: 8px;
        }

        .step2-besoin-remove {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${T.dangerLt};
          border: none;
          color: ${T.danger};
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step2-besoin-inputs {
          display: flex;
          gap: 16px;
        }

        .step2-besoin-field {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .step2-besoin-field span {
          font-size: 11px;
          color: ${T.muted};
        }

        .step2-number-input {
          width: 50px;
          padding: 6px 8px;
          border: 1px solid ${T.border};
          border-radius: 6px;
          font-size: 14px;
          text-align: center;
          color: ${T.text};
          background: ${T.card};
        }

        .step2-add-role {
          padding-top: 8px;
        }

        .step2-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px dashed ${T.border};
          border-radius: 8px;
          font-size: 13px;
          color: ${T.muted};
          background: transparent;
          cursor: pointer;
        }

        .step2-creneau-errors {
          padding: 12px;
          background: ${T.dangerBg};
          border: 1px solid ${T.dangerBd};
          border-radius: 8px;
        }

        .step2-creneau-error {
          font-size: 12px;
          color: ${T.dangerDk};
        }

        .step2-creneau-error + .step2-creneau-error {
          margin-top: 4px;
        }

        .step2-creneau-footer {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          padding-top: 8px;
          border-top: 1px solid ${T.border};
        }

        .step2-btn {
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
        }

        .step2-btn.secondary {
          background: ${T.borderLt};
          color: ${T.text};
        }

        .step2-btn.secondary:hover {
          background: ${T.border};
        }

        .step2-btn.danger {
          background: ${T.dangerLt};
          color: ${T.danger};
        }

        .step2-btn.danger:hover {
          background: ${T.dangerBd};
        }

        .step2-summary {
          display: flex;
          gap: 24px;
          padding: 16px 20px;
          background: ${T.infoBg};
          border: 1px solid ${T.infoLt};
          border-radius: 10px;
        }

        .step2-summary-item {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .step2-summary-value {
          font-size: 20px;
          font-weight: 700;
          color: ${T.info};
        }

        .step2-summary-label {
          font-size: 13px;
          color: ${T.textSec};
        }

        .step2-alert {
          padding: 14px 16px;
          border-radius: 10px;
          margin-top: 8px;
        }

        .step2-alert.error {
          background: ${T.dangerBg};
          border: 1px solid ${T.dangerBd};
        }

        .step2-alert-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          color: ${T.dangerDk};
        }

        .step2-alert-item + .step2-alert-item {
          margin-top: 6px;
        }

        .step2-alert-more {
          margin-top: 8px;
          font-size: 12px;
          color: ${T.danger};
        }

        @media (max-width: 500px) {
          .step2-templates {
            grid-template-columns: 1fr;
          }

          .step2-creneau-info {
            flex-wrap: wrap;
          }

          .step2-creneau-time,
          .step2-creneau-duration {
            font-size: 11px;
          }

          .step2-field-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default Step2Creneaux