// ============================================================
// 📁 app/titulaire/assistant-planning/components/Step3Employes.tsx
// ============================================================
// Étape 3 : Configuration des contraintes employés
// ============================================================
 
'use client'
 
import { useState, useEffect, useMemo, useCallback } from 'react'
import { T, ROLE_PALETTE } from '@/lib/ui-tokens'
import {
  MOCK_EMPLOYEES,
  type MockEmployee,
  type EmployeeRole,
  ROLE_ICONS,
  ROLE_LABELS
} from '@/lib/mock-data'
import { JOURS_SEMAINE } from '@/lib/assistant-planning/templates'
 
// ============================================================
// Types
// ============================================================
 
export interface ContrainteEmploye {
  employeId: string
  employeNom: string
  employeInitiales: string
  role: EmployeeRole
  heuresMin: number
  heuresMax: number
  joursReposHebdo: number[]  // Index des jours (0=Lun, ..., 6=Dim)
  priorite: 'haute' | 'normale' | 'basse'
  actif: boolean  // Inclure dans la génération
}
 
export interface EmployesConfig {
  contraintes: ContrainteEmploye[]
  filtreRole: EmployeeRole | 'all'
}
 
interface Step3EmployesProps {
  config: EmployesConfig
  onChange: (config: EmployesConfig) => void
  onValidChange: (isValid: boolean) => void
}
 
// ============================================================
// Helpers
// ============================================================
 
const getDefaultHeuresForRole = (role: EmployeeRole): { min: number; max: number } => {
  switch (role) {
    case 'Pharmacien':
      return { min: 20, max: 44 }
    case 'Preparateur':
      return { min: 20, max: 44 }
    case 'Apprenti':
      return { min: 16, max: 35 }
    case 'Etudiant':
      return { min: 4, max: 20 }
    case 'Conditionneur':
      return { min: 20, max: 40 }
    default:
      return { min: 0, max: 35 }
  }
}
 
const createContrainteFromEmployee = (emp: MockEmployee): ContrainteEmploye => {
  const heures = getDefaultHeuresForRole(emp.fonction)
  return {
    employeId: emp.id,
    employeNom: emp.prenom + (emp.nom ? ` ${emp.nom}` : ''),
    employeInitiales: emp.initiales,
    role: emp.fonction,
    heuresMin: heures.min,
    heuresMax: heures.max,
    joursReposHebdo: [6], // Dimanche par défaut
    priorite: 'normale',
    actif: true
  }
}
 
export const getDefaultEmployesConfig = (): EmployesConfig => ({
  contraintes: MOCK_EMPLOYEES
    .filter(emp => emp.actif)
    .map(createContrainteFromEmployee),
  filtreRole: 'all'
})
 
// ============================================================
// Composant Principal
// ============================================================
 
