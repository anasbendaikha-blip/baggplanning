'use client'

import { useEffect, useState } from 'react'
import { getEmployees, getEmployeesByRole } from '@/lib/api/employees'
import { createRequest, getPendingRequests, deleteRequest } from '@/lib/api/requests'
import { getAvailabilityStats, getCurrentWeekStart } from '@/lib/api/availabilities'

// ============================================================
// PAGE DE TEST SUPABASE
// ============================================================
// Cette page permet de valider que toutes les opérations
// CRUD fonctionnent correctement avec Supabase
// ============================================================

export default function TestSupabasePage() {
  const [logs, setLogs] = useState<string[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [testRequestId, setTestRequestId] = useState<string | null>(null)

  // Ajouter un log
  const addLog = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${prefix} ${message}`])
  }

  // Test 1: Lire les employés
  const testReadEmployees = async () => {
    try {
      addLog('Test lecture employés...', 'info')
      const data = await getEmployees()
      setEmployees(data)
      addLog(`Lecture OK: ${data.length} employés trouvés`, 'success')
      return data
    } catch (err: any) {
      addLog(`Lecture employés: ${err.message}`, 'error')
      return []
    }
  }

  // Test 2: Lire les employés par rôle
  const testReadByRole = async () => {
    try {
      addLog('Test lecture étudiants...', 'info')
      const etudiants = await getEmployeesByRole('Etudiant')
      addLog(`Lecture OK: ${etudiants.length} étudiants trouvés`, 'success')
      
      addLog('Test lecture pharmaciens...', 'info')
      const pharmaciens = await getEmployeesByRole('Pharmacien')
      addLog(`Lecture OK: ${pharmaciens.length} pharmaciens trouvés`, 'success')
    } catch (err: any) {
      addLog(`Lecture par rôle: ${err.message}`, 'error')
    }
  }

  // Test 3: Créer une demande
  const testCreateRequest = async (employeeId: string) => {
    try {
      addLog('Test création demande (congé)...', 'info')
      
      const newRequest = await createRequest({
        employee_id: employeeId,
        type: 'conge',
        date: '2026-02-15',
        motif: '🧪 Test automatique - ' + new Date().toISOString(),
        is_urgent: false,
      })
      
      setTestRequestId(newRequest.id)
      addLog(`Création OK: demande ${newRequest.id.slice(0, 8)}...`, 'success')
      return newRequest
    } catch (err: any) {
      addLog(`Création demande: ${err.message}`, 'error')
      return null
    }
  }

  // Test 4: Lire les demandes
  const testReadRequests = async () => {
    try {
      addLog('Test lecture demandes en attente...', 'info')
      const data = await getPendingRequests()
      setRequests(data)
      addLog(`Lecture OK: ${data.length} demandes en attente`, 'success')
    } catch (err: any) {
      addLog(`Lecture demandes: ${err.message}`, 'error')
    }
  }

  // Test 5: Supprimer la demande de test
  const testDeleteRequest = async () => {
    if (!testRequestId) {
      addLog('Pas de demande de test à supprimer', 'info')
      return
    }
    
    try {
      addLog('Test suppression demande...', 'info')
      await deleteRequest(testRequestId)
      setTestRequestId(null)
      addLog('Suppression OK', 'success')
      
      // Rafraîchir la liste
      await testReadRequests()
    } catch (err: any) {
      addLog(`Suppression demande: ${err.message}`, 'error')
    }
  }

  // Test 6: Stats disponibilités
  const testAvailabilityStats = async () => {
    try {
      addLog('Test stats disponibilités...', 'info')
      const weekStart = getCurrentWeekStart()
      addLog(`Semaine: ${weekStart}`, 'info')
      
      const statsData = await getAvailabilityStats(weekStart)
      setStats(statsData)
      addLog(`Stats OK: ${statsData.submitted}/${statsData.total_students} réponses (${statsData.rate}%)`, 'success')
    } catch (err: any) {
      addLog(`Stats disponibilités: ${err.message}`, 'error')
    }
  }

  // Lancer tous les tests
  const runAllTests = async () => {
    setIsLoading(true)
    setLogs([])
    addLog('=== DÉBUT DES TESTS SUPABASE ===', 'info')

    // Test 1: Lecture employés
    const emps = await testReadEmployees()

    // Test 2: Lecture par rôle
    await testReadByRole()

    // Test 3: Création demande (si on a des employés)
    if (emps.length > 0) {
      await testCreateRequest(emps[0].id)
    } else {
      addLog('Pas d\'employés pour tester la création', 'error')
    }

    // Test 4: Lecture demandes
    await testReadRequests()

    // Test 5: Stats disponibilités
    await testAvailabilityStats()

    addLog('=== FIN DES TESTS ===', 'info')
    setIsLoading(false)
  }

  // Lancer les tests au chargement
  useEffect(() => {
    runAllTests()
  }, [])

  return (
    <div style={{ 
      padding: '24px', 
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#1e293b'
      }}>
        🧪 Test Supabase - BaggPlanning
      </h1>
      
      <p style={{ color: '#64748b', marginBottom: '24px' }}>
        Cette page valide que toutes les opérations CRUD fonctionnent correctement.
      </p>

      {/* Boutons d'action */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={runAllTests}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            fontWeight: '600'
          }}
        >
          {isLoading ? '⏳ Tests en cours...' : '🔄 Relancer tous les tests'}
        </button>

        {testRequestId && (
          <button
            onClick={testDeleteRequest}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🗑️ Supprimer la demande de test
          </button>
        )}
      </div>

      {/* Grille de résultats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        
        {/* Card: Logs */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '16px',
          color: '#e2e8f0'
        }}>
          <h2 style={{ fontSize: '16px', marginBottom: '12px', color: '#94a3b8' }}>
            📋 Logs des tests
          </h2>
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: '12px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
            ))}
            {logs.length === 0 && <div style={{ color: '#64748b' }}>Aucun log</div>}
          </div>
        </div>

        {/* Card: Employés */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ fontSize: '16px', marginBottom: '12px', color: '#1e293b' }}>
            👥 Employés ({employees.length})
          </h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {employees.slice(0, 10).map((emp) => (
              <div 
                key={emp.id} 
                style={{ 
                  padding: '8px',
                  marginBottom: '4px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              >
                <strong>{emp.initiales}</strong> - {emp.prenom} {emp.nom || ''} 
                <span style={{ 
                  marginLeft: '8px',
                  padding: '2px 8px',
                  backgroundColor: getRoleColor(emp.role),
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '11px'
                }}>
                  {emp.role}
                </span>
              </div>
            ))}
            {employees.length > 10 && (
              <div style={{ color: '#64748b', fontSize: '12px', marginTop: '8px' }}>
                ... et {employees.length - 10} autres
              </div>
            )}
            {employees.length === 0 && (
              <div style={{ color: '#ef4444' }}>Aucun employé trouvé</div>
            )}
          </div>
        </div>

        {/* Card: Demandes */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ fontSize: '16px', marginBottom: '12px', color: '#1e293b' }}>
            📋 Demandes en attente ({requests.length})
          </h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {requests.map((req) => (
              <div 
                key={req.id} 
                style={{ 
                  padding: '8px',
                  marginBottom: '4px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              >
                <strong>{req.type}</strong> - {req.date}
                {req.motif && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    {req.motif.slice(0, 50)}...
                  </div>
                )}
              </div>
            ))}
            {requests.length === 0 && (
              <div style={{ color: '#64748b' }}>Aucune demande en attente</div>
            )}
          </div>
        </div>

        {/* Card: Stats */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ fontSize: '16px', marginBottom: '12px', color: '#1e293b' }}>
            📊 Stats Disponibilités
          </h2>
          {stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <StatBox label="Total étudiants" value={stats.total_students} color="#3b82f6" />
              <StatBox label="Ont répondu" value={stats.submitted} color="#10b981" />
              <StatBox label="En attente" value={stats.pending} color="#f59e0b" />
              <StatBox label="Taux" value={`${stats.rate}%`} color="#8b5cf6" />
            </div>
          ) : (
            <div style={{ color: '#64748b' }}>Chargement...</div>
          )}
        </div>
      </div>

      {/* Résumé */}
      <div style={{
        backgroundColor: logs.some(l => l.includes('❌')) ? '#fef2f2' : '#f0fdf4',
        border: `1px solid ${logs.some(l => l.includes('❌')) ? '#fecaca' : '#bbf7d0'}`,
        borderRadius: '12px',
        padding: '16px'
      }}>
        <h2 style={{ 
          fontSize: '16px', 
          marginBottom: '8px',
          color: logs.some(l => l.includes('❌')) ? '#dc2626' : '#16a34a'
        }}>
          {logs.some(l => l.includes('❌')) 
            ? '⚠️ Certains tests ont échoué' 
            : '✅ Tous les tests sont passés !'}
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          {logs.some(l => l.includes('❌')) 
            ? 'Vérifie les logs ci-dessus pour identifier les problèmes.'
            : 'Ta connexion Supabase fonctionne parfaitement. Tu peux passer à la suite !'}
        </p>
      </div>
    </div>
  )
}

// Composant StatBox
function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      padding: '12px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#64748b' }}>{label}</div>
    </div>
  )
}

// Couleur par rôle
function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    Pharmacien: '#10b981',
    Preparateur: '#3b82f6',
    Apprenti: '#8b5cf6',
    Etudiant: '#f59e0b',
    Conditionneur: '#6366f1',
  }
  return colors[role] || '#64748b'
}