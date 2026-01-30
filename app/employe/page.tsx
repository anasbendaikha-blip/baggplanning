'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type EmployeeRole =
  | 'Étudiant'
  | 'Préparateur'
  | 'Pharmacien'
  | 'Conditionneur'
  | 'Apprenti'
  | 'Employé'

interface Session {
  role?: EmployeeRole | string
  employeeId: string
  employeeName: string
  employeeInitials?: string
  employeeFunction?: string
}

const cleanText = (value: unknown) =>
  String(value ?? '')
    .replace(/\bundefined\b/gi, '')
    .replace(/\bnull\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

const normalizeSession = (raw: any): Session | null => {
  const employeeId = cleanText(raw?.employeeId ?? raw?.employee_id ?? raw?.id)

  const employeeName = cleanText(
    raw?.employeeName ??
      raw?.employee_name ??
      raw?.name ??
      [raw?.prenom, raw?.nom].filter(Boolean).join(' ')
  )

  const employeeInitials = cleanText(raw?.employeeInitials ?? raw?.employee_initials ?? raw?.initiales)

  const employeeFunction = cleanText(
    raw?.employeeFunction ?? raw?.fonction ?? raw?.job ?? raw?.poste ?? raw?.metier
  )

  // `role` peut encore être utilisé par ton ancien login
  const role = cleanText(raw?.role ?? raw?.employeeRole)

  if (!employeeId || !employeeName) return null

  return {
    employeeId,
    employeeName,
    employeeInitials: employeeInitials || undefined,
    employeeFunction: employeeFunction || undefined,
    role: role || undefined,
  }
}

export default function EmployePlanningPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)

  // Charger la session depuis le login (localStorage)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('baggplanning_session')
      if (!stored) {
        router.replace('/login')
        return
      }

      const raw = JSON.parse(stored)
      const normalized = normalizeSession(raw)

      if (!normalized) {
        localStorage.removeItem('baggplanning_session')
        router.replace('/login')
        return
      }

      setSession(normalized)
    } catch {
      localStorage.removeItem('baggplanning_session')
      router.replace('/login')
    }
  }, [router])

  // Tant que la session n'est pas chargée, on n'affiche rien (évite le flash)
  if (!session) return null

  // Données identiques à ton one-page (tu remplaceras par tes vraies données plus tard)
  const planning = [
    { jour: 'Lundi', date: '13 jan', num: '13', horaire: '17h00 - 20h30', working: true },
    { jour: 'Mardi', date: '14 jan', num: '14', horaire: '17h00 - 20h30', working: true },
    { jour: 'Mercredi', date: '15 jan', num: '15', horaire: 'Repos', working: false },
    { jour: 'Jeudi', date: '16 jan', num: '16', horaire: 'Repos', working: false },
    { jour: 'Vendredi', date: '17 jan', num: '17', horaire: '14h00 - 20h30', working: true },
    { jour: 'Samedi', date: '18 jan', num: '18', horaire: '8h30 - 14h00', working: true },
  ]

  return (
    <>
      {/* Contenu */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '16px' }}>
        <div className="planning-header">
          <p className="label">Votre planning</p>
          <p className="dates">Semaine du 13 - 18 Janvier</p>
        </div>

        <div className="card">
          {planning.map((item) => (
            <div key={item.jour} className="planning-day">
              <div className="planning-day-left">
                <div className={`planning-day-number ${item.working ? 'working' : 'off'}`}>{item.num}</div>
                <div>
                  <div className="planning-day-name">{item.jour}</div>
                  <div className="planning-day-date">{item.date}</div>
                </div>
              </div>
              <div className={`planning-badge ${item.working ? 'working' : 'off'}`}>{item.horaire}</div>
            </div>
          ))}

          <div className="planning-total">
            <div>
              <p className="planning-total-label">Total cette semaine</p>
              <p className="planning-total-value">17h30</p>
            </div>
            <div className="planning-total-icon">📊</div>
          </div>
        </div>
      </div>
    </>
  )
}