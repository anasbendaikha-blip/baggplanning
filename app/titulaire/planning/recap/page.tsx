'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  MOCK_EMPLOYEES,
  MOCK_DISPONIBILITES,
  JOURS_SEMAINE,
  getRoleColor,
  getRoleLabel,
  getRoleIcon,
  EmployeeRole,
} from '@/lib/mock-data'
import { calculateHours, formatHours, parseHoraire } from '@/lib/planning'
import { getWeekStart, formatWeekRange, addWeeks } from '@/lib/date-utils'
import { T, ROLE_PALETTE } from '@/lib/ui-tokens'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
  AreaChart, Area,
} from 'recharts'

// ============================================================
// Types & constantes
// ============================================================

const ALL_CATEGORIES: EmployeeRole[] = [
  'Pharmacien',
  'Preparateur',
  'Apprenti',
  'Etudiant',
  'Conditionneur',
]

const CATEGORY_LABELS: Record<EmployeeRole, string> = {
  Pharmacien: 'Pharmaciens',
  Preparateur: 'Préparateurs',
  Apprenti: 'Apprentis',
  Etudiant: 'Étudiants',
  Conditionneur: 'Conditionneurs',
}

type PeriodType = 'week' | 'month' | 'year'
type ViewType = 'employee' | 'category'
type SortKey = 'name' | 'category' | 'total' | 'overtime' | 'sunday' | 'night'
type SortDir = 'asc' | 'desc'

// ============================================================
// Calculs heures avec ventilation paie
// ============================================================

interface PayrollEntry {
  id: string
  prenom: string
  nom: string
  initiales: string
  fonction: EmployeeRole
  normalHours: number    // heures normales
  overtimeHours: number  // heures sup (>35h/sem)
  sundayHours: number    // heures dimanche
  nightHours: number     // heures nuit (>20h30)
  totalHours: number     // total brut
  dailyHours: Record<string, number> // par jour
}

const JOURS_KEYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const

// Simulated schedules for variable employees (from disponibilités + realistic assignments)
function getVariableEmployeeSchedule(empId: string): Record<string, string> {
  const dispo = MOCK_DISPONIBILITES.find(d => d.employee_id === empId)
  if (!dispo) return {}

  const schedule: Record<string, string> = {}
  JOURS_KEYS.forEach(jour => {
    const slot = dispo[jour]
    if (slot && typeof slot === 'string') {
      schedule[jour] = slot
    }
  })
  return schedule
}

function computePayrollEntries(): PayrollEntry[] {
  const result: PayrollEntry[] = []

  MOCK_EMPLOYEES.filter(e => e.actif).forEach(emp => {
    let weekTotal = 0
    let sundayH = 0
    let nightH = 0
    const dailyH: Record<string, number> = {}

    // Get effective schedule (fixed or variable)
    const isVariable = emp.typeEDT === 'variable'
    const variableSchedule = isVariable ? getVariableEmployeeSchedule(emp.id) : null

    JOURS_KEYS.forEach(jour => {
      const rawHoraire = isVariable
        ? (variableSchedule?.[jour] || 'non')
        : emp.horaires[jour]

      const parsed = parseHoraire(rawHoraire)
      if (!parsed) {
        dailyH[jour] = 0
        return
      }

      const rawHours = calculateHours(parsed.start, parsed.end, 0)
      const pauseMin = rawHours > 6 ? 30 : 0
      const netHours = calculateHours(parsed.start, parsed.end, pauseMin)
      dailyH[jour] = netHours
      weekTotal += netHours

      // Night hours: portion after 20:30
      const [endH, endM] = parsed.end.split(':').map(Number)
      const endMin = endH * 60 + endM
      const nightThreshold = 20 * 60 + 30 // 20h30
      if (endMin > nightThreshold) {
        const nightMin = endMin - nightThreshold
        nightH += nightMin / 60
      }

      // Sunday hours (samedi can be considered, but we don't have dimanche data)
      // We'll keep sundayH = 0 for now since the pharmacy data is lundi-samedi
    })

    // Overtime: hours above 35h/week
    const overtimeH = Math.max(0, weekTotal - 35)
    const normalH = weekTotal - overtimeH

    // Include all active employees even with 0 hours (they still appear in payroll)
    result.push({
      id: emp.id,
      prenom: emp.prenom,
      nom: emp.nom || '',
      initiales: emp.initiales,
      fonction: emp.fonction,
      normalHours: normalH,
      overtimeHours: overtimeH,
      sundayHours: sundayH,
      nightHours: Math.round(nightH * 100) / 100,
      totalHours: weekTotal,
      dailyHours: dailyH,
    })
  })

  return result
}

// ============================================================
// Period helpers
// ============================================================

function getPeriodMultiplier(period: PeriodType): number {
  return period === 'week' ? 1 : period === 'month' ? 4.3 : 52
}

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

