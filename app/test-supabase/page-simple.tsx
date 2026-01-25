'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

// ============================================================
// PAGE DE TEST SUPABASE - VERSION SIMPLIFIÉE
// ============================================================
// Cette page teste directement Supabase sans dépendre des
// fichiers lib/api/* (pour isoler les problèmes)
// ============================================================

export default function TestSupabasePage() {
  const [logs, setLogs] = useState<string[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [testRequestId, setTestRequestId] = useState<string | null>(null)

  const supabase = createClient()

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
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('actif', true)
        .order('role')
        .order('prenom')

      if (error) throw error

      setEmployees(data || [])
      addLog(`Lecture OK: ${data?.length || 0} employés trouvés`, 'success')
      return data || []
    } catch (err: any) {
      addLog(`Lecture employés: ${err.message}`, 'error')
      return []
    }
  }

  // Test 2: Lire les étudiants
  const testReadEtudiants = async () => {
    try {
      addLog('Test lecture étudiants...', 'info')
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('role', 'Etudiant')
        .eq('actif', true)

      if (error) throw error

      addLog(`Lecture OK: ${data?.length || 0} étudiants trouvés`, 'success')
    } catch (err: any) {
      addLog(`Lecture étudiants: ${err.message}`, 'error')
    }
  }

  // Test 3: Lire les pharmaciens
  const testReadPharmaciens = async () => {
    try {
      addLog('Test lecture pharmaciens...', 'info')
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('role', 'Pharmacien')
        .eq('actif', true)

      if (error) throw error

      addLog(`Lecture OK: ${data?.length || 0} pharmaciens trouvés`, 'success')
    } catch (err: any) {
      addLog(`Lecture pharmaciens: ${err.message}`, 'error')
    }
  }

  // Test 4: Créer une demande
  const testCreateRequest = async (employeeId: string) => {
    try {
      addLog('Test création demande (congé)...', 'info')
      
      const { data, error } = await supabase
        .from('requests')
        .insert({
          employee_id: employeeId,
          type: 'conge',
          date: '2026-02-15',
          motif: '🧪 Test automatique - ' + new Date().toISOString(),
          is_urgent: false,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      setTestRequestId(data.id)
      addLog(`Création OK: demande ${data.id.slice(0, 8)}...`, 'success')
      return data
    } catch (err: any) {
      addLog(`Création demande: ${err.message}`, 'error')
      return null
    }
  }

  // Test 5: Lire les demandes
  const testReadRequests = async () => {
    try {
      addLog('Test lecture demandes...', 'info')
      
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      setRequests(data || [])
      addLog(`Lecture OK: ${data?.length || 0} demandes en attente`, 'success')
    } catch (err: any) {
      addLog(`Lecture demandes: ${err.message}`, 'error')
    }
  }

  // Test 6: Supprimer la demande de test
  const testDeleteRequest = async () => {
    if (!testRequestId) {
      addLog('Pas de demande de test à supprimer', 'info')
      return
    }
    
    try {
      addLog('Test suppression demande...', 'info')
      
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', testRequestId)

      if (error) throw error

      setTestRequestId(null)
      addLog('Suppression OK', 'success')
      
      // Rafraîchir la liste
      await testReadRequests()
    } catch (err: any) {
      addLog(`Suppression demande: ${err.message}`, 'error')
    }
  }

  // Test 7: Stats disponibilités
  const testAvailabilityStats = async () => {
    try {
      addLog('Test stats disponibilités...', 'info')
      
      // Compter les étudiants
      const { count: totalStudents, error: countError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'Etudiant')
        .eq('actif', true)

      if (countError) throw countError

      // Calculer le lundi de cette semaine
      const now = new Date()
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(now.setDate(diff))
      const weekStart = monday.toISOString().split('T')[0]

      addLog(`Semaine: ${weekStart}`, 'info')

      // Compter les soumissions
      const { data: availData, error: availError } = await supabase
        .from('availabilities')
        .select('employee_id')
        .eq('week_start', weekStart)

      if (availError) throw availError

      const uniqueSubmitted = new Set(availData?.map(d => d.employee_id)).size
      const total = totalStudents || 0
      const rate = total > 0 ? Math.round((uniqueSubmitted / total) * 100) : 0

      addLog(`Stats OK: ${uniqueSubmitted}/${total} réponses (${rate}%)`, 'success')
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

    // Test 2: Lecture étudiants
    await testReadEtudiants()

    // Test 3: Lecture pharmaciens
    await testReadPharmaciens()

    // Test 4: Création demande (si on a des employés)
    if (emps.length > 0) {
      await testCreateRequest(emps[0].id)
    } else {
      addLog('Pas d\'employés pour tester la création', 'error')
    }

    // Test 5: Lecture demandes
    await testReadRequests()

    // Test 6: Stats disponibilités
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
        Cette page teste directement Supabase (sans passer par lib/api).
      </p>

      {/* Boutons d'action */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        
        {/* Card: Logs */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '16px',
          color: '#e2e8f0',
          gridColumn: 'span 2'
        }}>
          <h2 style={{ fontSize: '16px', marginBottom: '12px', color: '#94a3b8' }}>
            📋 Logs des tests
          </h2>
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: '12px',
            maxHeight: '250px',
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
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {employees.slice(0, 8).map((emp) => (
              <div 
                key={emp.id} 
                style={{ 
                  padding: '6px 8px',
                  marginBottom: '4px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: getRoleColor(emp.role),
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {emp.initiales}
                </span>
                <div>
                  <div style={{ fontWeight: '500' }}>{emp.prenom} {emp.nom || ''}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{emp.role}</div>
                </div>
              </div>
            ))}
            {employees.length > 8 && (
              <div style={{ color: '#64748b', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
                + {employees.length - 8} autres
              </div>
            )}
            {employees.length === 0 && (
              <div style={{ color: '#ef4444', textAlign: 'center', padding: '20px' }}>
                ⚠️ Aucun employé trouvé
              </div>
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
            📋 Demandes ({requests.length})
          </h2>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: getRequestColor(req.type),
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}>
                    {req.type}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{req.date}</span>
                </div>
                {req.motif && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    {req.motif.length > 40 ? req.motif.slice(0, 40) + '...' : req.motif}
                  </div>
                )}
              </div>
            ))}
            {requests.length === 0 && (
              <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                Aucune demande
              </div>
            )}
          </div>
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
            : isLoading 
              ? '⏳ Tests en cours...'
              : '✅ Tous les tests sont passés !'}
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          {logs.some(l => l.includes('❌')) 
            ? 'Vérifie les logs ci-dessus pour identifier les problèmes.'
            : isLoading
              ? 'Patiente quelques secondes...'
              : 'Ta connexion Supabase fonctionne parfaitement. Tu peux passer à la suite !'}
        </p>
      </div>
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

// Couleur par type de demande
function getRequestColor(type: string): string {
  const colors: Record<string, string> = {
    conge: '#3b82f6',
    echange: '#8b5cf6',
    maladie: '#ef4444',
  }
  return colors[type] || '#64748b'
}
