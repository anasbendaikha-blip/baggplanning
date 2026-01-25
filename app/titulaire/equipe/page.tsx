'use client'

import { useState } from 'react'
import {
  MOCK_EMPLOYEES,
  getEmployeesByRole,
  getRoleColor,
  getRoleIcon,
  getRoleLabel,
  EmployeeRole,
  MockEmployee,
} from '@/lib/mock-data'

// ============================================================
// 📁 app/titulaire/equipe/page.tsx
// ============================================================
// Page de gestion de l'équipe
// Liste des employés par catégorie avec détails
// ============================================================

const ROLES: EmployeeRole[] = ['Pharmacien', 'Preparateur', 'Apprenti', 'Etudiant', 'Conditionneur']

export default function EquipePage() {
  const [selectedRole, setSelectedRole] = useState<EmployeeRole | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrer les employés
  const filteredEmployees = MOCK_EMPLOYEES.filter(emp => {
    const matchesRole = selectedRole === 'all' || emp.fonction === selectedRole
    const matchesSearch = emp.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    return matchesRole && matchesSearch && emp.actif
  })

  // Grouper par rôle pour l'affichage
  const employeesByRole = ROLES.reduce((acc, role) => {
    acc[role] = filteredEmployees.filter(e => e.fonction === role)
    return acc
  }, {} as Record<EmployeeRole, MockEmployee[]>)

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            Gestion de l'équipe
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
            {MOCK_EMPLOYEES.filter(e => e.actif).length} employés actifs
          </p>
        </div>

        {/* Recherche */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              width: '200px',
            }}
          />
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ➕ Ajouter
          </button>
        </div>
      </div>

      {/* Filtres par rôle */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        <FilterButton
          active={selectedRole === 'all'}
          onClick={() => setSelectedRole('all')}
          label="Tous"
          count={MOCK_EMPLOYEES.filter(e => e.actif).length}
        />
        {ROLES.map(role => (
          <FilterButton
            key={role}
            active={selectedRole === role}
            onClick={() => setSelectedRole(role)}
            label={getRoleLabel(role)}
            count={getEmployeesByRole(role).length}
            color={getRoleColor(role)}
            icon={getRoleIcon(role)}
          />
        ))}
      </div>

      {/* Liste des employés par catégorie */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {ROLES.map(role => {
          const employees = employeesByRole[role]
          if (employees.length === 0) return null

          return (
            <div key={role}>
              {/* Header de section */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}>
                <span style={{ fontSize: '24px' }}>{getRoleIcon(role)}</span>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#1e293b',
                  margin: 0,
                }}>
                  {getRoleLabel(role)}s
                </h2>
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: getRoleColor(role) + '20',
                  color: getRoleColor(role),
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}>
                  {employees.length}
                </span>
              </div>

              {/* Grille d'employés */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}>
                {employees.map(employee => (
                  <EmployeeCard key={employee.id} employee={employee} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Message si aucun résultat */}
      {filteredEmployees.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}>
          <span style={{ fontSize: '48px' }}>🔍</span>
          <p style={{ color: '#64748b', marginTop: '16px' }}>
            Aucun employé trouvé pour cette recherche
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// COMPOSANTS
// ============================================================

function FilterButton({ 
  active, 
  onClick, 
  label, 
  count, 
  color, 
  icon 
}: { 
  active: boolean
  onClick: () => void
  label: string
  count: number
  color?: string
  icon?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: '8px',
        border: active ? 'none' : '1px solid #e2e8f0',
        backgroundColor: active ? (color || '#1e293b') : 'white',
        color: active ? 'white' : '#64748b',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        transition: 'all 0.2s',
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
      <span style={{
        padding: '2px 8px',
        backgroundColor: active ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
        borderRadius: '10px',
        fontSize: '12px',
      }}>
        {count}
      </span>
    </button>
  )
}

function EmployeeCard({ employee }: { employee: MockEmployee }) {
  const color = getRoleColor(employee.fonction)
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid #e2e8f0',
      transition: 'all 0.2s',
      cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Avatar */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '10px',
          backgroundColor: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '16px',
          flexShrink: 0,
        }}>
          {employee.initiales}
        </div>

        {/* Infos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ 
              fontSize: '15px', 
              fontWeight: '600', 
              color: '#1e293b',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {employee.prenom} {employee.nom || ''}
            </h3>
            {employee.typeEDT === 'variable' && (
              <span style={{
                padding: '2px 6px',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600',
              }}>
                Variable
              </span>
            )}
          </div>
          <p style={{ 
            fontSize: '13px', 
            color: '#64748b',
            margin: '4px 0 0 0',
          }}>
            {getRoleIcon(employee.fonction)} {getRoleLabel(employee.fonction)}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            backgroundColor: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            ✏️
          </button>
        </div>
      </div>

      {/* Horaires de la semaine (aperçu) */}
      <div style={{
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid #f1f5f9',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '4px',
        }}>
          {['L', 'M', 'M', 'J', 'V', 'S'].map((jour, index) => {
            const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const
            const horaire = employee.horaires[jours[index]]
            const isWorking = horaire !== 'non' && horaire !== 'variable'
            const isConge = horaire === 'congé'
            const isVariable = horaire === 'variable'

            return (
              <div
                key={index}
                style={{
                  textAlign: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: isConge 
                    ? '#fef2f2' 
                    : isWorking 
                      ? color + '15' 
                      : isVariable 
                        ? '#fef3c7' 
                        : '#f8fafc',
                }}
              >
                <p style={{ 
                  fontSize: '10px', 
                  color: '#94a3b8', 
                  margin: 0,
                  fontWeight: '600',
                }}>
                  {jour}
                </p>
                <p style={{ 
                  fontSize: '9px', 
                  color: isConge ? '#ef4444' : isWorking ? color : '#94a3b8', 
                  margin: '2px 0 0 0',
                  fontWeight: isWorking ? '500' : '400',
                }}>
                  {isConge ? 'C' : isWorking ? '✓' : isVariable ? '?' : '—'}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
