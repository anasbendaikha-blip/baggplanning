'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MOCK_EMPLOYEES,
  MOCK_DISPONIBILITES,
  JOURS_SEMAINE,
  type EmployeeRole,
} from '@/lib/mock-data'
import { T, ROLE_PALETTE } from '@/lib/ui-tokens'
import { getWeekStart, formatWeekRange, addWeeks } from '@/lib/date-utils'
import { parseHoraire, calculateHours } from '@/lib/planning'

// ============================================================
// TYPES
// ============================================================

interface StudentAvailability {
  id: string
  prenom: string
  nom: string
  initiales: string
  disponibilites: Record<string, string> // jour → 'matin'|'apres-midi'|'journee'|'non'
  hasResponded: boolean
  enabled: boolean // toggle include/exclude
  totalAvailableDays: number
  minHours: number  // heures min hebdo
  maxHours: number  // heures max hebdo
}

interface DayNeed {
  day: string
  dayLabel: string
  dayIdx: number
  enabled: boolean
  startTime: string
  endTime: string
  minStudents: number
  maxStudents: number
}

interface GeneratedAssignment {
  studentId: string
  studentName: string
  studentInitiales: string
  day: string
  dayLabel: string
  startTime: string
  endTime: string
  hours: number
}

interface GeneratedPlan {
  assignments: GeneratedAssignment[]
  stats: {
    totalSlots: number
    totalStudents: number
    totalHours: number
    coverageRate: number
    avgHoursPerStudent: number
    warnings: string[]
  }
  byStudent: Record<string, { name: string; initiales: string; totalHours: number; days: string[]; minH: number; maxH: number }>
  byDay: Record<string, GeneratedAssignment[]>
}

// ============================================================
// CONSTANTS
// ============================================================

const DAYS = [
  { key: 'lundi', label: 'Lundi', short: 'Lun', idx: 0 },
  { key: 'mardi', label: 'Mardi', short: 'Mar', idx: 1 },
  { key: 'mercredi', label: 'Mercredi', short: 'Mer', idx: 2 },
  { key: 'jeudi', label: 'Jeudi', short: 'Jeu', idx: 3 },
  { key: 'vendredi', label: 'Vendredi', short: 'Ven', idx: 4 },
  { key: 'samedi', label: 'Samedi', short: 'Sam', idx: 5 },
]

const PALETTE = ROLE_PALETTE.Etudiant

// ============================================================
// DATA HELPERS
// ============================================================

function getStudentAvailabilities(): StudentAvailability[] {
  const students = MOCK_EMPLOYEES.filter(e => e.actif && e.fonction === 'Etudiant')

  return students.map(stu => {
    const dispo = MOCK_DISPONIBILITES.find(d => d.employee_id === stu.id)
    const dispoMap: Record<string, string> = {}
    let availDays = 0

    DAYS.forEach(d => {
      const dispoAny = dispo as Record<string, unknown> | undefined
      if (dispoAny && dispoAny[d.key]) {
        const val = dispoAny[d.key] as string
        if (val && val !== 'non' && val !== 'repos') {
          dispoMap[d.key] = val
          availDays++
        } else {
          dispoMap[d.key] = 'non'
        }
      } else {
        // Simulate some availability for students missing from MOCK_DISPONIBILITES
        const hash = stu.id.charCodeAt(1) + d.idx
        if (hash % 3 !== 0) {
          const slots = ['matin', 'apres-midi', 'journee']
          dispoMap[d.key] = slots[hash % 3]
          availDays++
        } else {
          dispoMap[d.key] = 'non'
        }
      }
    })

    return {
      id: stu.id,
      prenom: stu.prenom,
      nom: stu.nom || '',
      initiales: stu.initiales,
      disponibilites: dispoMap,
      hasResponded: dispo?.has_submitted ?? false,
      enabled: true,
      totalAvailableDays: availDays,
      minHours: 4,
      maxHours: 20,
    }
  })
}

function getDispoLabel(val: string): string {
  switch (val) {
    case 'matin': return '☀️ Matin'
    case 'apres-midi': return '🌤️ Après-midi'
    case 'journee': return '☀️ Journée'
    case 'non': return '✗'
    default: return val
  }
}

function isAvailableForSlot(dispoVal: string, startTime: string, endTime: string): boolean {
  if (dispoVal === 'non' || dispoVal === 'repos') return false
  if (dispoVal === 'journee') return true

  const [startH] = startTime.split(':').map(Number)
  const [endH] = endTime.split(':').map(Number)

  if (dispoVal === 'matin') {
    return startH < 14 && endH <= 14
  }
  if (dispoVal === 'apres-midi') {
    return startH >= 12
  }
  return true // default: available
}

// ============================================================
// GENERATION ALGORITHM
// ============================================================

