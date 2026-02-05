// ============================================================
// 📁 app/titulaire/assistant-planning/components/Step4Validation.tsx
// ============================================================
// Étape 4 : Résumé et génération du planning
// ============================================================
 
'use client'
 
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { T, ROLE_PALETTE } from '@/lib/ui-tokens'
import { ROLE_ICONS, ROLE_LABELS, type EmployeeRole } from '@/lib/mock-data'
import { JOURS_SEMAINE_FULL, getCreneauDuration, formatDuration } from '@/lib/assistant-planning/templates'
import type { PeriodeConfig } from './Step1Periode'
import type { CreneauxConfig } from './Step2Creneaux'
import type { EmployesConfig } from './Step3Employes'
 
// ============================================================
// Types
// ============================================================
 
export interface ValidationConfig {
  acceptedWarnings: string[]
}
 
interface Step4ValidationProps {
  periodeConfig: PeriodeConfig
  creneauxConfig: CreneauxConfig
  employesConfig: EmployesConfig
  config: ValidationConfig
  onChange: (config: ValidationConfig) => void
  onValidChange: (isValid: boolean) => void
  onGenerate: () => Promise<void>
}
 
interface DiagnosticItem {
  type: 'error' | 'warning' | 'info'
  code: string
  message: string
  details?: string
}
 
// ============================================================
// Helpers
// ============================================================
 
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
 
const getDaysBetween = (start: string, end: string): number => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
}
 
export const getDefaultValidationConfig = (): ValidationConfig => ({
  acceptedWarnings: []
})
 
// ============================================================
// Composant Principal
// ============================================================
 