// ============================================================
// Custom Tooltips (Recharts)
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rc-tooltip">
      <div className="rc-tooltip-title">
        <span className="rc-tooltip-dot" style={{ background: d.color }} />
        {d.name}
      </div>
      <div className="rc-tooltip-row"><span>Total</span><strong>{d.heures}h</strong></div>
      <div className="rc-tooltip-row"><span>Normales</span><span>{d.normales}h</span></div>
      {d.supplementaires > 0 && <div className="rc-tooltip-row"><span>Sup</span><span>{d.supplementaires}h</span></div>}
      {d.nuit > 0 && <div className="rc-tooltip-row"><span>Nuit</span><span>{d.nuit}h</span></div>}
      <div className="rc-tooltip-row" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 3, marginTop: 3 }}>
        <span>Effectif</span><span>{d.effectif} emp.</span>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rc-tooltip">
      <div className="rc-tooltip-title">
        <span className="rc-tooltip-dot" style={{ background: d.payload.color }} />
        {d.name}
      </div>
      <div className="rc-tooltip-row"><span>Heures</span><strong>{d.value}h</strong></div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rc-tooltip">
      <div className="rc-tooltip-title">{label}</div>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div className="rc-tooltip-row" key={i}>
          <span><span className="rc-tooltip-dot" style={{ background: p.color }} />{p.name === 'heures' ? 'Total' : 'Sup'}</span>
          <strong>{p.value}h</strong>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Page
// ============================================================

