// ============================================================
// 📁 app/titulaire/assistant-planning/components/Step1Periode.tsx
// ============================================================
// Étape 1 : Sélection de la période et des jours actifs
// ============================================================

'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { T } from '@/lib/ui-tokens'
import { daysBetween } from '@/lib/date-utils'

// ============================================================
// Types
// ============================================================

export interface PeriodeConfig {
  dateDebut: string      // Format YYYY-MM-DD
  dateFin: string        // Format YYYY-MM-DD
  joursActifs: boolean[] // [Lun, Mar, Mer, Jeu, Ven, Sam, Dim]
}

interface Step1PeriodeProps {
  config: PeriodeConfig
  onChange: (config: PeriodeConfig) => void
  onValidChange: (isValid: boolean) => void
}

// ============================================================
// Constantes
// ============================================================

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const JOURS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

// ============================================================
// Helpers
// ============================================================

const formatDateFr = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const getTodayStr = (): string => {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

const getDefaultEndDate = (startDate: string): string => {
  const d = new Date(startDate)
  d.setDate(d.getDate() + 6) // 1 semaine par défaut
  return d.toISOString().split('T')[0]
}

// ============================================================
// Composant Principal
// ============================================================

export function Step1Periode({ config, onChange, onValidChange }: Step1PeriodeProps) {
  // ============================================================
  // État local pour les erreurs
  // ============================================================
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])

  // ── Ref stable pour onValidChange (évite la boucle infinie) ──
  const onValidChangeRef = useRef(onValidChange)
  useEffect(() => {
    onValidChangeRef.current = onValidChange
  }, [onValidChange])

  // ============================================================
  // Calculs dérivés
  // ============================================================
  const nombreJours = useMemo(() => {
    if (!config.dateDebut || !config.dateFin) return 0
    return daysBetween(config.dateDebut, config.dateFin)
  }, [config.dateDebut, config.dateFin])

  const joursActifsCount = useMemo(() => {
    return config.joursActifs.filter(Boolean).length
  }, [config.joursActifs])

  // ============================================================
  // Validation (corrigée — plus de boucle infinie)
  // ============================================================
  useEffect(() => {
    const newErrors: string[] = []
    const newWarnings: string[] = []

    // Validation date début
    if (!config.dateDebut) {
      newErrors.push('La date de début est requise')
    }

    // Validation date fin
    if (!config.dateFin) {
      newErrors.push('La date de fin est requise')
    }

    // Validation cohérence dates
    if (config.dateDebut && config.dateFin) {
      if (config.dateFin < config.dateDebut) {
        newErrors.push('La date de fin doit être après la date de début')
      } else if (nombreJours > 31) {
        newErrors.push('La période ne peut pas dépasser 31 jours')
      } else if (nombreJours > 14) {
        newWarnings.push('Période longue : la génération peut être plus lente')
      }
    }

    // Validation jours actifs
    if (joursActifsCount === 0) {
      newErrors.push('Sélectionnez au moins un jour de la semaine')
    }

    // ── Mise à jour conditionnelle pour éviter les re-renders inutiles ──
    setErrors(prev => {
      const next = JSON.stringify(newErrors)
      return JSON.stringify(prev) === next ? prev : newErrors
    })
    setWarnings(prev => {
      const next = JSON.stringify(newWarnings)
      return JSON.stringify(prev) === next ? prev : newWarnings
    })

    // ── Appel via ref (pas dans les dépendances → pas de boucle) ──
    onValidChangeRef.current(newErrors.length === 0)
  }, [config, nombreJours, joursActifsCount])
  // ☝️ onValidChange retiré des dépendances, utilisé via ref

  // ============================================================
  // Handlers
  // ============================================================
  const handleDateDebutChange = (value: string) => {
    const newConfig = { ...config, dateDebut: value }
    // Auto-ajuster la date de fin si nécessaire
    if (!config.dateFin || value > config.dateFin) {
      newConfig.dateFin = getDefaultEndDate(value)
    }
    onChange(newConfig)
  }

  const handleDateFinChange = (value: string) => {
    onChange({ ...config, dateFin: value })
  }

  const toggleJour = (index: number) => {
    const newJours = [...config.joursActifs]
    newJours[index] = !newJours[index]
    onChange({ ...config, joursActifs: newJours })
  }

  const setPreset = (preset: 'semaine' | 'tous') => {
    const newJours = preset === 'semaine'
      ? [true, true, true, true, true, false, false]  // Lun-Ven
      : [true, true, true, true, true, true, true]    // Tous
    onChange({ ...config, joursActifs: newJours })
  }

  // ============================================================
  // Rendu
  // ============================================================
  return (
    <div className="step1-container">
      {/* En-tête */}
      <div className="step1-header">
        <div className="step1-icon">📅</div>
        <div>
          <h2 className="step1-title">Définir la période</h2>
          <p className="step1-subtitle">Choisissez les dates et les jours de travail</p>
        </div>
      </div>

      {/* Section Dates */}
      <div className="step1-section">
        <h3 className="step1-section-title">Période de planification</h3>

        <div className="step1-dates-grid">
          <div className="step1-date-field">
            <label htmlFor="dateDebut">Date de début</label>
            <input
              type="date"
              id="dateDebut"
              value={config.dateDebut}
              min={getTodayStr()}
              onChange={(e) => handleDateDebutChange(e.target.value)}
              className="step1-input"
            />
            {config.dateDebut && (
              <span className="step1-date-preview">{formatDateFr(config.dateDebut)}</span>
            )}
          </div>

          <div className="step1-date-field">
            <label htmlFor="dateFin">Date de fin</label>
            <input
              type="date"
              id="dateFin"
              value={config.dateFin}
              min={config.dateDebut || getTodayStr()}
              onChange={(e) => handleDateFinChange(e.target.value)}
              className="step1-input"
            />
            {config.dateFin && (
              <span className="step1-date-preview">{formatDateFr(config.dateFin)}</span>
            )}
          </div>
        </div>

        {/* Résumé période */}
        {nombreJours > 0 && (
          <div className="step1-period-summary">
            <span className="step1-period-badge">{nombreJours} jour{nombreJours > 1 ? 's' : ''}</span>
            <span className="step1-period-text">
              du {formatDateFr(config.dateDebut)} au {formatDateFr(config.dateFin)}
            </span>
          </div>
        )}
      </div>

      {/* Section Jours actifs */}
      <div className="step1-section">
        <div className="step1-section-header">
          <h3 className="step1-section-title">Jours de travail</h3>
          <div className="step1-presets">
            <button
              type="button"
              className={`step1-preset-btn ${joursActifsCount === 5 && !config.joursActifs[5] && !config.joursActifs[6] ? 'active' : ''}`}
              onClick={() => setPreset('semaine')}
            >
              Lun-Ven
            </button>
            <button
              type="button"
              className={`step1-preset-btn ${joursActifsCount === 7 ? 'active' : ''}`}
              onClick={() => setPreset('tous')}
            >
              Tous les jours
            </button>
          </div>
        </div>

        <div className="step1-days-grid">
          {JOURS.map((jour, index) => (
            <button
              key={jour}
              type="button"
              className={`step1-day-btn ${config.joursActifs[index] ? 'active' : ''} ${index >= 5 ? 'weekend' : ''}`}
              onClick={() => toggleJour(index)}
              title={JOURS_FULL[index]}
            >
              <span className="step1-day-name">{jour}</span>
              <span className="step1-day-check">
                {config.joursActifs[index] ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>

        <p className="step1-days-hint">
          {joursActifsCount === 0
            ? 'Sélectionnez les jours où la pharmacie est ouverte'
            : `${joursActifsCount} jour${joursActifsCount > 1 ? 's' : ''} sélectionné${joursActifsCount > 1 ? 's' : ''}`
          }
        </p>
      </div>

      {/* Alertes et Erreurs */}
      {errors.length > 0 && (
        <div className="step1-alert error">
          {errors.map((err, i) => (
            <div key={i} className="step1-alert-item">
              <span className="step1-alert-icon">⚠️</span>
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && errors.length === 0 && (
        <div className="step1-alert warning">
          {warnings.map((warn, i) => (
            <div key={i} className="step1-alert-item">
              <span className="step1-alert-icon">💡</span>
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .step1-container {
          max-width: 600px;
          margin: 0 auto;
        }

        .step1-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }

        .step1-icon {
          width: 56px;
          height: 56px;
          background: ${T.infoLt};
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        .step1-title {
          font-size: 22px;
          font-weight: 700;
          color: ${T.text};
          margin: 0 0 4px 0;
        }

        .step1-subtitle {
          font-size: 14px;
          color: ${T.textSec};
          margin: 0;
        }

        .step1-section {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .step1-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }

        .step1-section-title {
          font-size: 15px;
          font-weight: 600;
          color: ${T.text};
          margin: 0 0 16px 0;
        }

        .step1-section-header .step1-section-title {
          margin-bottom: 0;
        }

        .step1-dates-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 500px) {
          .step1-dates-grid {
            grid-template-columns: 1fr;
          }
        }

        .step1-date-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .step1-date-field label {
          font-size: 12px;
          font-weight: 600;
          color: ${T.textSec};
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .step1-input {
          padding: 12px 14px;
          border: 1px solid ${T.border};
          border-radius: 8px;
          font-size: 15px;
          color: ${T.text};
          background: ${T.card};
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .step1-input:focus {
          border-color: ${T.info};
          box-shadow: 0 0 0 3px ${T.infoLt};
        }

        .step1-date-preview {
          font-size: 12px;
          color: ${T.muted};
          text-transform: capitalize;
        }

        .step1-period-summary {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
          padding: 12px;
          background: ${T.infoBg};
          border-radius: 8px;
          flex-wrap: wrap;
        }

        .step1-period-badge {
          padding: 4px 10px;
          background: ${T.info};
          color: white;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
        }

        .step1-period-text {
          font-size: 13px;
          color: ${T.textSec};
        }

        .step1-presets {
          display: flex;
          gap: 8px;
        }

        .step1-preset-btn {
          padding: 6px 12px;
          background: ${T.borderLt};
          border: 1px solid ${T.border};
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: ${T.textSec};
          cursor: pointer;
          transition: all 0.15s;
        }

        .step1-preset-btn:hover {
          background: ${T.border};
        }

        .step1-preset-btn.active {
          background: ${T.info};
          border-color: ${T.info};
          color: white;
        }

        .step1-days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }

        @media (max-width: 500px) {
          .step1-days-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .step1-day-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px 8px;
          background: ${T.card};
          border: 2px solid ${T.border};
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
          min-height: 60px;
        }

        .step1-day-btn:hover {
          border-color: ${T.borderMd};
          background: ${T.borderLt};
        }

        .step1-day-btn.active {
          background: ${T.primaryLt};
          border-color: ${T.primary};
        }

        .step1-day-btn.weekend {
          background: ${T.borderLt};
        }

        .step1-day-btn.weekend.active {
          background: ${T.warningLt};
          border-color: ${T.warning};
        }

        .step1-day-name {
          font-size: 13px;
          font-weight: 600;
          color: ${T.text};
        }

        .step1-day-check {
          font-size: 16px;
          color: ${T.primary};
          height: 20px;
          display: flex;
          align-items: center;
        }

        .step1-day-btn.weekend .step1-day-check {
          color: ${T.warning};
        }

        .step1-days-hint {
          margin: 12px 0 0 0;
          font-size: 13px;
          color: ${T.muted};
          text-align: center;
        }

        .step1-alert {
          padding: 14px 16px;
          border-radius: 10px;
          margin-top: 8px;
        }

        .step1-alert.error {
          background: ${T.dangerBg};
          border: 1px solid ${T.dangerBd};
        }

        .step1-alert.warning {
          background: ${T.warningBg};
          border: 1px solid ${T.warningBd};
        }

        .step1-alert-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
        }

        .step1-alert.error .step1-alert-item {
          color: ${T.dangerDk};
        }

        .step1-alert.warning .step1-alert-item {
          color: ${T.warningDk};
        }

        .step1-alert-item + .step1-alert-item {
          margin-top: 6px;
        }

        .step1-alert-icon {
          font-size: 14px;
        }
      `}</style>
    </div>
  )
}

export default Step1Periode