export function Step4Validation({
  periodeConfig,
  creneauxConfig,
  employesConfig,
  config,
  onChange,
  onValidChange,
  onGenerate
}: Step4ValidationProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
 
  // ============================================================
  // Calculs statistiques
  // ============================================================
 
  const periodeStats = useMemo(() => {
    const totalDays = getDaysBetween(periodeConfig.dateDebut, periodeConfig.dateFin)
    const activeDaysCount = periodeConfig.joursActifs.filter(Boolean).length
    const activeDaysInPeriod = Math.ceil(totalDays / 7) * activeDaysCount
 
    return {
      totalDays,
      activeDaysCount,
      activeDaysInPeriod,
      dateDebutFormatted: formatDate(periodeConfig.dateDebut),
      dateFinFormatted: formatDate(periodeConfig.dateFin),
      activeJoursLabels: periodeConfig.joursActifs
        .map((active, idx) => active ? JOURS_SEMAINE_FULL[idx] : null)
        .filter(Boolean)
    }
  }, [periodeConfig])
 
  const creneauxStats = useMemo(() => {
    const creneaux = creneauxConfig.creneaux
    const totalCreneaux = creneaux.length
 
    // Heures totales par jour (pour les jours actifs)
    let totalHeuresParJour = 0
    creneaux.forEach(c => {
      const duration = getCreneauDuration(c)
      totalHeuresParJour += duration
    })
 
    // Besoins totaux par rôle
    const besoinsParRole: Record<EmployeeRole, { min: number; max: number }> = {
      Pharmacien: { min: 0, max: 0 },
      Preparateur: { min: 0, max: 0 },
      Apprenti: { min: 0, max: 0 },
      Etudiant: { min: 0, max: 0 },
      Conditionneur: { min: 0, max: 0 }
    }
 
    creneaux.forEach(c => {
      c.besoins.forEach(b => {
        besoinsParRole[b.role].min += b.min
        besoinsParRole[b.role].max += b.max
      })
    })
 
    return {
      totalCreneaux,
      totalHeuresParJour,
      besoinsParRole
    }
  }, [creneauxConfig])
 
  const employesStats = useMemo(() => {
    const actifs = employesConfig.contraintes.filter(c => c.actif)
    const byRole: Record<EmployeeRole, number> = {
      Pharmacien: 0,
      Preparateur: 0,
      Apprenti: 0,
      Etudiant: 0,
      Conditionneur: 0
    }
 
    actifs.forEach(c => {
      byRole[c.role]++
    })
 
    const totalHeuresMin = actifs.reduce((sum, c) => sum + c.heuresMin, 0)
    const totalHeuresMax = actifs.reduce((sum, c) => sum + c.heuresMax, 0)
 
    return {
      total: employesConfig.contraintes.length,
      actifs: actifs.length,
      byRole,
      totalHeuresMin,
      totalHeuresMax
    }
  }, [employesConfig])
 
  // ============================================================
  // Diagnostic
  // ============================================================
 
  const diagnostics = useMemo(() => {
    const items: DiagnosticItem[] = []
 
    // === Erreurs ===
 
    // Vérifier qu'il y a au moins un pharmacien actif
    if (employesStats.byRole.Pharmacien === 0) {
      items.push({
        type: 'error',
        code: 'NO_PHARMACIST',
        message: 'Aucun pharmacien actif',
        details: 'La loi exige la présence d\'un pharmacien en permanence'
      })
    }
 
    // Vérifier qu'il y a assez de pharmaciens pour les besoins
    const minPharmacienNeeded = creneauxStats.besoinsParRole.Pharmacien.min
    if (employesStats.byRole.Pharmacien < minPharmacienNeeded) {
      items.push({
        type: 'error',
        code: 'INSUFFICIENT_PHARMACISTS',
        message: `Pharmaciens insuffisants (${employesStats.byRole.Pharmacien}/${minPharmacienNeeded} minimum)`,
        details: 'Ajoutez des pharmaciens ou réduisez les besoins des créneaux'
      })
    }
 
    // Vérifier qu'il y a au moins un employé actif
    if (employesStats.actifs === 0) {
      items.push({
        type: 'error',
        code: 'NO_EMPLOYEES',
        message: 'Aucun employé sélectionné',
        details: 'Activez au moins un employé dans l\'étape 3'
      })
    }
 
    // Vérifier qu'il y a au moins un créneau
    if (creneauxStats.totalCreneaux === 0) {
      items.push({
        type: 'error',
        code: 'NO_SLOTS',
        message: 'Aucun créneau configuré',
        details: 'Ajoutez au moins un créneau dans l\'étape 2'
      })
    }
 
    // === Avertissements ===
 
    // Capacité totale vs besoins
    const heuresBesoinsMinHebdo = creneauxStats.totalHeuresParJour * periodeStats.activeDaysCount
    if (employesStats.totalHeuresMax < heuresBesoinsMinHebdo) {
      items.push({
        type: 'warning',
        code: 'CAPACITY_LOW',
        message: `Capacité potentiellement insuffisante`,
        details: `Capacité: ${employesStats.totalHeuresMin}-${employesStats.totalHeuresMax}h/sem | Besoins estimés: ~${Math.round(heuresBesoinsMinHebdo)}h/sem`
      })
    }
 
    // Vérifier les rôles sans employés
    const roles: EmployeeRole[] = ['Pharmacien', 'Preparateur', 'Apprenti', 'Etudiant', 'Conditionneur']
    roles.forEach(role => {
      const besoinsMin = creneauxStats.besoinsParRole[role].min
      const disponibles = employesStats.byRole[role]
      if (besoinsMin > 0 && disponibles === 0) {
        items.push({
          type: 'warning',
          code: `NO_${role.toUpperCase()}`,
          message: `Aucun ${ROLE_LABELS[role]} actif`,
          details: `${besoinsMin} ${ROLE_LABELS[role]}(s) minimum requis par les créneaux`
        })
      }
    })
 
    // Période longue
    if (periodeStats.totalDays > 14) {
      items.push({
        type: 'info',
        code: 'LONG_PERIOD',
        message: `Période de ${periodeStats.totalDays} jours`,
        details: 'La génération peut prendre plus de temps pour les longues périodes'
      })
    }
 
    return items
  }, [periodeStats, creneauxStats, employesStats])
 
  const hasErrors = diagnostics.some(d => d.type === 'error')
  const warnings = diagnostics.filter(d => d.type === 'warning')
  const infos = diagnostics.filter(d => d.type === 'info')
 
  // ============================================================
  // Validation
  // ============================================================
 
  useEffect(() => {
    // Valide si pas d'erreurs et tous les warnings sont acceptés
    const allWarningsAccepted = warnings.every(w =>
      config.acceptedWarnings.includes(w.code)
    )
    onValidChange(!hasErrors && (warnings.length === 0 || allWarningsAccepted))
  }, [diagnostics, config.acceptedWarnings, hasErrors, warnings, onValidChange])
 
  // ============================================================
  // Handlers
  // ============================================================
 
  const handleToggleWarning = useCallback((code: string) => {
    const newAccepted = config.acceptedWarnings.includes(code)
      ? config.acceptedWarnings.filter(c => c !== code)
      : [...config.acceptedWarnings, code]
    onChange({ ...config, acceptedWarnings: newAccepted })
  }, [config, onChange])
 
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setGenerationError(null)
 
    try {
      await onGenerate()
      // Redirection vers la page de prévisualisation
      router.push('/titulaire/assistant-planning/preview')
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Erreur lors de la génération')
    } finally {
      setIsGenerating(false)
    }
  }, [onGenerate, router])
 
  // ============================================================
  // Rendu
  // ============================================================
 
  return (
    <div className="step4-container">
      {/* En-tête */}
      <div className="step4-header">
        <div className="step4-icon">✅</div>
        <div>
          <h2 className="step4-title">Validation & Génération</h2>
          <p className="step4-subtitle">Vérifiez votre configuration avant de générer</p>
        </div>
      </div>
 
      {/* Résumé de la configuration */}
      <div className="step4-summary">
        {/* Période */}
        <div className="step4-summary-card">
          <div className="step4-summary-header">
            <span className="step4-summary-icon">📅</span>
            <h3>Période</h3>
          </div>
          <div className="step4-summary-content">
            <div className="step4-summary-row">
              <span className="step4-summary-label">Dates</span>
              <span className="step4-summary-value">
                {periodeStats.dateDebutFormatted} → {periodeStats.dateFinFormatted}
              </span>
            </div>
            <div className="step4-summary-row">
              <span className="step4-summary-label">Durée</span>
              <span className="step4-summary-value">
                {periodeStats.totalDays} jour{periodeStats.totalDays > 1 ? 's' : ''}
              </span>
            </div>
            <div className="step4-summary-row">
              <span className="step4-summary-label">Jours actifs</span>
              <span className="step4-summary-value">
                {periodeStats.activeJoursLabels.join(', ')}
              </span>
            </div>
          </div>
        </div>
 
        {/* Créneaux */}
        <div className="step4-summary-card">
          <div className="step4-summary-header">
            <span className="step4-summary-icon">⏰</span>
            <h3>Créneaux</h3>
          </div>
          <div className="step4-summary-content">
            <div className="step4-summary-row">
              <span className="step4-summary-label">Nombre</span>
              <span className="step4-summary-value">
                {creneauxStats.totalCreneaux} créneau{creneauxStats.totalCreneaux > 1 ? 'x' : ''}
              </span>
            </div>
            <div className="step4-summary-row">
              <span className="step4-summary-label">Template</span>
              <span className="step4-summary-value">
                {creneauxConfig.templateId === 'custom' ? 'Personnalisé' : creneauxConfig.templateId}
              </span>
            </div>
            <div className="step4-summary-row">
              <span className="step4-summary-label">Heures/jour</span>
              <span className="step4-summary-value">
                ~{formatDuration(creneauxStats.totalHeuresParJour)}
              </span>
            </div>
          </div>
        </div>
 
        {/* Employés */}
        <div className="step4-summary-card">
          <div className="step4-summary-header">
            <span className="step4-summary-icon">👥</span>
            <h3>Employés</h3>
          </div>
          <div className="step4-summary-content">
            <div className="step4-summary-row">
              <span className="step4-summary-label">Actifs</span>
              <span className="step4-summary-value">
                {employesStats.actifs}/{employesStats.total}
              </span>
            </div>
            <div className="step4-summary-roles">
              {(['Pharmacien', 'Preparateur', 'Apprenti', 'Etudiant', 'Conditionneur'] as EmployeeRole[]).map(role => {
                const count = employesStats.byRole[role]
                if (count === 0) return null
                return (
                  <span
                    key={role}
                    className="step4-role-badge"
                    style={{ backgroundColor: ROLE_PALETTE[role]?.light, color: ROLE_PALETTE[role]?.dark }}
                  >
                    {ROLE_ICONS[role]} {count}
                  </span>
                )
              })}
            </div>
            <div className="step4-summary-row">
              <span className="step4-summary-label">Capacité</span>
              <span className="step4-summary-value">
                {employesStats.totalHeuresMin}-{employesStats.totalHeuresMax}h/sem
              </span>
            </div>
          </div>
        </div>
      </div>
 
      {/* Diagnostic */}
      <div className="step4-diagnostic">
        <h3 className="step4-section-title">
          🔍 Pré-diagnostic
          {hasErrors && <span className="step4-badge error">{diagnostics.filter(d => d.type === 'error').length} erreur(s)</span>}
          {warnings.length > 0 && <span className="step4-badge warning">{warnings.length} avert.</span>}
          {!hasErrors && warnings.length === 0 && <span className="step4-badge success">OK</span>}
        </h3>
 
        {diagnostics.length === 0 ? (
          <div className="step4-diagnostic-empty">
            <span>✓</span>
            <p>Aucun problème détecté. Configuration prête pour la génération !</p>
          </div>
        ) : (
          <div className="step4-diagnostic-list">
            {/* Erreurs */}
            {diagnostics.filter(d => d.type === 'error').map(d => (
              <div key={d.code} className="step4-diagnostic-item error">
                <div className="step4-diagnostic-icon">❌</div>
                <div className="step4-diagnostic-content">
                  <span className="step4-diagnostic-message">{d.message}</span>
                  {d.details && <span className="step4-diagnostic-details">{d.details}</span>}
                </div>
              </div>
            ))}
 
            {/* Avertissements */}
            {warnings.map(d => {
              const isAccepted = config.acceptedWarnings.includes(d.code)
              return (
                <div key={d.code} className={`step4-diagnostic-item warning ${isAccepted ? 'accepted' : ''}`}>
                  <button
                    type="button"
                    className={`step4-diagnostic-checkbox ${isAccepted ? 'checked' : ''}`}
                    onClick={() => handleToggleWarning(d.code)}
                    title={isAccepted ? 'Retirer l\'acceptation' : 'Accepter cet avertissement'}
                  >
                    {isAccepted ? '✓' : ''}
                  </button>
                  <div className="step4-diagnostic-content">
                    <span className="step4-diagnostic-message">{d.message}</span>
                    {d.details && <span className="step4-diagnostic-details">{d.details}</span>}
                  </div>
                </div>
              )
            })}
 
            {/* Infos */}
            {infos.map(d => (
              <div key={d.code} className="step4-diagnostic-item info">
                <div className="step4-diagnostic-icon">ℹ️</div>
                <div className="step4-diagnostic-content">
                  <span className="step4-diagnostic-message">{d.message}</span>
                  {d.details && <span className="step4-diagnostic-details">{d.details}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
 
        {warnings.length > 0 && (
          <p className="step4-warning-hint">
            💡 Cochez les avertissements pour confirmer que vous les acceptez
          </p>
        )}
      </div>
 
      {/* Bouton de génération */}
      <div className="step4-generate">
        {generationError && (
          <div className="step4-error-banner">
            <span>⚠️</span>
            <span>{generationError}</span>
          </div>
        )}
 
        <button
          type="button"
          className="step4-generate-btn"
          disabled={hasErrors || isGenerating || (warnings.length > 0 && !warnings.every(w => config.acceptedWarnings.includes(w.code)))}
          onClick={handleGenerate}
        >
          {isGenerating ? (
            <>
              <span className="step4-spinner" />
              Génération en cours...
            </>
          ) : (
            <>
              🚀 Générer le planning
            </>
          )}
        </button>
 
        <p className="step4-generate-hint">
          La génération créera un planning optimisé basé sur vos contraintes.
          Vous pourrez le modifier manuellement avant de le publier.
        </p>
      </div>
 
      {/* Styles */}
      <style jsx>{`
        .step4-container {
          max-width: 700px;
          margin: 0 auto;
        }
 
        .step4-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
 
        .step4-icon {
          width: 56px;
          height: 56px;
          background: ${T.primaryLt};
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }
 
        .step4-title {
          font-size: 22px;
          font-weight: 700;
          color: ${T.text};
          margin: 0 0 4px 0;
        }
 
        .step4-subtitle {
          font-size: 14px;
          color: ${T.textSec};
          margin: 0;
        }
 
        /* Summary */
        .step4-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
 
        .step4-summary-card {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          padding: 16px;
        }
 
        .step4-summary-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid ${T.borderLt};
        }
 
        .step4-summary-header h3 {
          font-size: 14px;
          font-weight: 600;
          color: ${T.text};
          margin: 0;
        }
 
        .step4-summary-icon {
          font-size: 18px;
        }
 
        .step4-summary-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
 
        .step4-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
 
        .step4-summary-label {
          font-size: 12px;
          color: ${T.muted};
        }
 
        .step4-summary-value {
          font-size: 12px;
          font-weight: 600;
          color: ${T.text};
          text-align: right;
        }
 
        .step4-summary-roles {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 4px;
        }
 
        .step4-role-badge {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
 
        /* Diagnostic */
        .step4-diagnostic {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
 
        .step4-section-title {
          font-size: 15px;
          font-weight: 600;
          color: ${T.text};
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
 
        .step4-badge {
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
 
        .step4-badge.error {
          background: ${T.dangerLt};
          color: ${T.danger};
        }
 
        .step4-badge.warning {
          background: ${T.warningLt};
          color: ${T.warningDk};
        }
 
        .step4-badge.success {
          background: ${T.primaryLt};
          color: ${T.primaryDk};
        }
 
        .step4-diagnostic-empty {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px;
          background: ${T.primaryBg};
          border: 1px solid ${T.primaryLt};
          border-radius: 10px;
          color: ${T.primaryDk};
        }
 
        .step4-diagnostic-empty span {
          font-size: 24px;
        }
 
        .step4-diagnostic-empty p {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
        }
 
        .step4-diagnostic-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
 
        .step4-diagnostic-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
        }
 
        .step4-diagnostic-item.error {
          background: ${T.dangerBg};
          border: 1px solid ${T.dangerBd};
        }
 
        .step4-diagnostic-item.warning {
          background: ${T.warningBg};
          border: 1px solid ${T.warningBd};
        }
 
        .step4-diagnostic-item.warning.accepted {
          background: ${T.borderLt};
          border-color: ${T.border};
          opacity: 0.7;
        }
 
        .step4-diagnostic-item.info {
          background: ${T.infoBg};
          border: 1px solid ${T.infoLt};
        }
 
        .step4-diagnostic-icon {
          font-size: 16px;
          flex-shrink: 0;
          margin-top: 2px;
        }
 
        .step4-diagnostic-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid ${T.warningDk};
          border-radius: 4px;
          background: ${T.card};
          color: ${T.warningDk};
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
        }
 
        .step4-diagnostic-checkbox.checked {
          background: ${T.warningDk};
          color: white;
        }
 
        .step4-diagnostic-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
 
        .step4-diagnostic-message {
          font-size: 13px;
          font-weight: 600;
          color: ${T.text};
        }
 
        .step4-diagnostic-item.error .step4-diagnostic-message {
          color: ${T.dangerDk};
        }
 
        .step4-diagnostic-item.warning .step4-diagnostic-message {
          color: ${T.warningDk};
        }
 
        .step4-diagnostic-item.info .step4-diagnostic-message {
          color: ${T.infoDk};
        }
 
        .step4-diagnostic-details {
          font-size: 12px;
          color: ${T.textSec};
        }
 
        .step4-warning-hint {
          margin: 16px 0 0 0;
          padding: 10px 14px;
          background: ${T.warningBg};
          border-radius: 8px;
          font-size: 12px;
          color: ${T.warningDk};
        }
 
        /* Generate */
        .step4-generate {
          text-align: center;
        }
 
        .step4-error-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: ${T.dangerBg};
          border: 1px solid ${T.dangerBd};
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 14px;
          color: ${T.dangerDk};
        }
 
        .step4-generate-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 40px;
          background: ${T.primary};
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: ${T.shadowMd};
        }
 
        .step4-generate-btn:hover:not(:disabled) {
          background: ${T.primaryDk};
          transform: translateY(-1px);
          box-shadow: ${T.shadowLg};
        }
 
        .step4-generate-btn:disabled {
          background: ${T.border};
          color: ${T.muted};
          cursor: not-allowed;
          box-shadow: none;
        }
 
        .step4-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
 
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
 
        .step4-generate-hint {
          margin: 16px 0 0 0;
          font-size: 13px;
          color: ${T.muted};
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
 
        /* Responsive */
        @media (max-width: 700px) {
          .step4-summary {
            grid-template-columns: 1fr;
          }
        }
 
        @media (max-width: 500px) {
          .step4-generate-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
 
export default Step4Validation