export function Step3Employes({ config, onChange, onValidChange }: Step3EmployesProps) {
  // ============================================================
  // État local
  // ============================================================
  const [expandedEmploye, setExpandedEmploye] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [errors, setErrors] = useState<string[]>([])
 
  // ============================================================
  // Filtrage des employés
  // ============================================================
  const filteredContraintes = useMemo(() => {
    return config.contraintes.filter(c => {
      // Filtre par rôle
      if (config.filtreRole !== 'all' && c.role !== config.filtreRole) {
        return false
      }
      // Filtre par recherche
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        return (
          c.employeNom.toLowerCase().includes(search) ||
          c.employeInitiales.toLowerCase().includes(search) ||
          c.role.toLowerCase().includes(search)
        )
      }
      return true
    })
  }, [config.contraintes, config.filtreRole, searchTerm])
 
  // ============================================================
  // Statistiques
  // ============================================================
  const stats = useMemo(() => {
    const actifs = config.contraintes.filter(c => c.actif)
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
      total: config.contraintes.length,
      actifs: actifs.length,
      byRole,
      totalHeuresMin,
      totalHeuresMax
    }
  }, [config.contraintes])
 
  // ============================================================
  // Validation
  // ============================================================
  useEffect(() => {
    const newErrors: string[] = []
 
    // Vérifier qu'au moins un employé est actif
    const actifsCount = config.contraintes.filter(c => c.actif).length
    if (actifsCount === 0) {
      newErrors.push('Sélectionnez au moins un employé')
    }
 
    // Vérifier qu'il y a au moins un pharmacien actif
    const pharmaciensActifs = config.contraintes.filter(c => c.actif && c.role === 'Pharmacien').length
    if (pharmaciensActifs === 0) {
      newErrors.push('Au moins un pharmacien doit être actif (obligation légale)')
    }
 
    // Vérifier les heures min/max
    config.contraintes.forEach(c => {
      if (c.heuresMin > c.heuresMax) {
        newErrors.push(`${c.employeNom}: heures min (${c.heuresMin}) > max (${c.heuresMax})`)
      }
      if (c.heuresMax > 48) {
        newErrors.push(`${c.employeNom}: heures max (${c.heuresMax}) dépasse 48h légales`)
      }
    })
 
    setErrors(newErrors)
    onValidChange(newErrors.length === 0)
  }, [config, onValidChange])
 
  // ============================================================
  // Handlers
  // ============================================================
  const handleToggleActif = useCallback((employeId: string) => {
    onChange({
      ...config,
      contraintes: config.contraintes.map(c =>
        c.employeId === employeId ? { ...c, actif: !c.actif } : c
      )
    })
  }, [config, onChange])
 
  const handleUpdateContrainte = useCallback((employeId: string, updates: Partial<ContrainteEmploye>) => {
    onChange({
      ...config,
      contraintes: config.contraintes.map(c =>
        c.employeId === employeId ? { ...c, ...updates } : c
      )
    })
  }, [config, onChange])
 
  const handleToggleJourRepos = useCallback((employeId: string, jourIndex: number) => {
    const contrainte = config.contraintes.find(c => c.employeId === employeId)
    if (!contrainte) return
 
    const newJours = contrainte.joursReposHebdo.includes(jourIndex)
      ? contrainte.joursReposHebdo.filter(j => j !== jourIndex)
      : [...contrainte.joursReposHebdo, jourIndex].sort((a, b) => a - b)
 
    handleUpdateContrainte(employeId, { joursReposHebdo: newJours })
  }, [config.contraintes, handleUpdateContrainte])
 
  const handleFiltreRole = useCallback((role: EmployeeRole | 'all') => {
    onChange({ ...config, filtreRole: role })
  }, [config, onChange])
 
  const handleSelectAll = useCallback((actif: boolean) => {
    onChange({
      ...config,
      contraintes: config.contraintes.map(c => {
        // Appliquer uniquement aux éléments filtrés
        if (config.filtreRole !== 'all' && c.role !== config.filtreRole) {
          return c
        }
        if (searchTerm) {
          const search = searchTerm.toLowerCase()
          if (!c.employeNom.toLowerCase().includes(search) &&
              !c.employeInitiales.toLowerCase().includes(search)) {
            return c
          }
        }
        return { ...c, actif }
      })
    })
  }, [config, onChange, searchTerm])
 
  // ============================================================
  // Rendu
  // ============================================================
  return (
    <div className="step3-container">
      {/* En-tête */}
      <div className="step3-header">
        <div className="step3-icon">👥</div>
        <div>
          <h2 className="step3-title">Contraintes employés</h2>
          <p className="step3-subtitle">Configurez les heures et jours de repos par employé</p>
        </div>
      </div>
 
      {/* Statistiques rapides */}
      <div className="step3-stats">
        <div className="step3-stat">
          <span className="step3-stat-value">{stats.actifs}</span>
          <span className="step3-stat-label">/{stats.total} actifs</span>
        </div>
        <div className="step3-stat">
          <span className="step3-stat-value">{stats.byRole.Pharmacien}</span>
          <span className="step3-stat-label">pharmaciens</span>
        </div>
        <div className="step3-stat">
          <span className="step3-stat-value">{stats.totalHeuresMin}-{stats.totalHeuresMax}h</span>
          <span className="step3-stat-label">capacité/sem</span>
        </div>
      </div>
 
      {/* Filtres */}
      <div className="step3-filters">
        <div className="step3-search">
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="step3-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="step3-search-clear"
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>
 
        <div className="step3-role-filters">
          <button
            type="button"
            className={`step3-role-btn ${config.filtreRole === 'all' ? 'active' : ''}`}
            onClick={() => handleFiltreRole('all')}
          >
            Tous
          </button>
          {(['Pharmacien', 'Preparateur', 'Apprenti', 'Etudiant', 'Conditionneur'] as EmployeeRole[]).map(role => (
            <button
              key={role}
              type="button"
              className={`step3-role-btn ${config.filtreRole === role ? 'active' : ''}`}
              style={{
                '--role-color': ROLE_PALETTE[role]?.bg || T.border
              } as React.CSSProperties}
              onClick={() => handleFiltreRole(role)}
            >
              {ROLE_ICONS[role]} {stats.byRole[role]}
            </button>
          ))}
        </div>
 
        <div className="step3-bulk-actions">
          <button
            type="button"
            className="step3-bulk-btn"
            onClick={() => handleSelectAll(true)}
          >
            ✓ Tout activer
          </button>
          <button
            type="button"
            className="step3-bulk-btn"
            onClick={() => handleSelectAll(false)}
          >
            ✗ Tout désactiver
          </button>
        </div>
      </div>
 
      {/* Liste des employés */}
      <div className="step3-section">
        <div className="step3-section-header">
          <h3 className="step3-section-title">
            Employés ({filteredContraintes.length})
          </h3>
        </div>
 
        {filteredContraintes.length === 0 ? (
          <div className="step3-empty">
            <p>Aucun employé trouvé</p>
          </div>
        ) : (
          <div className="step3-employes-list">
            {filteredContraintes.map(contrainte => {
              const isExpanded = expandedEmploye === contrainte.employeId
              const roleColor = ROLE_PALETTE[contrainte.role]?.bg || T.border
 
              return (
                <div
                  key={contrainte.employeId}
                  className={`step3-employe ${isExpanded ? 'expanded' : ''} ${!contrainte.actif ? 'inactive' : ''}`}
                >
                  {/* Header de l'employé */}
                  <div className="step3-employe-header">
                    {/* Toggle actif */}
                    <button
                      type="button"
                      className={`step3-toggle ${contrainte.actif ? 'active' : ''}`}
                      onClick={() => handleToggleActif(contrainte.employeId)}
                      title={contrainte.actif ? 'Désactiver' : 'Activer'}
                    >
                      <span className="step3-toggle-track">
                        <span className="step3-toggle-thumb" />
                      </span>
                    </button>
 
                    {/* Info employé */}
                    <div
                      className="step3-employe-info"
                      onClick={() => setExpandedEmploye(isExpanded ? null : contrainte.employeId)}
                    >
                      <div
                        className="step3-employe-avatar"
                        style={{ backgroundColor: roleColor }}
                      >
                        {contrainte.employeInitiales}
                      </div>
                      <div className="step3-employe-details">
                        <span className="step3-employe-name">{contrainte.employeNom}</span>
                        <span className="step3-employe-role">
                          {ROLE_ICONS[contrainte.role]} {ROLE_LABELS[contrainte.role]}
                        </span>
                      </div>
                    </div>
 
                    {/* Résumé */}
                    <div className="step3-employe-summary">
                      <span className="step3-employe-hours">
                        {contrainte.heuresMin}-{contrainte.heuresMax}h/sem
                      </span>
                      <span className="step3-employe-chevron">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
 
                  {/* Contenu étendu */}
                  {isExpanded && (
                    <div className="step3-employe-content">
                      {/* Heures hebdomadaires */}
                      <div className="step3-field-row">
                        <div className="step3-field">
                          <label>Heures min/semaine</label>
                          <input
                            type="number"
                            min="0"
                            max="48"
                            value={contrainte.heuresMin}
                            onChange={(e) => handleUpdateContrainte(contrainte.employeId, {
                              heuresMin: parseInt(e.target.value) || 0
                            })}
                            className="step3-input"
                          />
                        </div>
                        <div className="step3-field">
                          <label>Heures max/semaine</label>
                          <input
                            type="number"
                            min="0"
                            max="48"
                            value={contrainte.heuresMax}
                            onChange={(e) => handleUpdateContrainte(contrainte.employeId, {
                              heuresMax: parseInt(e.target.value) || 0
                            })}
                            className="step3-input"
                          />
                        </div>
                      </div>
 
                      {/* Jours de repos */}
                      <div className="step3-field">
                        <label>Jours de repos fixes</label>
                        <div className="step3-days-grid">
                          {JOURS_SEMAINE.map((jour, idx) => (
                            <button
                              key={jour}
                              type="button"
                              className={`step3-day-btn ${contrainte.joursReposHebdo.includes(idx) ? 'active' : ''}`}
                              onClick={() => handleToggleJourRepos(contrainte.employeId, idx)}
                            >
                              {jour}
                            </button>
                          ))}
                        </div>
                        <p className="step3-field-hint">
                          Jours où l&apos;employé ne travaille jamais
                        </p>
                      </div>
 
                      {/* Priorité */}
                      <div className="step3-field">
                        <label>Priorité d&apos;affectation</label>
                        <div className="step3-priority-btns">
                          {(['haute', 'normale', 'basse'] as const).map(p => (
                            <button
                              key={p}
                              type="button"
                              className={`step3-priority-btn ${contrainte.priorite === p ? 'active' : ''} ${p}`}
                              onClick={() => handleUpdateContrainte(contrainte.employeId, { priorite: p })}
                            >
                              {p === 'haute' ? '🔥' : p === 'normale' ? '➖' : '🔽'} {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                          ))}
                        </div>
                        <p className="step3-field-hint">
                          Les employés à priorité haute seront affectés en premier
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
 
      {/* Erreurs globales */}
      {errors.length > 0 && (
        <div className="step3-alert error">
          {errors.slice(0, 3).map((err, i) => (
            <div key={i} className="step3-alert-item">
              <span>⚠️</span>
              <span>{err}</span>
            </div>
          ))}
          {errors.length > 3 && (
            <div className="step3-alert-more">
              +{errors.length - 3} autre{errors.length - 3 > 1 ? 's' : ''} erreur{errors.length - 3 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
 
      {/* Styles */}
      <style jsx>{`
        .step3-container {
          max-width: 700px;
          margin: 0 auto;
        }
 
        .step3-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
 
        .step3-icon {
          width: 56px;
          height: 56px;
          background: ${T.primaryLt};
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }
 
        .step3-title {
          font-size: 22px;
          font-weight: 700;
          color: ${T.text};
          margin: 0 0 4px 0;
        }
 
        .step3-subtitle {
          font-size: 14px;
          color: ${T.textSec};
          margin: 0;
        }
 
        /* Stats */
        .step3-stats {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          margin-bottom: 16px;
        }
 
        .step3-stat {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
 
        .step3-stat-value {
          font-size: 18px;
          font-weight: 700;
          color: ${T.info};
        }
 
        .step3-stat-label {
          font-size: 12px;
          color: ${T.muted};
        }
 
        /* Filters */
        .step3-filters {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }
 
        .step3-search {
          position: relative;
        }
 
        .step3-search-input {
          width: 100%;
          padding: 10px 36px 10px 14px;
          border: 1px solid ${T.border};
          border-radius: 8px;
          font-size: 14px;
          color: ${T.text};
          background: ${T.card};
        }
 
        .step3-search-input:focus {
          outline: none;
          border-color: ${T.info};
          box-shadow: 0 0 0 3px ${T.infoLt};
        }
 
        .step3-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          border: none;
          background: ${T.border};
          border-radius: 50%;
          color: ${T.textSec};
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
        }
 
        .step3-role-filters {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
 
        .step3-role-btn {
          padding: 6px 12px;
          background: ${T.borderLt};
          border: 1px solid ${T.border};
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: ${T.textSec};
          cursor: pointer;
          transition: all 0.15s;
        }
 
        .step3-role-btn:hover {
          background: ${T.border};
        }
 
        .step3-role-btn.active {
          background: var(--role-color, ${T.info});
          border-color: var(--role-color, ${T.info});
          color: white;
        }
 
        .step3-bulk-actions {
          display: flex;
          gap: 8px;
        }
 
        .step3-bulk-btn {
          padding: 6px 12px;
          background: transparent;
          border: 1px dashed ${T.border};
          border-radius: 6px;
          font-size: 11px;
          color: ${T.muted};
          cursor: pointer;
          transition: all 0.15s;
        }
 
        .step3-bulk-btn:hover {
          border-style: solid;
          background: ${T.borderLt};
          color: ${T.textSec};
        }
 
        /* Section */
        .step3-section {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }
 
        .step3-section-header {
          margin-bottom: 12px;
        }
 
        .step3-section-title {
          font-size: 14px;
          font-weight: 600;
          color: ${T.text};
          margin: 0;
        }
 
        /* Empty */
        .step3-empty {
          padding: 32px;
          text-align: center;
          color: ${T.muted};
        }
 
        /* Employes list */
        .step3-employes-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
 
        .step3-employe {
          background: ${T.borderLt};
          border: 1px solid ${T.border};
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.15s;
        }
 
        .step3-employe.inactive {
          opacity: 0.6;
        }
 
        .step3-employe.expanded {
          background: ${T.card};
          box-shadow: ${T.shadow};
        }
 
        .step3-employe-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
        }
 
        /* Toggle switch */
        .step3-toggle {
          flex-shrink: 0;
          width: 40px;
          height: 22px;
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
        }
 
        .step3-toggle-track {
          display: block;
          width: 100%;
          height: 100%;
          background: ${T.border};
          border-radius: 11px;
          position: relative;
          transition: background 0.2s;
        }
 
        .step3-toggle.active .step3-toggle-track {
          background: ${T.primary};
        }
 
        .step3-toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
 
        .step3-toggle.active .step3-toggle-thumb {
          transform: translateX(18px);
        }
 
        /* Employee info */
        .step3-employe-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
 
        .step3-employe-avatar {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: white;
        }
 
        .step3-employe-details {
          display: flex;
          flex-direction: column;
        }
 
        .step3-employe-name {
          font-size: 14px;
          font-weight: 600;
          color: ${T.text};
        }
 
        .step3-employe-role {
          font-size: 11px;
          color: ${T.muted};
        }
 
        .step3-employe-summary {
          display: flex;
          align-items: center;
          gap: 12px;
        }
 
        .step3-employe-hours {
          font-size: 12px;
          color: ${T.textSec};
          background: ${T.card};
          padding: 4px 8px;
          border-radius: 6px;
        }
 
        .step3-employe-chevron {
          font-size: 10px;
          color: ${T.muted};
          cursor: pointer;
        }
 
        /* Employe content */
        .step3-employe-content {
          padding: 16px;
          border-top: 1px solid ${T.border};
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
 
        .step3-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
 
        .step3-field label {
          font-size: 11px;
          font-weight: 600;
          color: ${T.textSec};
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
 
        .step3-field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
 
        .step3-input {
          padding: 10px 12px;
          border: 1px solid ${T.border};
          border-radius: 8px;
          font-size: 14px;
          color: ${T.text};
          background: ${T.borderLt};
        }
 
        .step3-input:focus {
          outline: none;
          border-color: ${T.info};
          background: ${T.card};
        }
 
        .step3-field-hint {
          font-size: 11px;
          color: ${T.muted};
          margin: 0;
        }
 
        /* Days grid */
        .step3-days-grid {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
 
        .step3-day-btn {
          padding: 6px 10px;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: ${T.textSec};
          cursor: pointer;
          transition: all 0.15s;
        }
 
        .step3-day-btn:hover {
          border-color: ${T.borderMd};
        }
 
        .step3-day-btn.active {
          background: ${T.dangerLt};
          border-color: ${T.dangerBd};
          color: ${T.danger};
        }
 
        /* Priority buttons */
        .step3-priority-btns {
          display: flex;
          gap: 8px;
        }
 
        .step3-priority-btn {
          flex: 1;
          padding: 8px 12px;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          color: ${T.textSec};
          cursor: pointer;
          transition: all 0.15s;
        }
 
        .step3-priority-btn:hover {
          background: ${T.borderLt};
        }
 
        .step3-priority-btn.active.haute {
          background: ${T.dangerLt};
          border-color: ${T.danger};
          color: ${T.danger};
        }
 
        .step3-priority-btn.active.normale {
          background: ${T.infoLt};
          border-color: ${T.info};
          color: ${T.info};
        }
 
        .step3-priority-btn.active.basse {
          background: ${T.borderLt};
          border-color: ${T.borderMd};
          color: ${T.textSec};
        }
 
        /* Alert */
        .step3-alert {
          padding: 14px 16px;
          border-radius: 10px;
        }
 
        .step3-alert.error {
          background: ${T.dangerBg};
          border: 1px solid ${T.dangerBd};
        }
 
        .step3-alert-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          color: ${T.dangerDk};
        }
 
        .step3-alert-item + .step3-alert-item {
          margin-top: 6px;
        }
 
        .step3-alert-more {
          margin-top: 8px;
          font-size: 12px;
          color: ${T.danger};
        }
 
        @media (max-width: 500px) {
          .step3-stats {
            flex-wrap: wrap;
          }
 
          .step3-role-filters {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 4px;
          }
 
          .step3-field-row {
            grid-template-columns: 1fr;
          }
 
          .step3-priority-btns {
            flex-direction: column;
          }
 
          .step3-employe-summary {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
 
export default Step3Employes