function generatePlanning(
  students: StudentAvailability[],
  needs: DayNeed[]
): GeneratedPlan {
  const activeStudents = students.filter(s => s.enabled)
  const activeNeeds = needs.filter(n => n.enabled)

  const assignments: GeneratedAssignment[] = []
  const warnings: string[] = []

  // Track hours per student for balancing + max respect
  const studentHours: Record<string, number> = {}
  const studentMaxH: Record<string, number> = {}
  const studentMinH: Record<string, number> = {}
  activeStudents.forEach(s => {
    studentHours[s.id] = 0
    studentMaxH[s.id] = s.maxHours
    studentMinH[s.id] = s.minHours
  })

  // Sort needs by number of available students (hardest to fill first)
  const sortedNeeds = [...activeNeeds].sort((a, b) => {
    const availA = activeStudents.filter(s => isAvailableForSlot(s.disponibilites[a.day], a.startTime, a.endTime)).length
    const availB = activeStudents.filter(s => isAvailableForSlot(s.disponibilites[b.day], b.startTime, b.endTime)).length
    return availA - availB
  })

  for (const need of sortedNeeds) {
    const [sH, sM] = need.startTime.split(':').map(Number)
    const [eH, eM] = need.endTime.split(':').map(Number)
    const slotHours = ((eH * 60 + eM) - (sH * 60 + sM)) / 60

    // Find available students for this slot (respecting maxHours)
    const available = activeStudents.filter(s =>
      isAvailableForSlot(s.disponibilites[need.day], need.startTime, need.endTime) &&
      // Don't assign same student twice on same day
      !assignments.some(a => a.studentId === s.id && a.day === need.day) &&
      // Respect maxHours constraint (with 10% tolerance)
      (studentHours[s.id] || 0) + slotHours <= studentMaxH[s.id] * 1.1
    )

    // Check minimum coverage
    if (available.length < need.minStudents) {
      warnings.push(`${need.dayLabel}: seulement ${available.length} étudiants disponibles (min. ${need.minStudents} requis)`)
    }

    // Sort by hours (least hours first for balancing — prioritize under-minHours students)
    available.sort((a, b) => {
      const aUnder = (studentHours[a.id] || 0) < studentMinH[a.id] ? 0 : 1
      const bUnder = (studentHours[b.id] || 0) < studentMinH[b.id] ? 0 : 1
      if (aUnder !== bUnder) return aUnder - bUnder
      return (studentHours[a.id] || 0) - (studentHours[b.id] || 0)
    })

    // Assign between minStudents and maxStudents
    // First ensure minimum, then try to reach max if students are available
    const targetCount = Math.min(need.maxStudents, available.length)
    const toAssign = available.slice(0, targetCount)

    for (const student of toAssign) {
      assignments.push({
        studentId: student.id,
        studentName: `${student.prenom} ${student.nom}`.trim(),
        studentInitiales: student.initiales,
        day: need.day,
        dayLabel: need.dayLabel,
        startTime: need.startTime,
        endTime: need.endTime,
        hours: slotHours,
      })

      studentHours[student.id] = (studentHours[student.id] || 0) + slotHours
    }
  }

  // Post-generation warnings for per-student hour constraints
  activeStudents.forEach(s => {
    const h = studentHours[s.id] || 0
    if (h > 0 && h < s.minHours) {
      warnings.push(`${s.prenom} ${s.nom}: ${h}h attribuées (min. ${s.minHours}h demandé)`)
    }
    if (h > s.maxHours) {
      warnings.push(`${s.prenom} ${s.nom}: ${h}h attribuées (max. ${s.maxHours}h dépassé)`)
    }
  })

  // Build byStudent
  const byStudent: Record<string, { name: string; initiales: string; totalHours: number; days: string[]; minH: number; maxH: number }> = {}
  assignments.forEach(a => {
    if (!byStudent[a.studentId]) {
      const stu = activeStudents.find(s => s.id === a.studentId)
      byStudent[a.studentId] = { name: a.studentName, initiales: a.studentInitiales, totalHours: 0, days: [], minH: stu?.minHours ?? 4, maxH: stu?.maxHours ?? 20 }
    }
    byStudent[a.studentId].totalHours += a.hours
    byStudent[a.studentId].days.push(a.dayLabel)
  })

  // Build byDay
  const byDay: Record<string, GeneratedAssignment[]> = {}
  DAYS.forEach(d => { byDay[d.key] = [] })
  assignments.forEach(a => {
    if (!byDay[a.day]) byDay[a.day] = []
    byDay[a.day].push(a)
  })

  // Stats — use maxStudents as reference for total slots
  const totalSlots = activeNeeds.reduce((s, n) => s + n.maxStudents, 0)
  const minSlots = activeNeeds.reduce((s, n) => s + n.minStudents, 0)
  const assignedStudents = new Set(assignments.map(a => a.studentId))
  const totalHours = assignments.reduce((s, a) => s + a.hours, 0)
  const coverageRate = minSlots > 0 ? Math.min(100, Math.round((assignments.length / minSlots) * 100)) : 0

  return {
    assignments,
    stats: {
      totalSlots,
      totalStudents: assignedStudents.size,
      totalHours: Math.round(totalHours * 10) / 10,
      coverageRate,
      avgHoursPerStudent: assignedStudents.size > 0 ? Math.round((totalHours / assignedStudents.size) * 10) / 10 : 0,
      warnings,
    },
    byStudent,
    byDay,
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AssistantPlanningPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null)
  const [appliedSuccess, setAppliedSuccess] = useState(false)

  // Step 1: Period
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(2026, 1, 9) // Feb 9, 2026 (next week demo)
    return getWeekStart(d)
  })

  // Step 2: Needs
  const [dayNeeds, setDayNeeds] = useState<DayNeed[]>(() =>
    DAYS.map(d => ({
      day: d.key,
      dayLabel: d.label,
      dayIdx: d.idx,
      enabled: d.idx < 5, // Mon-Fri enabled by default
      startTime: '09:00',
      endTime: '18:00',
      minStudents: 1,
      maxStudents: 3,
    }))
  )

  // Step 3: Students
  const [students, setStudents] = useState<StudentAvailability[]>(() => getStudentAvailabilities())
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  // Options
  const [targetHours, setTargetHours] = useState(20)
  const [balanceHours, setBalanceHours] = useState(true)

  const weekLabel = formatWeekRange(weekStart)
  const enabledStudents = students.filter(s => s.enabled)
  const enabledDays = dayNeeds.filter(d => d.enabled)

  // ── Step navigation ──
  const canGoNext = useMemo(() => {
    if (step === 1) return true
    if (step === 2) return enabledDays.length > 0
    if (step === 3) return enabledStudents.length > 0
    return false
  }, [step, enabledDays.length, enabledStudents.length])

  const goNext = () => {
    if (step < 4 && canGoNext) setStep(step + 1)
  }
  const goPrev = () => {
    if (step > 1) setStep(step - 1)
  }

  // ── Generate ──
  const handleGenerate = async () => {
    setIsGenerating(true)
    // Simulated delay for wow effect
    await new Promise(r => setTimeout(r, 1800))
    const plan = generatePlanning(students, dayNeeds)
    setGeneratedPlan(plan)
    setIsGenerating(false)
    setStep(4)
  }

  // ── Apply ──
  const handleApply = () => {
    if (!generatedPlan) return

    // ── 1. ALWAYS build base slots from ALL fixed employees (non-students) ──
    // Same parsing logic as initPlanning() fallback in the Planning page
    const slotsPerDay: Record<string, Array<{ id: string; employee_id: string; start_time: string; end_time: string; type: 'work' | 'pause' }>> = {}
    JOURS_SEMAINE.forEach(j => { slotsPerDay[j] = [] })

    MOCK_EMPLOYEES.forEach(emp => {
      if (!emp.actif) return
      // Skip ALL students — they'll be added from generated plan
      if (emp.fonction === 'Etudiant') return

      JOURS_SEMAINE.forEach(j => {
        const h = emp.horaires[j]
        if (h && h !== 'non' && h !== 'variable' && h !== 'congé') {
          const parts = h.replace(/h/g, ':').replace(/:(\d)(?!\d)/g, ':0$1').split('-')
          if (parts.length === 2) {
            slotsPerDay[j].push({
              id: `${emp.id}-${j}`,
              employee_id: emp.id,
              start_time: parts[0].trim().padStart(5, '0'),
              end_time: parts[1].trim().padStart(5, '0'),
              type: 'work',
            })
          }
        }
      })
    })

    // ── 2. Add generated student slots ──
    generatedPlan.assignments.forEach((a, idx) => {
      slotsPerDay[a.day].push({
        id: `ast-${Date.now()}-${idx}`,
        employee_id: a.studentId,
        start_time: a.startTime,
        end_time: a.endTime,
        type: 'work',
      })

      // Auto-pause if slot > 6h
      const [sH, sM] = a.startTime.split(':').map(Number)
      const [eH, eM] = a.endTime.split(':').map(Number)
      const durationH = ((eH * 60 + eM) - (sH * 60 + sM)) / 60
      if (durationH > 6) {
        const startMins = sH * 60 + sM
        const endMins = eH * 60 + eM
        const pauseStart = startMins + Math.floor((endMins - startMins) / 2) - 15
        const ph = Math.floor(pauseStart / 60)
        const pm = pauseStart % 60
        const peH = Math.floor((pauseStart + 30) / 60)
        const peM = (pauseStart + 30) % 60
        slotsPerDay[a.day].push({
          id: `ast-p-${Date.now()}-${idx}`,
          employee_id: a.studentId,
          start_time: `${ph.toString().padStart(2, '0')}:${pm.toString().padStart(2, '0')}`,
          end_time: `${peH.toString().padStart(2, '0')}:${peM.toString().padStart(2, '0')}`,
          type: 'pause',
        })
      }
    })

    // ── 3. Compute metadata ──
    let totalMinutes = 0
    const uniqueEmpIds = new Set<string>()
    Object.values(slotsPerDay).forEach(daySlots => {
      daySlots.forEach(s => {
        if (s.type === 'work') {
          const [sh, sm] = s.start_time.split(':').map(Number)
          const [eh, em] = s.end_time.split(':').map(Number)
          totalMinutes += (eh * 60 + em) - (sh * 60 + sm)
          uniqueEmpIds.add(s.employee_id)
        }
      })
    })

    const mondayISO = weekStart.toISOString().split('T')[0]

    // ── 4. Write merged planning ──
    const appliedPlanning = {
      id: `planning-${Date.now()}`,
      weekStart: mondayISO,
      slots: slotsPerDay,
      metadata: {
        generatedAt: new Date().toISOString(),
        appliedAt: new Date().toISOString(),
        totalHeures: Math.round(totalMinutes / 60),
        employesCount: uniqueEmpIds.size,
      },
    }
    localStorage.setItem('applied_planning', JSON.stringify(appliedPlanning))
    // Clean up any draft
    localStorage.removeItem('generated_planning')
    localStorage.removeItem('assistant_planning_draft')

    setAppliedSuccess(true)
    setTimeout(() => {
      router.push('/titulaire/planning')
    }, 1500)
  }

  // ── Regenerate ──
  const handleRegenerate = async () => {
    setGeneratedPlan(null)
    setIsGenerating(true)
    await new Promise(r => setTimeout(r, 1200))
    const plan = generatePlanning(students, dayNeeds)
    setGeneratedPlan(plan)
    setIsGenerating(false)
  }

  // ── Update need ──
  const updateNeed = (day: string, updates: Partial<DayNeed>) => {
    setDayNeeds(prev => prev.map(n => n.day === day ? { ...n, ...updates } : n))
  }

  // ── Apply same config to all days ──
  const applyToAll = (source: DayNeed) => {
    setDayNeeds(prev => prev.map(n => n.enabled ? {
      ...n,
      startTime: source.startTime,
      endTime: source.endTime,
      minStudents: source.minStudents,
      maxStudents: source.maxStudents,
    } : n))
  }

  // ── Update student hours ──
  const updateStudentHours = (id: string, field: 'minHours' | 'maxHours', value: number) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== id) return s
      if (field === 'minHours') {
        return { ...s, minHours: Math.max(0, Math.min(value, s.maxHours)) }
      }
      return { ...s, maxHours: Math.max(s.minHours, Math.min(value, 40)) }
    }))
  }

  // ── Toggle student ──
  const toggleStudent = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }

  // ── STEP LABELS ──
  const STEPS = [
    { num: 1, label: 'Période', icon: '📅' },
    { num: 2, label: 'Besoins', icon: '⏰' },
    { num: 3, label: 'Étudiants', icon: '👥' },
    { num: 4, label: 'Résultat', icon: '✨' },
  ]

  return (
    <div className="ap-page">
      {/* ═══════ HEADER ═══════ */}
      <header className="ap-header">
        <div className="ap-header-left">
          <Link href="/titulaire/planning" className="ap-back">← Planning</Link>
          <div>
            <h1 className="ap-title">✨ Assistant de Planning</h1>
            <p className="ap-subtitle">Génération automatique — Étudiants</p>
          </div>
        </div>
        <div className="ap-header-badge">
          <span className="ap-badge-icon">🎓</span>
          {enabledStudents.length} étudiants • {enabledDays.length} jours
        </div>
      </header>

      {/* ═══════ STEPPER ═══════ */}
      <div className="ap-stepper">
        {STEPS.map((s, i) => (
          <div key={s.num} className="ap-step-wrap">
            {i > 0 && <div className={`ap-step-line ${step > s.num - 1 ? 'done' : ''}`} />}
            <button
              className={`ap-step ${step === s.num ? 'active' : ''} ${step > s.num ? 'done' : ''}`}
              onClick={() => s.num < step && setStep(s.num)}
              disabled={s.num > step}
            >
              <span className="ap-step-num">
                {step > s.num ? '✓' : s.icon}
              </span>
              <span className="ap-step-label">{s.label}</span>
            </button>
          </div>
        ))}
      </div>

      {/* ═══════ CONTENT ═══════ */}
      <main className="ap-main">
        <div className="ap-content">

          {/* ─── STEP 1: PERIOD ─── */}
          {step === 1 && (
            <div className="ap-step-content">
              <div className="ap-step-header">
                <span className="ap-step-header-icon">📅</span>
                <div>
                  <h2>Quelle semaine planifier ?</h2>
                  <p>Sélectionnez la semaine pour laquelle générer le planning étudiants</p>
                </div>
              </div>

              <div className="ap-period-cards">
                {/* Next week (recommended) */}
                <button
                  className={`ap-period-card ${weekStart.toISOString().split('T')[0] === getWeekStart(new Date(2026, 1, 9)).toISOString().split('T')[0] ? 'selected' : ''}`}
                  onClick={() => setWeekStart(getWeekStart(new Date(2026, 1, 9)))}
                >
                  <div className="ap-period-top">
                    <span className="ap-period-badge recommended">✨ Recommandé</span>
                  </div>
                  <div className="ap-period-label">Semaine prochaine</div>
                  <div className="ap-period-dates">{formatWeekRange(getWeekStart(new Date(2026, 1, 9)))}</div>
                </button>

                {/* Current week */}
                <button
                  className={`ap-period-card ${weekStart.toISOString().split('T')[0] === getWeekStart(new Date(2026, 1, 2)).toISOString().split('T')[0] ? 'selected' : ''}`}
                  onClick={() => setWeekStart(getWeekStart(new Date(2026, 1, 2)))}
                >
                  <div className="ap-period-top">
                    <span className="ap-period-badge current">En cours</span>
                  </div>
                  <div className="ap-period-label">Semaine actuelle</div>
                  <div className="ap-period-dates">{formatWeekRange(getWeekStart(new Date(2026, 1, 2)))}</div>
                </button>

                {/* Week after next */}
                <button
                  className={`ap-period-card ${weekStart.toISOString().split('T')[0] === getWeekStart(new Date(2026, 1, 16)).toISOString().split('T')[0] ? 'selected' : ''}`}
                  onClick={() => setWeekStart(getWeekStart(new Date(2026, 1, 16)))}
                >
                  <div className="ap-period-top">
                    <span className="ap-period-badge">Planification</span>
                  </div>
                  <div className="ap-period-label">Dans 2 semaines</div>
                  <div className="ap-period-dates">{formatWeekRange(getWeekStart(new Date(2026, 1, 16)))}</div>
                </button>
              </div>

              <div className="ap-period-selected">
                ✅ Période sélectionnée : <strong>{weekLabel}</strong>
              </div>
            </div>
          )}

          {/* ─── STEP 2: NEEDS ─── */}
          {step === 2 && (
            <div className="ap-step-content">
              <div className="ap-step-header">
                <span className="ap-step-header-icon">⏰</span>
                <div>
                  <h2>Besoins en étudiants</h2>
                  <p>Combien d&apos;étudiants par jour et quels horaires ?</p>
                </div>
              </div>

              <div className="ap-needs-list">
                {dayNeeds.map(need => (
                  <div key={need.day} className={`ap-need-card ${!need.enabled ? 'disabled' : ''}`}>
                    <div className="ap-need-header">
                      <label className="ap-need-toggle">
                        <input
                          type="checkbox"
                          checked={need.enabled}
                          onChange={() => updateNeed(need.day, { enabled: !need.enabled })}
                        />
                        <span className="ap-need-day">{need.dayLabel}</span>
                      </label>
                      {need.enabled && (
                        <button className="ap-need-apply-all" onClick={() => applyToAll(need)} title="Appliquer à tous les jours">
                          📋 Copier
                        </button>
                      )}
                    </div>
                    {need.enabled && (
                      <div className="ap-need-config">
                        <div className="ap-need-row">
                          <label>Horaires</label>
                          <div className="ap-need-times">
                            <select value={need.startTime} onChange={e => updateNeed(need.day, { startTime: e.target.value })}>
                              {['08:00','08:30','09:00','09:30','10:00'].map(t => (
                                <option key={t} value={t}>{t.replace(':', 'h')}</option>
                              ))}
                            </select>
                            <span>→</span>
                            <select value={need.endTime} onChange={e => updateNeed(need.day, { endTime: e.target.value })}>
                              {['17:00','17:30','18:00','18:30','19:00','19:30','20:00'].map(t => (
                                <option key={t} value={t}>{t.replace(':', 'h')}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="ap-need-row">
                          <label>Min</label>
                          <div className="ap-need-counter">
                            <button onClick={() => updateNeed(need.day, { minStudents: Math.max(0, need.minStudents - 1) })}>−</button>
                            <span className="ap-need-count">{need.minStudents}</span>
                            <button onClick={() => updateNeed(need.day, { minStudents: Math.min(need.maxStudents, need.minStudents + 1) })}>+</button>
                          </div>
                        </div>
                        <div className="ap-need-row">
                          <label>Max</label>
                          <div className="ap-need-counter">
                            <button onClick={() => updateNeed(need.day, { maxStudents: Math.max(need.minStudents, need.maxStudents - 1) })}>−</button>
                            <span className="ap-need-count max">{need.maxStudents}</span>
                            <button onClick={() => updateNeed(need.day, { maxStudents: Math.min(8, need.maxStudents + 1) })}>+</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="ap-needs-summary">
                <div className="ap-needs-stat">
                  <span className="ap-needs-stat-val">{enabledDays.reduce((s, d) => s + d.minStudents, 0)}–{enabledDays.reduce((s, d) => s + d.maxStudents, 0)}</span>
                  <span className="ap-needs-stat-label">créneaux/sem</span>
                </div>
                <div className="ap-needs-stat">
                  <span className="ap-needs-stat-val">{enabledDays.length}</span>
                  <span className="ap-needs-stat-label">jours actifs</span>
                </div>
                <div className="ap-needs-stat">
                  <span className="ap-needs-stat-val">{enabledStudents.length}</span>
                  <span className="ap-needs-stat-label">étudiants dispo</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: STUDENTS ─── */}
          {step === 3 && (
            <div className="ap-step-content">
              <div className="ap-step-header">
                <span className="ap-step-header-icon">👥</span>
                <div>
                  <h2>Disponibilités des étudiants</h2>
                  <p>Récupérées automatiquement — {enabledStudents.length}/{students.length} sélectionnés</p>
                </div>
              </div>

              <div className="ap-students-info">
                ℹ️ Les disponibilités ont été récupérées automatiquement depuis les déclarations des étudiants.
              </div>

              <div className="ap-students-actions">
                <button className="ap-bulk-btn" onClick={() => setStudents(prev => prev.map(s => ({ ...s, enabled: true })))}>
                  ✓ Tout sélectionner
                </button>
                <button className="ap-bulk-btn" onClick={() => setStudents(prev => prev.map(s => ({ ...s, enabled: false })))}>
                  ✗ Tout désélectionner
                </button>
              </div>

              <div className="ap-students-list">
                {students.map(stu => {
                  const isExpanded = expandedStudent === stu.id
                  return (
                    <div key={stu.id} className={`ap-student-card ${!stu.enabled ? 'disabled' : ''}`}>
                      <div className="ap-student-header">
                        <label className="ap-student-toggle">
                          <input
                            type="checkbox"
                            checked={stu.enabled}
                            onChange={() => toggleStudent(stu.id)}
                          />
                        </label>
                        <div className="ap-student-avatar">{stu.initiales}</div>
                        <div className="ap-student-info" onClick={() => setExpandedStudent(isExpanded ? null : stu.id)}>
                          <span className="ap-student-name">{stu.prenom} {stu.nom}</span>
                          <span className={`ap-student-status ${stu.totalAvailableDays >= 4 ? 'good' : stu.totalAvailableDays >= 2 ? 'partial' : 'low'}`}>
                            {stu.totalAvailableDays >= 4 ? '✓ Très disponible' : stu.totalAvailableDays >= 2 ? '⚠️ Partiellement' : '✗ Peu disponible'}
                            <span className="ap-student-days-count"> ({stu.totalAvailableDays}j)</span>
                          </span>
                        </div>
                        <button className="ap-student-expand" onClick={() => setExpandedStudent(isExpanded ? null : stu.id)}>
                          {isExpanded ? '▾' : '▸'}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="ap-student-detail">
                          <div className="ap-student-grid">
                            {DAYS.map(d => {
                              const val = stu.disponibilites[d.key]
                              const available = val !== 'non'
                              return (
                                <div key={d.key} className={`ap-student-day ${available ? 'available' : 'unavailable'}`}>
                                  <span className="ap-student-day-name">{d.short}</span>
                                  <span className="ap-student-day-val">{getDispoLabel(val)}</span>
                                </div>
                              )
                            })}
                          </div>
                          <div className="ap-student-hours-config">
                            <span className="ap-student-hours-label">Heures hebdo :</span>
                            <div className="ap-student-hours-inputs">
                              <div className="ap-student-h-field">
                                <label>Min</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={stu.maxHours}
                                  value={stu.minHours}
                                  onChange={e => updateStudentHours(stu.id, 'minHours', parseInt(e.target.value) || 0)}
                                  className="ap-student-h-input"
                                />
                                <span>h</span>
                              </div>
                              <span className="ap-student-h-sep">→</span>
                              <div className="ap-student-h-field">
                                <label>Max</label>
                                <input
                                  type="number"
                                  min={stu.minHours}
                                  max={40}
                                  value={stu.maxHours}
                                  onChange={e => updateStudentHours(stu.id, 'maxHours', parseInt(e.target.value) || 20)}
                                  className="ap-student-h-input"
                                />
                                <span>h</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Options */}
              <div className="ap-options">
                <h3>⚙️ Options de génération</h3>
                <label className="ap-option">
                  <input type="checkbox" checked={balanceHours} onChange={e => setBalanceHours(e.target.checked)} />
                  <span>Équilibrer les heures entre étudiants</span>
                </label>
                <div className="ap-option-row">
                  <label>Heures cibles par étudiant :</label>
                  <input
                    type="number"
                    min={4}
                    max={35}
                    value={targetHours}
                    onChange={e => setTargetHours(parseInt(e.target.value) || 20)}
                    className="ap-option-input"
                  />
                  <span>h/sem</span>
                </div>
              </div>

              <button className="ap-generate-btn" onClick={handleGenerate} disabled={enabledStudents.length === 0}>
                ✨ Générer le planning
              </button>
            </div>
          )}

          {/* ─── STEP 4: RESULT ─── */}
          {step === 4 && (
            <div className="ap-step-content">
              {isGenerating ? (
                <div className="ap-generating">
                  <div className="ap-spinner-large" />
                  <h2>Génération en cours...</h2>
                  <p className="ap-generating-sub">Analyse des disponibilités • Équilibrage des heures • Optimisation</p>
                  <div className="ap-generating-bar">
                    <div className="ap-generating-fill" />
                  </div>
                </div>
              ) : appliedSuccess ? (
                <div className="ap-success">
                  <div className="ap-success-icon">✅</div>
                  <h2>Planning appliqué avec succès !</h2>
                  <p>Redirection vers le planning...</p>
                </div>
              ) : generatedPlan ? (
                <>
                  <div className="ap-step-header">
                    <span className="ap-step-header-icon">✨</span>
                    <div>
                      <h2>Planning généré !</h2>
                      <p>Semaine du {weekLabel} — {generatedPlan.stats.totalStudents} étudiants planifiés</p>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="ap-result-kpis">
                    <div className="ap-kpi-card success">
                      <span className="ap-kpi-icon">✓</span>
                      <span className="ap-kpi-val">{generatedPlan.assignments.length}</span>
                      <span className="ap-kpi-label">créneaux attribués</span>
                    </div>
                    <div className="ap-kpi-card">
                      <span className="ap-kpi-icon">👥</span>
                      <span className="ap-kpi-val">{generatedPlan.stats.totalStudents}</span>
                      <span className="ap-kpi-label">étudiants planifiés</span>
                    </div>
                    <div className="ap-kpi-card">
                      <span className="ap-kpi-icon">⏱️</span>
                      <span className="ap-kpi-val">{generatedPlan.stats.avgHoursPerStudent}h</span>
                      <span className="ap-kpi-label">moy./étudiant</span>
                    </div>
                    <div className="ap-kpi-card" style={{ borderColor: generatedPlan.stats.coverageRate >= 90 ? T.primary : T.warning }}>
                      <span className="ap-kpi-icon">🎯</span>
                      <span className="ap-kpi-val">{generatedPlan.stats.coverageRate}%</span>
                      <span className="ap-kpi-label">couverture</span>
                    </div>
                  </div>

                  {/* Warnings */}
                  {generatedPlan.stats.warnings.length > 0 && (
                    <div className="ap-warnings">
                      <h4>⚠️ Points d&apos;attention</h4>
                      {generatedPlan.stats.warnings.map((w, i) => (
                        <div key={i} className="ap-warning-item">{w}</div>
                      ))}
                    </div>
                  )}

                  {/* Planning grid by day */}
                  <div className="ap-result-grid">
                    <h3>📅 Planning par jour</h3>
                    <div className="ap-days-grid">
                      {DAYS.map(d => {
                        const dayAssignments = generatedPlan.byDay[d.key] || []
                        const isActive = dayNeeds.find(n => n.day === d.key)?.enabled
                        return (
                          <div key={d.key} className={`ap-day-col ${!isActive ? 'inactive' : ''}`}>
                            <div className="ap-day-header">{d.short}</div>
                            <div className="ap-day-slots">
                              {isActive ? (
                                dayAssignments.length > 0 ? (
                                  dayAssignments.map((a, idx) => (
                                    <div key={idx} className="ap-day-slot">
                                      <div className="ap-slot-avatar">{a.studentInitiales}</div>
                                      <div className="ap-slot-info">
                                        <span className="ap-slot-name">{a.studentName.split(' ')[0]}</span>
                                        <span className="ap-slot-time">{a.startTime}-{a.endTime}</span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="ap-day-empty">Aucun</div>
                                )
                              ) : (
                                <div className="ap-day-off">Fermé</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Hours per student */}
                  <div className="ap-result-students">
                    <h3>👥 Heures par étudiant</h3>
                    <div className="ap-student-hours-list">
                      {Object.entries(generatedPlan.byStudent)
                        .sort(([, a], [, b]) => b.totalHours - a.totalHours)
                        .map(([id, data]) => {
                          const maxH = Math.max(...Object.values(generatedPlan.byStudent).map(d => d.totalHours), 1)
                          const pct = Math.round((data.totalHours / maxH) * 100)
                          const isUnder = data.totalHours < data.minH
                          const isOver = data.totalHours > data.maxH
                          const statusClass = isUnder ? 'under' : isOver ? 'over' : 'ok'
                          return (
                            <div key={id} className={`ap-sh-row ${statusClass}`}>
                              <div className="ap-sh-avatar">{data.initiales}</div>
                              <div className="ap-sh-info">
                                <span className="ap-sh-name">{data.name}</span>
                                <div className="ap-sh-bar-wrap">
                                  <div className="ap-sh-bar" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                              <div className="ap-sh-hours">
                                <strong>{data.totalHours}h</strong>
                                <span className="ap-sh-range">{data.minH}–{data.maxH}h</span>
                                <span className="ap-sh-days">{data.days.length}j</span>
                              </div>
                              {(isUnder || isOver) && (
                                <span className={`ap-sh-badge ${statusClass}`}>
                                  {isUnder ? '▼' : '▲'}
                                </span>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ap-result-actions">
                    <button className="ap-action-btn secondary" onClick={handleRegenerate}>
                      🔄 Regénérer
                    </button>
                    <button className="ap-action-btn secondary" onClick={() => setStep(2)}>
                      ✏️ Modifier les besoins
                    </button>
                    <button className="ap-action-btn primary" onClick={handleApply}>
                      ✅ Appliquer au planning
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </main>

      {/* ═══════ FOOTER NAV ═══════ */}
      {step < 4 && (
        <footer className="ap-footer">
          <div className="ap-footer-left">
            {step > 1 && (
              <button className="ap-nav-btn secondary" onClick={goPrev}>← Retour</button>
            )}
          </div>
          <span className="ap-footer-step">Étape {step}/4</span>
          <div className="ap-footer-right">
            {step < 3 ? (
              <button className="ap-nav-btn primary" onClick={goNext} disabled={!canGoNext}>
                Continuer →
              </button>
            ) : step === 3 ? (
              <button className="ap-nav-btn generate" onClick={handleGenerate} disabled={enabledStudents.length === 0}>
                ✨ Générer le planning
              </button>
            ) : null}
          </div>
        </footer>
      )}

      {/* ═══════ STYLES ═══════ */}
      <style jsx global>{`
        /* ═══ PAGE ═══ */
        .ap-page {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 72px);
          background: ${T.bg};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }

        /* ═══ HEADER ═══ */
        .ap-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          background: ${T.card};
          border-bottom: 1px solid ${T.border};
          gap: 12px;
        }
        .ap-header-left { display: flex; align-items: center; gap: 14px; }
        .ap-back {
          padding: 5px 12px;
          background: ${T.borderLt};
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          color: ${T.textSec};
          text-decoration: none;
          transition: background 0.15s;
        }
        .ap-back:hover { background: ${T.border}; }
        .ap-title { font-size: 18px; font-weight: 800; color: ${T.text}; margin: 0; line-height: 1.2; }
        .ap-subtitle { font-size: 11px; color: ${T.muted}; margin: 0; }
        .ap-header-badge {
          padding: 6px 14px;
          background: ${PALETTE.light};
          border: 1px solid ${PALETTE.border};
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: ${PALETTE.dark};
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .ap-badge-icon { font-size: 14px; }

        /* ═══ STEPPER ═══ */
        .ap-stepper {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 20px;
          background: ${T.card};
          border-bottom: 1px solid ${T.borderLt};
          gap: 0;
        }
        .ap-step-wrap { display: flex; align-items: center; }
        .ap-step-line {
          width: 40px;
          height: 2px;
          background: ${T.border};
          margin: 0 4px;
          transition: background 0.3s;
        }
        .ap-step-line.done { background: ${T.primary}; }
        .ap-step {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border: 1px solid ${T.border};
          border-radius: 20px;
          background: ${T.card};
          font-size: 12px;
          font-weight: 600;
          color: ${T.muted};
          cursor: pointer;
          transition: all 0.2s;
        }
        .ap-step:disabled { cursor: default; opacity: 0.5; }
        .ap-step.active {
          background: ${T.infoBg};
          border-color: ${T.info};
          color: ${T.infoDk};
          box-shadow: 0 0 0 3px ${T.infoLt};
        }
        .ap-step.done {
          background: ${T.primaryBg};
          border-color: ${T.primary};
          color: ${T.primaryDk};
        }
        .ap-step-num { font-size: 14px; }
        .ap-step-label { font-size: 12px; }

        /* ═══ MAIN ═══ */
        .ap-main {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        .ap-content { max-width: 800px; margin: 0 auto; }

        /* ═══ STEP CONTENT ═══ */
        .ap-step-content {}
        .ap-step-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 24px;
        }
        .ap-step-header-icon {
          width: 50px;
          height: 50px;
          background: ${T.primaryLt};
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          flex-shrink: 0;
        }
        .ap-step-header h2 { font-size: 22px; font-weight: 700; color: ${T.text}; margin: 0 0 4px 0; }
        .ap-step-header p { font-size: 14px; color: ${T.textSec}; margin: 0; }

        /* ═══ STEP 1: PERIOD ═══ */
        .ap-period-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }
        .ap-period-card {
          padding: 18px;
          background: ${T.card};
          border: 2px solid ${T.border};
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .ap-period-card:hover { border-color: ${T.info}; box-shadow: 0 4px 12px rgba(59,130,246,0.1); }
        .ap-period-card.selected { border-color: ${T.info}; background: ${T.infoBg}; }
        .ap-period-top { margin-bottom: 10px; }
        .ap-period-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          background: ${T.borderLt};
          color: ${T.muted};
        }
        .ap-period-badge.recommended { background: ${T.infoBg}; color: ${T.infoDk}; }
        .ap-period-badge.current { background: ${T.warningBg}; color: ${T.warningDk}; }
        .ap-period-label { font-size: 16px; font-weight: 700; color: ${T.text}; margin-bottom: 4px; }
        .ap-period-dates { font-size: 13px; color: ${T.textSec}; }
        .ap-period-selected {
          padding: 12px 16px;
          background: ${T.primaryBg};
          border: 1px solid ${T.primaryLt};
          border-radius: 8px;
          font-size: 14px;
          color: ${T.primaryDk};
        }

        /* ═══ STEP 2: NEEDS ═══ */
        .ap-needs-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
        .ap-need-card {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 10px;
          padding: 14px;
          transition: all 0.15s;
        }
        .ap-need-card.disabled { opacity: 0.45; }
        .ap-need-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .ap-need-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .ap-need-toggle input { width: 18px; height: 18px; cursor: pointer; accent-color: ${T.info}; }
        .ap-need-day { font-size: 15px; font-weight: 700; color: ${T.text}; }
        .ap-need-apply-all {
          padding: 4px 10px;
          border: 1px dashed ${T.border};
          border-radius: 6px;
          background: none;
          font-size: 11px;
          color: ${T.muted};
          cursor: pointer;
        }
        .ap-need-apply-all:hover { background: ${T.borderLt}; color: ${T.info}; }
        .ap-need-config { display: flex; flex-wrap: wrap; gap: 16px; padding-left: 26px; }
        .ap-need-row { display: flex; align-items: center; gap: 8px; }
        .ap-need-row label { font-size: 12px; color: ${T.textSec}; font-weight: 500; min-width: 60px; }
        .ap-need-times { display: flex; align-items: center; gap: 6px; }
        .ap-need-times select {
          padding: 5px 8px;
          border: 1px solid ${T.border};
          border-radius: 6px;
          font-size: 13px;
          color: ${T.text};
          background: ${T.card};
        }
        .ap-need-times span { color: ${T.muted}; font-size: 12px; }
        .ap-need-counter { display: flex; align-items: center; gap: 0; }
        .ap-need-counter button {
          width: 30px;
          height: 30px;
          border: 1px solid ${T.border};
          background: ${T.card};
          font-size: 16px;
          cursor: pointer;
          color: ${T.text};
          transition: background 0.1s;
        }
        .ap-need-counter button:first-child { border-radius: 6px 0 0 6px; }
        .ap-need-counter button:last-child { border-radius: 0 6px 6px 0; }
        .ap-need-counter button:hover { background: ${T.borderLt}; }
        .ap-need-count {
          width: 40px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-top: 1px solid ${T.border};
          border-bottom: 1px solid ${T.border};
          font-size: 15px;
          font-weight: 700;
          color: ${T.info};
          background: ${T.card};
        }
        .ap-need-count.max { color: ${T.primaryDk}; }

        .ap-needs-summary {
          display: flex;
          gap: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 16px 0;
          color: white;
        }
        .ap-needs-stat {
          flex: 1;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ap-needs-stat:not(:last-child) { border-right: 1px solid rgba(255,255,255,0.15); }
        .ap-needs-stat-val { font-size: 24px; font-weight: 800; }
        .ap-needs-stat-label { font-size: 11px; opacity: 0.7; }

        /* ═══ STEP 3: STUDENTS ═══ */
        .ap-students-info {
          padding: 12px 16px;
          background: ${T.infoBg};
          border-left: 4px solid ${T.info};
          border-radius: 6px;
          font-size: 13px;
          color: ${T.infoDk};
          margin-bottom: 14px;
        }
        .ap-students-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .ap-bulk-btn {
          padding: 5px 12px;
          border: 1px dashed ${T.border};
          border-radius: 6px;
          background: none;
          font-size: 11px;
          color: ${T.muted};
          cursor: pointer;
        }
        .ap-bulk-btn:hover { border-style: solid; background: ${T.borderLt}; color: ${T.textSec}; }

        .ap-students-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .ap-student-card {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.15s;
        }
        .ap-student-card.disabled { opacity: 0.5; }
        .ap-student-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
        }
        .ap-student-toggle input { width: 16px; height: 16px; cursor: pointer; accent-color: ${T.primary}; }
        .ap-student-avatar {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: ${PALETTE.bg};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }
        .ap-student-info { flex: 1; cursor: pointer; }
        .ap-student-name { font-size: 14px; font-weight: 600; color: ${T.text}; display: block; }
        .ap-student-status {
          font-size: 11px;
          font-weight: 500;
          padding: 1px 0;
        }
        .ap-student-status.good { color: ${T.primaryDk}; }
        .ap-student-status.partial { color: ${T.warningDk}; }
        .ap-student-status.low { color: ${T.danger}; }
        .ap-student-days-count { font-size: 10px; color: ${T.muted}; }
        .ap-student-expand {
          width: 28px;
          height: 28px;
          border: 1px solid ${T.border};
          border-radius: 6px;
          background: ${T.card};
          font-size: 10px;
          color: ${T.muted};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ap-student-expand:hover { background: ${T.borderLt}; }
        .ap-student-detail {
          padding: 10px 14px;
          background: ${T.borderLt};
          border-top: 1px solid ${T.border};
        }
        .ap-student-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
        .ap-student-day {
          text-align: center;
          padding: 6px 4px;
          border-radius: 6px;
          font-size: 11px;
        }
        .ap-student-day.available { background: ${T.primaryBg}; color: ${T.primaryDk}; }
        .ap-student-day.unavailable { background: ${T.borderLt}; color: ${T.muted}; }
        .ap-student-day-name { display: block; font-weight: 700; font-size: 10px; margin-bottom: 2px; }
        .ap-student-day-val { font-size: 10px; }

        /* Student hours config */
        .ap-student-hours-config {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed ${T.border};
        }
        .ap-student-hours-label {
          font-size: 12px;
          font-weight: 600;
          color: ${T.textSec};
          white-space: nowrap;
        }
        .ap-student-hours-inputs { display: flex; align-items: center; gap: 6px; }
        .ap-student-h-field {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: ${T.textSec};
        }
        .ap-student-h-field label {
          font-size: 10px;
          font-weight: 600;
          color: ${T.muted};
          text-transform: uppercase;
        }
        .ap-student-h-input {
          width: 48px;
          padding: 4px 6px;
          border: 1px solid ${T.border};
          border-radius: 5px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          color: ${T.text};
          background: ${T.card};
        }
        .ap-student-h-input:focus { border-color: ${T.info}; outline: none; }
        .ap-student-h-sep { color: ${T.muted}; font-size: 12px; }

        /* Options */
        .ap-options {
          padding: 16px;
          background: ${T.borderLt};
          border-radius: 10px;
          margin-bottom: 20px;
        }
        .ap-options h3 { font-size: 14px; font-weight: 600; color: ${T.text}; margin: 0 0 12px 0; }
        .ap-option {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          cursor: pointer;
          font-size: 13px;
          color: ${T.textSec};
        }
        .ap-option input { width: 16px; height: 16px; accent-color: ${T.primary}; }
        .ap-option-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${T.textSec}; }
        .ap-option-input {
          width: 60px;
          padding: 4px 8px;
          border: 1px solid ${T.border};
          border-radius: 5px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
        }

        /* Generate button */
        .ap-generate-btn {
          display: block;
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(102,126,234,0.4);
        }
        .ap-generate-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102,126,234,0.5); }
        .ap-generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ═══ STEP 4: RESULT ═══ */
        .ap-generating {
          text-align: center;
          padding: 60px 20px;
        }
        .ap-spinner-large {
          width: 56px;
          height: 56px;
          border: 4px solid ${T.border};
          border-top-color: ${T.info};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ap-generating h2 { font-size: 22px; font-weight: 700; color: ${T.text}; margin: 0 0 8px 0; }
        .ap-generating-sub { font-size: 13px; color: ${T.muted}; margin: 0 0 20px 0; }
        .ap-generating-bar {
          width: 200px;
          height: 4px;
          background: ${T.borderLt};
          border-radius: 2px;
          margin: 0 auto;
          overflow: hidden;
        }
        .ap-generating-fill {
          height: 100%;
          width: 30%;
          background: linear-gradient(90deg, ${T.info}, #764ba2);
          border-radius: 2px;
          animation: fillBar 1.5s ease-in-out infinite;
        }
        @keyframes fillBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }

        .ap-success { text-align: center; padding: 60px 20px; }
        .ap-success-icon { font-size: 64px; margin-bottom: 16px; }
        .ap-success h2 { font-size: 22px; font-weight: 700; color: ${T.primaryDk}; margin: 0 0 8px 0; }
        .ap-success p { font-size: 14px; color: ${T.muted}; }

        /* KPIs */
        .ap-result-kpis {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .ap-kpi-card {
          background: ${T.card};
          border: 2px solid ${T.border};
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .ap-kpi-card.success { border-color: ${T.primary}; background: ${T.primaryBg}; }
        .ap-kpi-icon { font-size: 20px; }
        .ap-kpi-val { font-size: 28px; font-weight: 800; color: ${T.text}; line-height: 1; }
        .ap-kpi-label { font-size: 11px; color: ${T.textSec}; }

        /* Warnings */
        .ap-warnings {
          padding: 14px 16px;
          background: ${T.warningBg};
          border-left: 4px solid ${T.warning};
          border-radius: 6px;
          margin-bottom: 20px;
        }
        .ap-warnings h4 { font-size: 13px; font-weight: 600; color: ${T.warningDk}; margin: 0 0 8px 0; }
        .ap-warning-item { font-size: 12px; color: ${T.warningDk}; margin-bottom: 4px; }

        /* Days grid */
        .ap-result-grid {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .ap-result-grid h3 { font-size: 14px; font-weight: 700; color: ${T.text}; margin: 0 0 12px 0; }
        .ap-days-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
        .ap-day-col { border: 1px solid ${T.border}; border-radius: 8px; overflow: hidden; }
        .ap-day-col.inactive { opacity: 0.35; }
        .ap-day-header {
          padding: 8px;
          text-align: center;
          background: ${T.borderLt};
          font-size: 12px;
          font-weight: 700;
          color: ${T.textSec};
          border-bottom: 1px solid ${T.border};
        }
        .ap-day-slots { padding: 6px; display: flex; flex-direction: column; gap: 5px; min-height: 60px; }
        .ap-day-slot {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          background: ${PALETTE.light};
          border-radius: 6px;
          border-left: 3px solid ${PALETTE.bg};
        }
        .ap-slot-avatar {
          width: 24px;
          height: 24px;
          border-radius: 5px;
          background: ${PALETTE.bg};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }
        .ap-slot-info { display: flex; flex-direction: column; min-width: 0; }
        .ap-slot-name {
          font-size: 11px;
          font-weight: 600;
          color: ${T.text};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ap-slot-time { font-size: 9px; color: ${T.muted}; }
        .ap-day-empty { padding: 16px; text-align: center; font-size: 11px; color: ${T.muted}; }
        .ap-day-off { padding: 16px; text-align: center; font-size: 11px; color: ${T.muted}; }

        /* Student hours */
        .ap-result-students {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .ap-result-students h3 { font-size: 14px; font-weight: 700; color: ${T.text}; margin: 0 0 12px 0; }
        .ap-student-hours-list { display: flex; flex-direction: column; gap: 10px; }
        .ap-sh-row { display: flex; align-items: center; gap: 10px; }
        .ap-sh-avatar {
          width: 32px;
          height: 32px;
          border-radius: 7px;
          background: ${PALETTE.bg};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }
        .ap-sh-info { flex: 1; min-width: 0; }
        .ap-sh-name { font-size: 13px; font-weight: 600; color: ${T.text}; display: block; margin-bottom: 4px; }
        .ap-sh-bar-wrap {
          height: 5px;
          background: ${T.borderLt};
          border-radius: 3px;
          overflow: hidden;
        }
        .ap-sh-bar {
          height: 100%;
          background: linear-gradient(90deg, ${T.info}, #764ba2);
          border-radius: 3px;
          transition: width 0.5s ease;
        }
        .ap-sh-hours { text-align: right; flex-shrink: 0; }
        .ap-sh-hours strong { font-size: 14px; color: ${T.text}; }
        .ap-sh-range { display: block; font-size: 10px; color: ${T.muted}; }
        .ap-sh-days { display: block; font-size: 10px; color: ${T.muted}; }
        .ap-sh-row.under { border-left: 3px solid ${T.warning}; padding-left: 8px; }
        .ap-sh-row.over { border-left: 3px solid ${T.danger}; padding-left: 8px; }
        .ap-sh-row.ok { border-left: 3px solid transparent; padding-left: 8px; }
        .ap-sh-badge {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .ap-sh-badge.under { background: ${T.warningBg}; color: ${T.warningDk}; }
        .ap-sh-badge.over { background: ${T.dangerBg}; color: ${T.dangerDk}; }

        /* Actions */
        .ap-result-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }
        .ap-action-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ap-action-btn.primary {
          background: ${T.primary};
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .ap-action-btn.primary:hover { background: ${T.primaryDk}; transform: translateY(-1px); }
        .ap-action-btn.secondary {
          background: ${T.borderLt};
          color: ${T.textSec};
        }
        .ap-action-btn.secondary:hover { background: ${T.border}; color: ${T.text}; }

        /* ═══ FOOTER ═══ */
        .ap-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: ${T.card};
          border-top: 1px solid ${T.border};
        }
        .ap-footer-left, .ap-footer-right { min-width: 120px; }
        .ap-footer-right { text-align: right; }
        .ap-footer-step { font-size: 12px; color: ${T.muted}; }
        .ap-nav-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ap-nav-btn.primary { background: ${T.info}; color: white; }
        .ap-nav-btn.primary:hover:not(:disabled) { background: ${T.infoDk}; }
        .ap-nav-btn.primary:disabled { background: ${T.border}; color: ${T.muted}; cursor: not-allowed; }
        .ap-nav-btn.secondary { background: ${T.borderLt}; color: ${T.textSec}; }
        .ap-nav-btn.secondary:hover { background: ${T.border}; }
        .ap-nav-btn.generate {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(102,126,234,0.4);
        }
        .ap-nav-btn.generate:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(102,126,234,0.5); }
        .ap-nav-btn.generate:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ═══ RESPONSIVE ═══ */
        @media (max-width: 700px) {
          .ap-period-cards { grid-template-columns: 1fr; }
          .ap-result-kpis { grid-template-columns: repeat(2, 1fr); }
          .ap-days-grid { grid-template-columns: repeat(3, 1fr); }
          .ap-stepper { gap: 0; overflow-x: auto; padding: 10px 12px; }
          .ap-step-label { display: none; }
          .ap-step-line { width: 24px; }
        }
        @media (max-width: 480px) {
          .ap-header { flex-direction: column; align-items: flex-start; }
          .ap-days-grid { grid-template-columns: repeat(2, 1fr); }
          .ap-result-actions { flex-direction: column; }
          .ap-action-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  )
}