export default function RecapPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date(2026, 0, 26)))
  const [currentMonth, setCurrentMonth] = useState(0)
  const [currentYear, setCurrentYear] = useState(2026)
  const [period, setPeriod] = useState<PeriodType>('week')
  const [view, setView] = useState<ViewType>('employee')
  const [expandedCat, setExpandedCat] = useState<EmployeeRole | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('category')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [validatedMonth, setValidatedMonth] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCat, setFilterCat] = useState<EmployeeRole | 'all'>('all')

  const weekLabel = formatWeekRange(weekStart)

  // Navigation
  const handlePrev = () => {
    if (period === 'week') setWeekStart(addWeeks(weekStart, -1))
    else if (period === 'month') setCurrentMonth(m => m <= 0 ? 11 : m - 1)
    else setCurrentYear(y => y - 1)
  }
  const handleNext = () => {
    if (period === 'week') setWeekStart(addWeeks(weekStart, 1))
    else if (period === 'month') setCurrentMonth(m => m >= 11 ? 0 : m + 1)
    else setCurrentYear(y => y + 1)
  }
  const handleToday = () => {
    if (period === 'week') setWeekStart(getWeekStart(new Date(2026, 0, 26)))
    else if (period === 'month') setCurrentMonth(0)
    else setCurrentYear(2026)
  }

  // Payroll data
  const payrollData = useMemo(() => computePayrollEntries(), [])
  const multiplier = getPeriodMultiplier(period)

  // Period label
  const periodLabel = period === 'week'
    ? `Semaine du ${weekLabel}`
    : period === 'month'
      ? `${MONTH_NAMES[currentMonth]} ${currentYear}`
      : `Année ${currentYear}`

  // Scaled data
  const scaledData = useMemo(() => {
    return payrollData.map(e => ({
      ...e,
      normalHours: Math.round(e.normalHours * multiplier * 10) / 10,
      overtimeHours: Math.round(e.overtimeHours * multiplier * 10) / 10,
      sundayHours: Math.round(e.sundayHours * multiplier * 10) / 10,
      nightHours: Math.round(e.nightHours * multiplier * 10) / 10,
      totalHours: Math.round(e.totalHours * multiplier * 10) / 10,
    }))
  }, [payrollData, multiplier])

  // Filtered & sorted data
  const filteredData = useMemo(() => {
    let data = scaledData
    if (filterCat !== 'all') {
      data = data.filter(e => e.fonction === filterCat)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      data = data.filter(e =>
        `${e.prenom} ${e.nom}`.toLowerCase().includes(q) ||
        e.initiales.toLowerCase().includes(q)
      )
    }
    return data
  }, [scaledData, filterCat, searchQuery])

  const sortedData = useMemo(() => {
    const roleOrder: Record<EmployeeRole, number> = {
      Pharmacien: 1, Preparateur: 2, Apprenti: 3, Etudiant: 4, Conditionneur: 5,
    }
    return [...filteredData].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name': cmp = `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`); break
        case 'category': cmp = roleOrder[a.fonction] - roleOrder[b.fonction]; break
        case 'total': cmp = a.totalHours - b.totalHours; break
        case 'overtime': cmp = a.overtimeHours - b.overtimeHours; break
        case 'sunday': cmp = a.sundayHours - b.sundayHours; break
        case 'night': cmp = a.nightHours - b.nightHours; break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filteredData, sortKey, sortDir])

  // KPI aggregates
  const kpi = useMemo(() => {
    const totalNormal = scaledData.reduce((s, e) => s + e.normalHours, 0)
    const totalOvertime = scaledData.reduce((s, e) => s + e.overtimeHours, 0)
    const totalSunday = scaledData.reduce((s, e) => s + e.sundayHours, 0)
    const totalNight = scaledData.reduce((s, e) => s + e.nightHours, 0)
    const totalAll = scaledData.reduce((s, e) => s + e.totalHours, 0)
    const empWithHours = scaledData.filter(e => e.totalHours > 0).length
    const avgHours = empWithHours > 0 ? totalAll / empWithHours : 0
    return { totalNormal, totalOvertime, totalSunday, totalNight, totalAll, empWithHours, avgHours }
  }, [scaledData])

  // Category totals (for category view)
  const categoryData = useMemo(() => {
    return ALL_CATEGORIES.map(cat => {
      const emps = scaledData.filter(e => e.fonction === cat)
      const totalH = emps.reduce((s, e) => s + e.totalHours, 0)
      const normalH = emps.reduce((s, e) => s + e.normalHours, 0)
      const overtimeH = emps.reduce((s, e) => s + e.overtimeHours, 0)
      const nightH = emps.reduce((s, e) => s + e.nightHours, 0)
      return {
        id: cat,
        name: CATEGORY_LABELS[cat],
        icon: getRoleIcon(cat),
        color: getRoleColor(cat),
        empCount: emps.length,
        totalHours: totalH,
        normalHours: normalH,
        overtimeHours: overtimeH,
        nightHours: nightH,
        employees: emps,
      }
    }).filter(c => c.empCount > 0)
  }, [scaledData])

  // Chart data: Bar chart (heures par catégorie)
  const chartCategoryData = useMemo(() => {
    return categoryData.map(cat => ({
      name: cat.name,
      role: cat.id,
      heures: Math.round(cat.totalHours * 10) / 10,
      normales: Math.round(cat.normalHours * 10) / 10,
      supplementaires: Math.round(cat.overtimeHours * 10) / 10,
      nuit: Math.round(cat.nightHours * 10) / 10,
      effectif: cat.empCount,
      color: ROLE_PALETTE[cat.id as EmployeeRole].bg,
    }))
  }, [categoryData])

  // Chart data: Donut (répartition des heures)
  const hoursBreakdownData = useMemo(() => {
    const items = [
      { name: 'H. normales', value: Math.round(kpi.totalNormal * 10) / 10, color: T.primary },
      { name: 'H. sup', value: Math.round(kpi.totalOvertime * 10) / 10, color: T.warning },
      { name: 'H. nuit', value: Math.round(kpi.totalNight * 10) / 10, color: '#8b5cf6' },
    ]
    return items.filter(d => d.value > 0)
  }, [kpi])

  // Chart data: Area chart (évolution hebdo — mock trend)
  const evolutionData = useMemo(() => {
    const baseTotal = kpi.totalAll / multiplier
    const baseSup = kpi.totalOvertime / multiplier
    // Deterministic pseudo-random based on index
    const variations = [0.88, 0.95, 1.02, 0.91, 0.97, 1.0]
    const supVariations = [0.6, 0.85, 1.1, 0.75, 0.95, 1.0]
    return ['S-5', 'S-4', 'S-3', 'S-2', 'S-1', 'Actuelle'].map((label, i) => ({
      semaine: label,
      heures: Math.round(baseTotal * variations[i] * 10) / 10,
      supplementaires: Math.round(baseSup * supVariations[i] * 10) / 10,
    }))
  }, [kpi, multiplier])

  // Sort handler
  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' || key === 'category' ? 'asc' : 'desc')
    }
  }, [sortKey])

  // Export CSV
  const handleExport = useCallback(() => {
    const header = 'Employé;Catégorie;Heures normales;Heures sup;Dimanches;Nuit/Gardes;Total\n'
    const rows = sortedData.map(e =>
      `${e.prenom} ${e.nom};${getRoleLabel(e.fonction)};${formatHours(e.normalHours)};${formatHours(e.overtimeHours)};${formatHours(e.sundayHours)};${formatHours(e.nightHours)};${formatHours(e.totalHours)}`
    ).join('\n')
    const totalsRow = `TOTAL;;${formatHours(kpi.totalNormal)};${formatHours(kpi.totalOvertime)};${formatHours(kpi.totalSunday)};${formatHours(kpi.totalNight)};${formatHours(kpi.totalAll)}`
    const csv = '\uFEFF' + header + rows + '\n' + totalsRow
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paie_${periodLabel.replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [sortedData, kpi, periodLabel])

  // Validate month
  const monthKey = `${currentYear}-${currentMonth}`
  const isValidated = validatedMonth === monthKey
  const handleValidate = () => {
    setValidatedMonth(isValidated ? null : monthKey)
  }

  // Sort icon
  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return '↕'
    return sortDir === 'asc' ? '↑' : '↓'
  }

  return (
    <>
      <div className="rc-page">
        {/* ======== TOP BAR ======== */}
        <div className="rc-topbar">
          <div className="rc-topbar-left">
            <Link href="/titulaire/planning" className="rc-back">← Planning</Link>
            <div className="rc-title-group">
              <h1 className="rc-title">Récapitulatif paie</h1>
              <span className="rc-title-sub">Suivi des heures • Préparation paie</span>
            </div>
          </div>

          <div className="rc-topbar-right">
            {/* Period selector */}
            <div className="rc-period-tabs">
              {(['week', 'month', 'year'] as PeriodType[]).map(p => (
                <button
                  key={p}
                  className={`rc-period-tab ${period === p ? 'active' : ''}`}
                  onClick={() => setPeriod(p)}
                >
                  {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
                </button>
              ))}
            </div>

            {/* Period navigation */}
            <div className="rc-nav">
              <button className="rc-nav-btn" onClick={handlePrev}>◀</button>
              <button className="rc-nav-btn" onClick={handleNext}>▶</button>
              <button className="rc-nav-today" onClick={handleToday}>Aujourd&apos;hui</button>
            </div>
          </div>
        </div>

        {/* ======== KPI HERO ======== */}
        <div className="rc-kpi">
          <div className="rc-kpi-top">
            <div className="rc-kpi-left">
              <span className="rc-kpi-label">{periodLabel}</span>
              <div className="rc-kpi-value-row">
                <span className="rc-kpi-value">{formatHours(kpi.totalAll)}</span>
                <span className="rc-kpi-unit">total heures</span>
              </div>
              <div className="rc-kpi-breakdown">
                {kpi.totalOvertime > 0 && (
                  <span className="rc-kpi-badge overtime">⏰ {formatHours(kpi.totalOvertime)} sup</span>
                )}
                {kpi.totalNight > 0 && (
                  <span className="rc-kpi-badge night">🌙 {formatHours(kpi.totalNight)} nuit</span>
                )}
                {kpi.totalSunday > 0 && (
                  <span className="rc-kpi-badge sunday">📅 {formatHours(kpi.totalSunday)} dim.</span>
                )}
              </div>
            </div>
            <div className="rc-kpi-right">
              {period === 'month' && (
                <button
                  className={`rc-validate-btn ${isValidated ? 'validated' : ''}`}
                  onClick={handleValidate}
                >
                  {isValidated ? '✓ Mois validé' : '✓ Valider le mois'}
                </button>
              )}
              <button className="rc-export-btn" onClick={handleExport}>
                📥 Exporter CSV
              </button>
            </div>
          </div>

          {/* Mini KPI row */}
          <div className="rc-kpi-minis">
            <div className="rc-mini">
              <span className="rc-mini-value">{kpi.empWithHours}</span>
              <span className="rc-mini-label">Employés actifs</span>
            </div>
            <div className="rc-mini">
              <span className="rc-mini-value">{formatHours(kpi.totalNormal)}</span>
              <span className="rc-mini-label">H. normales</span>
            </div>
            <div className="rc-mini">
              <span className="rc-mini-value">{formatHours(kpi.totalOvertime)}</span>
              <span className="rc-mini-label">H. sup (&gt;35h)</span>
            </div>
            <div className="rc-mini">
              <span className="rc-mini-value">{formatHours(kpi.avgHours)}</span>
              <span className="rc-mini-label">Moy./employé</span>
            </div>
          </div>
        </div>

        {/* ======== CHARTS SECTION ======== */}
        <div className="rc-charts-section">
          <div className="rc-charts-grid">

            {/* Bar Chart — Heures par catégorie */}
            <div className="rc-chart-card">
              <div className="rc-chart-header">
                <h3 className="rc-chart-title">📊 Heures par catégorie</h3>
                <span className="rc-chart-sub">{categoryData.length} catégories</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartCategoryData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderLt} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} axisLine={{ stroke: T.border }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} axisLine={{ stroke: T.border }} unit="h" />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="heures" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {chartCategoryData.map(d => (
                      <Cell key={d.role} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Donut — Répartition des heures */}
            <div className="rc-chart-card rc-chart-donut-wrap">
              <div className="rc-chart-header">
                <h3 className="rc-chart-title">🍩 Répartition des heures</h3>
                <span className="rc-chart-sub">{formatHours(kpi.totalAll)} total</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={hoursBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {hoursBreakdownData.map(d => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="rc-donut-center">
                <span className="rc-donut-center-value">{formatHours(kpi.totalAll)}</span>
                <span className="rc-donut-center-label">total</span>
              </div>
            </div>

            {/* AreaChart — Évolution hebdo */}
            <div className="rc-chart-card rc-chart-wide">
              <div className="rc-chart-header">
                <h3 className="rc-chart-title">📈 Tendance hebdomadaire</h3>
                <span className="rc-chart-sub">6 dernières semaines</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={evolutionData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradHeures" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.info} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={T.info} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderLt} />
                  <XAxis dataKey="semaine" tick={{ fontSize: 11, fill: T.textSec }} axisLine={{ stroke: T.border }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} axisLine={{ stroke: T.border }} unit="h" />
                  <Tooltip content={<LineTooltip />} />
                  <Area type="monotone" dataKey="heures" stroke={T.info} fill="url(#gradHeures)" strokeWidth={2} name="heures" />
                  <Area type="monotone" dataKey="supplementaires" stroke={T.warning} fill="none" strokeWidth={2} strokeDasharray="5 5" name="supplementaires" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>

        {/* ======== TOOLBAR ======== */}
        <div className="rc-toolbar">
          <div className="rc-toolbar-left">
            {/* View tabs */}
            <div className="rc-view-tabs">
              <button
                className={`rc-view-tab ${view === 'employee' ? 'active' : ''}`}
                onClick={() => setView('employee')}
              >
                👤 Par employé
              </button>
              <button
                className={`rc-view-tab ${view === 'category' ? 'active' : ''}`}
                onClick={() => setView('category')}
              >
                📋 Par catégorie
              </button>
            </div>

            {/* Category filter */}
            {view === 'employee' && (
              <select
                className="rc-filter-select"
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value as EmployeeRole | 'all')}
              >
                <option value="all">Toutes catégories</option>
                {ALL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{getRoleIcon(cat)} {CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
            )}
          </div>

          <div className="rc-toolbar-right">
            {/* Search */}
            {view === 'employee' && (
              <div className="rc-search-wrap">
                <span className="rc-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Rechercher un employé..."
                  className="rc-search-input"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="rc-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ======== DATA TABLE / BREAKDOWN ======== */}
        <div className="rc-content">
          <div className="rc-content-scroll">
            {view === 'employee' ? (
              /* ── Employee table ── */
              <div className="rc-table-wrap">
                <table className="rc-table">
                  <thead>
                    <tr>
                      <th className="rc-th rc-th-name" onClick={() => handleSort('name')}>
                        Employé {sortIcon('name')}
                      </th>
                      <th className="rc-th rc-th-cat" onClick={() => handleSort('category')}>
                        Catégorie {sortIcon('category')}
                      </th>
                      <th className="rc-th rc-th-num rc-th-normal" onClick={() => handleSort('total')}>
                        H. normales {sortIcon('total')}
                      </th>
                      <th className="rc-th rc-th-num rc-th-overtime" onClick={() => handleSort('overtime')}>
                        H. sup {sortIcon('overtime')}
                      </th>
                      <th className="rc-th rc-th-num rc-th-sunday" onClick={() => handleSort('sunday')}>
                        Dimanche {sortIcon('sunday')}
                      </th>
                      <th className="rc-th rc-th-num rc-th-night" onClick={() => handleSort('night')}>
                        Nuit {sortIcon('night')}
                      </th>
                      <th className="rc-th rc-th-num rc-th-total" onClick={() => handleSort('total')}>
                        Total {sortIcon('total')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map(emp => {
                      const palette = ROLE_PALETTE[emp.fonction]
                      const hasOvertime = emp.overtimeHours > 0
                      const hasNight = emp.nightHours > 0
                      return (
                        <tr key={emp.id} className={`rc-tr ${emp.totalHours === 0 ? 'rc-tr-zero' : ''}`}>
                          <td className="rc-td rc-td-name">
                            <div className="rc-emp-cell">
                              <div className="rc-emp-avatar" style={{ background: palette.bg }}>
                                {emp.initiales}
                              </div>
                              <div className="rc-emp-info">
                                <span className="rc-emp-fullname">{emp.prenom} {emp.nom}</span>
                              </div>
                            </div>
                          </td>
                          <td className="rc-td rc-td-cat">
                            <span className="rc-cat-badge" style={{ background: palette.light, color: palette.dark, borderColor: palette.border }}>
                              {getRoleIcon(emp.fonction)} {getRoleLabel(emp.fonction)}
                            </span>
                          </td>
                          <td className="rc-td rc-td-num rc-td-normal">
                            <strong>{formatHours(emp.normalHours)}</strong>
                          </td>
                          <td className={`rc-td rc-td-num ${hasOvertime ? 'rc-highlight-overtime' : ''}`}>
                            {emp.overtimeHours > 0 ? formatHours(emp.overtimeHours) : '–'}
                          </td>
                          <td className="rc-td rc-td-num">
                            {emp.sundayHours > 0 ? formatHours(emp.sundayHours) : '–'}
                          </td>
                          <td className={`rc-td rc-td-num ${hasNight ? 'rc-highlight-night' : ''}`}>
                            {emp.nightHours > 0 ? formatHours(emp.nightHours) : '–'}
                          </td>
                          <td className="rc-td rc-td-num rc-td-total">
                            <strong>{formatHours(emp.totalHours)}</strong>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="rc-tfoot-row">
                      <td className="rc-td" colSpan={2}>
                        <strong>TOTAL ({filteredData.length} employés)</strong>
                      </td>
                      <td className="rc-td rc-td-num rc-td-normal">
                        <strong>{formatHours(filteredData.reduce((s, e) => s + e.normalHours, 0))}</strong>
                      </td>
                      <td className="rc-td rc-td-num rc-highlight-overtime">
                        <strong>{formatHours(filteredData.reduce((s, e) => s + e.overtimeHours, 0))}</strong>
                      </td>
                      <td className="rc-td rc-td-num">
                        <strong>{formatHours(filteredData.reduce((s, e) => s + e.sundayHours, 0))}</strong>
                      </td>
                      <td className="rc-td rc-td-num rc-highlight-night">
                        <strong>{formatHours(filteredData.reduce((s, e) => s + e.nightHours, 0))}</strong>
                      </td>
                      <td className="rc-td rc-td-num rc-td-total">
                        <strong>{formatHours(filteredData.reduce((s, e) => s + e.totalHours, 0))}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
                {sortedData.length === 0 && (
                  <div className="rc-empty">
                    Aucun employé trouvé{searchQuery ? ` pour "${searchQuery}"` : ''}.
                  </div>
                )}
              </div>
            ) : (
              /* ── Category view ── */
              <div className="rc-cat-list">
                {categoryData.map(cat => (
                  <div key={cat.id} className="rc-cat-group">
                    <div
                      className="rc-cat-header"
                      onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                      style={{ borderLeftColor: cat.color }}
                    >
                      <div className="rc-cat-left">
                        <span className="rc-cat-icon">{cat.icon}</span>
                        <span className="rc-cat-name">{cat.name}</span>
                        <span className="rc-cat-count">{cat.empCount} emp.</span>
                        <span className="rc-cat-chevron">{expandedCat === cat.id ? '▾' : '▸'}</span>
                      </div>
                      <div className="rc-cat-right">
                        {cat.overtimeHours > 0 && (
                          <span className="rc-cat-tag overtime">⏰ {formatHours(cat.overtimeHours)} sup</span>
                        )}
                        {cat.nightHours > 0 && (
                          <span className="rc-cat-tag night">🌙 {formatHours(cat.nightHours)} nuit</span>
                        )}
                        <span className="rc-cat-total">{formatHours(cat.totalHours)}</span>
                        <div className="rc-cat-bar-wrap">
                          <div
                            className="rc-cat-bar"
                            style={{
                              width: `${kpi.totalAll > 0 ? Math.round((cat.totalHours / kpi.totalAll) * 100) : 0}%`,
                              background: cat.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded employees in table form */}
                    {expandedCat === cat.id && (
                      <div className="rc-cat-detail">
                        <table className="rc-table rc-table-sub">
                          <thead>
                            <tr>
                              <th className="rc-th rc-th-name">Employé</th>
                              <th className="rc-th rc-th-num">Normales</th>
                              <th className="rc-th rc-th-num">Sup</th>
                              <th className="rc-th rc-th-num">Nuit</th>
                              <th className="rc-th rc-th-num rc-th-total">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cat.employees.map(emp => (
                              <tr key={emp.id} className="rc-tr">
                                <td className="rc-td rc-td-name">
                                  <div className="rc-emp-cell">
                                    <div className="rc-emp-avatar-sm" style={{ background: cat.color }}>
                                      {emp.initiales}
                                    </div>
                                    <span className="rc-sub-emp-name">{emp.prenom} {emp.nom}</span>
                                  </div>
                                </td>
                                <td className="rc-td rc-td-num rc-td-normal">
                                  <strong>{formatHours(emp.normalHours)}</strong>
                                </td>
                                <td className="rc-td rc-td-num">
                                  {emp.overtimeHours > 0 ? formatHours(emp.overtimeHours) : '–'}
                                </td>
                                <td className="rc-td rc-td-num">
                                  {emp.nightHours > 0 ? formatHours(emp.nightHours) : '–'}
                                </td>
                                <td className="rc-td rc-td-num rc-td-total">
                                  <strong>{formatHours(emp.totalHours)}</strong>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Validated banner */}
        {isValidated && period === 'month' && (
          <div className="rc-validated-banner">
            ✓ {MONTH_NAMES[currentMonth]} {currentYear} validé pour la paie
          </div>
        )}
      </div>

      {/* ======== STYLES ======== */}
      <style jsx global>{`
        /* ============ Page ============ */
        .rc-page {
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 72px);
          background: ${T.bg};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow-y: auto;
        }

        /* ============ Top Bar ============ */
        .rc-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          background: ${T.card};
          border-bottom: 1px solid ${T.border};
          flex-wrap: wrap;
          gap: 8px;
        }
        .rc-topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .rc-back {
          padding: 4px 10px;
          background: ${T.borderLt};
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          color: ${T.textSec};
          text-decoration: none;
          transition: background 0.15s;
        }
        .rc-back:hover { background: ${T.border}; }
        .rc-title-group { display: flex; flex-direction: column; }
        .rc-title {
          font-size: 18px;
          font-weight: 800;
          color: ${T.text};
          margin: 0;
          line-height: 1.2;
        }
        .rc-title-sub {
          font-size: 11px;
          color: ${T.muted};
          font-weight: 500;
        }
        .rc-topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Period tabs */
        .rc-period-tabs {
          display: flex;
          gap: 2px;
          background: ${T.borderLt};
          border-radius: 7px;
          padding: 2px;
        }
        .rc-period-tab {
          padding: 5px 12px;
          border: none;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 600;
          color: ${T.textSec};
          background: transparent;
          cursor: pointer;
          transition: all 0.15s;
        }
        .rc-period-tab:hover { color: ${T.text}; }
        .rc-period-tab.active {
          background: ${T.card};
          color: ${T.info};
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        /* Nav */
        .rc-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .rc-nav-btn {
          width: 28px;
          height: 28px;
          border: 1px solid ${T.border};
          border-radius: 5px;
          background: ${T.card};
          cursor: pointer;
          font-size: 11px;
          color: ${T.textSec};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rc-nav-btn:hover { background: ${T.borderLt}; }
        .rc-nav-today {
          padding: 4px 10px;
          border: none;
          border-radius: 5px;
          background: ${T.infoLt};
          font-size: 11px;
          font-weight: 500;
          color: ${T.infoDk};
          cursor: pointer;
        }
        .rc-nav-today:hover { background: #bfdbfe; }

        /* ============ KPI Hero ============ */
        .rc-kpi {
          margin: 12px 16px 0;
          padding: 16px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
        }
        .rc-kpi-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .rc-kpi-left { flex-shrink: 0; }
        .rc-kpi-label {
          font-size: 12px;
          opacity: 0.8;
          display: block;
          margin-bottom: 2px;
        }
        .rc-kpi-value-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .rc-kpi-value {
          font-size: 36px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .rc-kpi-unit {
          font-size: 14px;
          opacity: 0.7;
        }
        .rc-kpi-breakdown {
          display: flex;
          gap: 6px;
          margin-top: 6px;
          flex-wrap: wrap;
        }
        .rc-kpi-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 10px;
          white-space: nowrap;
        }
        .rc-kpi-badge.overtime { background: rgba(251,191,36,0.25); color: #fef3c7; }
        .rc-kpi-badge.night { background: rgba(139,92,246,0.3); color: #ede9fe; }
        .rc-kpi-badge.sunday { background: rgba(59,130,246,0.3); color: #dbeafe; }
        .rc-kpi-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        /* Validate & Export buttons */
        .rc-validate-btn {
          padding: 8px 16px;
          border: 2px solid rgba(255,255,255,0.5);
          border-radius: 8px;
          background: rgba(255,255,255,0.15);
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .rc-validate-btn:hover {
          background: rgba(255,255,255,0.25);
          border-color: rgba(255,255,255,0.8);
        }
        .rc-validate-btn.validated {
          background: rgba(16,185,129,0.3);
          border-color: ${T.primary};
          color: #d1fae5;
        }
        .rc-export-btn {
          padding: 7px 14px;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 7px;
          background: rgba(255,255,255,0.1);
          color: white;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .rc-export-btn:hover {
          background: rgba(255,255,255,0.2);
        }

        /* Mini KPIs */
        .rc-kpi-minis {
          display: flex;
          gap: 0;
          border-top: 1px solid rgba(255,255,255,0.15);
          padding-top: 10px;
        }
        .rc-mini {
          flex: 1;
          text-align: center;
        }
        .rc-mini:not(:last-child) {
          border-right: 1px solid rgba(255,255,255,0.12);
        }
        .rc-mini-value {
          display: block;
          font-size: 16px;
          font-weight: 700;
        }
        .rc-mini-label {
          display: block;
          font-size: 10px;
          opacity: 0.65;
          margin-top: 1px;
        }

        /* ============ Toolbar ============ */
        .rc-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          gap: 8px;
          flex-wrap: wrap;
        }
        .rc-toolbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rc-toolbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rc-view-tabs {
          display: flex;
          gap: 2px;
          background: ${T.borderLt};
          border-radius: 7px;
          padding: 2px;
        }
        .rc-view-tab {
          padding: 5px 14px;
          border: none;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 600;
          color: ${T.textSec};
          background: transparent;
          cursor: pointer;
          transition: all 0.15s;
        }
        .rc-view-tab:hover { color: ${T.text}; }
        .rc-view-tab.active {
          background: ${T.card};
          color: ${T.info};
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .rc-filter-select {
          padding: 5px 10px;
          border: 1px solid ${T.border};
          border-radius: 6px;
          font-size: 12px;
          color: ${T.text};
          background: ${T.card};
          cursor: pointer;
          outline: none;
        }
        .rc-filter-select:focus {
          border-color: ${T.info};
          box-shadow: 0 0 0 2px ${T.infoLt};
        }

        /* Search */
        .rc-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .rc-search-icon {
          position: absolute;
          left: 8px;
          font-size: 12px;
          pointer-events: none;
        }
        .rc-search-input {
          padding: 5px 28px 5px 26px;
          border: 1px solid ${T.border};
          border-radius: 6px;
          font-size: 12px;
          color: ${T.text};
          background: ${T.card};
          width: 180px;
          outline: none;
          transition: all 0.15s;
        }
        .rc-search-input:focus {
          border-color: ${T.info};
          box-shadow: 0 0 0 2px ${T.infoLt};
          width: 220px;
        }
        .rc-search-input::placeholder { color: ${T.muted}; }
        .rc-search-clear {
          position: absolute;
          right: 6px;
          background: none;
          border: none;
          font-size: 12px;
          color: ${T.muted};
          cursor: pointer;
          padding: 0 2px;
        }
        .rc-search-clear:hover { color: ${T.text}; }

        /* ============ Content ============ */
        .rc-content {
          margin: 0 16px 12px;
          border: 1px solid ${T.border};
          border-radius: 10px;
          background: ${T.card};
          box-shadow: ${T.shadow};
        }
        .rc-content-scroll {
          overflow-x: auto;
          max-height: 60vh;
          overflow-y: auto;
        }

        /* ============ Table (employee view) ============ */
        .rc-table-wrap {
          min-width: 700px;
        }
        .rc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .rc-table thead { position: sticky; top: 0; z-index: 2; }
        .rc-th {
          padding: 10px 12px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: ${T.textSec};
          background: ${T.borderLt};
          border-bottom: 1px solid ${T.border};
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
          transition: background 0.1s;
        }
        .rc-th:hover { background: ${T.border}; color: ${T.text}; }
        .rc-th-num { text-align: right; }
        .rc-th-name { min-width: 160px; }
        .rc-th-cat { min-width: 130px; }
        .rc-th-overtime { color: ${T.warningDk}; }
        .rc-th-night { color: #7c3aed; }
        .rc-th-sunday { color: ${T.info}; }
        .rc-th-total { color: ${T.text}; }

        .rc-tr {
          border-bottom: 1px solid ${T.borderLt};
          transition: background 0.1s;
        }
        .rc-tr:hover { background: #fafbfc; }
        .rc-tr-zero { opacity: 0.5; }
        .rc-td {
          padding: 8px 12px;
          vertical-align: middle;
        }
        .rc-td-num { text-align: right; font-variant-numeric: tabular-nums; }
        .rc-td-normal { color: ${T.text}; font-weight: 600; }
        .rc-td-total { font-weight: 700; color: ${T.text}; }
        .rc-th-normal { color: ${T.primaryDk}; }

        .rc-highlight-overtime { color: ${T.warningDk}; font-weight: 600; }
        .rc-highlight-night { color: #7c3aed; font-weight: 600; }

        /* Employee cell */
        .rc-emp-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rc-emp-avatar {
          width: 30px;
          height: 30px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 10px;
          color: white;
          flex-shrink: 0;
        }
        .rc-emp-avatar-sm {
          width: 24px;
          height: 24px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 9px;
          color: white;
          flex-shrink: 0;
        }
        .rc-sub-emp-name {
          font-size: 13px;
          font-weight: 600;
          color: ${T.text};
        }
        .rc-emp-info { display: flex; flex-direction: column; }
        .rc-emp-fullname {
          font-size: 13px;
          font-weight: 600;
          color: ${T.text};
          line-height: 1.2;
        }

        /* Category badge */
        .rc-cat-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid;
          white-space: nowrap;
        }

        /* Footer */
        .rc-tfoot-row {
          background: ${T.borderLt};
          border-top: 2px solid ${T.border};
        }
        .rc-tfoot-row td {
          padding: 10px 12px;
          font-size: 13px;
        }

        .rc-empty {
          padding: 40px;
          text-align: center;
          color: ${T.muted};
          font-size: 14px;
        }

        /* ============ Category view ============ */
        .rc-cat-list {
          display: flex;
          flex-direction: column;
        }
        .rc-cat-group {}
        .rc-cat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid ${T.borderLt};
          border-left: 4px solid transparent;
          cursor: pointer;
          transition: background 0.1s;
          gap: 12px;
        }
        .rc-cat-header:hover { background: #fafbfc; }
        .rc-cat-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .rc-cat-icon { font-size: 16px; }
        .rc-cat-name {
          font-size: 14px;
          font-weight: 700;
          color: ${T.text};
        }
        .rc-cat-count {
          font-size: 10px;
          color: ${T.muted};
          background: ${T.borderLt};
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 500;
        }
        .rc-cat-chevron {
          font-size: 10px;
          color: ${T.muted};
        }
        .rc-cat-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          justify-content: flex-end;
        }
        .rc-cat-tag {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .rc-cat-tag.overtime { background: ${T.warningLt}; color: ${T.warningDk}; }
        .rc-cat-tag.night { background: #ede9fe; color: #6d28d9; }
        .rc-cat-total {
          font-size: 15px;
          font-weight: 800;
          color: ${T.text};
          min-width: 55px;
          text-align: right;
        }
        .rc-cat-bar-wrap {
          width: 80px;
          height: 6px;
          background: ${T.borderLt};
          border-radius: 3px;
          overflow: hidden;
        }
        .rc-cat-bar {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
          min-width: 2px;
        }

        /* Category detail */
        .rc-cat-detail {
          background: #f8fafc;
          border-bottom: 1px solid ${T.borderLt};
          padding: 4px 8px 8px 20px;
        }
        .rc-table-sub {
          font-size: 12px;
        }
        .rc-table-sub .rc-th {
          padding: 6px 10px;
          font-size: 10px;
          background: transparent;
          border-bottom: 1px solid ${T.borderLt};
        }
        .rc-table-sub .rc-td {
          padding: 6px 10px;
        }
        .rc-table-sub .rc-tr {
          border-bottom: 1px solid ${T.borderLt};
        }
        .rc-table-sub .rc-tr:last-child { border-bottom: none; }

        /* ============ Validated banner ============ */
        .rc-validated-banner {
          padding: 8px 16px;
          background: ${T.primaryLt};
          color: ${T.primaryDk};
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          border-top: 1px solid ${T.primary};
        }

        /* ============ Charts ============ */
        .rc-charts-section {
          margin: 0 16px;
          padding: 12px 0;
        }
        .rc-charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .rc-chart-card {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          padding: 16px;
          box-shadow: ${T.shadow};
          position: relative;
        }
        .rc-chart-wide {
          grid-column: 1 / -1;
        }
        .rc-chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .rc-chart-title {
          font-size: 14px;
          font-weight: 700;
          color: ${T.text};
          margin: 0;
        }
        .rc-chart-sub {
          font-size: 11px;
          color: ${T.muted};
          font-weight: 500;
        }

        /* Donut center label */
        .rc-chart-donut-wrap {
          position: relative;
        }
        .rc-donut-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -15%);
          text-align: center;
          pointer-events: none;
        }
        .rc-donut-center-value {
          font-size: 18px;
          font-weight: 800;
          color: ${T.text};
          display: block;
          line-height: 1.1;
        }
        .rc-donut-center-label {
          font-size: 10px;
          color: ${T.muted};
        }

        /* Custom tooltips */
        .rc-tooltip {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 8px;
          padding: 10px 14px;
          box-shadow: ${T.shadowMd};
          font-size: 12px;
          min-width: 140px;
        }
        .rc-tooltip-title {
          font-weight: 700;
          color: ${T.text};
          margin-bottom: 4px;
          font-size: 13px;
        }
        .rc-tooltip-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          color: ${T.textSec};
          padding: 1px 0;
          font-size: 12px;
        }
        .rc-tooltip-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 6px;
          vertical-align: middle;
        }

        /* Recharts overrides */
        .recharts-legend-item-text {
          color: ${T.textSec} !important;
          font-size: 12px !important;
        }

        /* ============ Responsive ============ */
        @media (max-width: 900px) {
          .rc-topbar { padding: 8px 12px; }
          .rc-kpi { margin: 8px; padding: 14px 16px; }
          .rc-kpi-value { font-size: 28px; }
          .rc-kpi-right { align-items: flex-start; }
          .rc-kpi-top { flex-direction: column; align-items: flex-start; }
          .rc-content { margin: 0 8px 8px; }
          .rc-toolbar { padding: 6px 8px; }
          .rc-charts-grid { grid-template-columns: 1fr; }
          .rc-chart-wide { grid-column: 1; }
          .rc-charts-section { margin: 0 8px; }
        }
        @media (max-width: 640px) {
          .rc-topbar-right { width: 100%; justify-content: space-between; }
          .rc-kpi-minis { flex-wrap: wrap; }
          .rc-mini { min-width: 50%; }
          .rc-toolbar { flex-direction: column; align-items: flex-start; }
          .rc-toolbar-left { width: 100%; }
          .rc-toolbar-right { width: 100%; }
          .rc-search-input { width: 100%; }
          .rc-search-input:focus { width: 100%; }
          .rc-nav-today { display: none; }
          .rc-chart-card { padding: 12px; }
        }
      `}</style>
    </>
  )
}
