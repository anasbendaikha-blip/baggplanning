// ============================================================
// 🎨 lib/ui-tokens.ts — Design Tokens centralisés BaggPlanning
// ============================================================
// Source unique de vérité pour couleurs, ombres, radius, rôles.
// Importé par toutes les pages titulaire (et employé à terme).
// ============================================================

import type { EmployeeRole } from '@/lib/mock-data'

// ============================================================
// 🏗️ TOKENS FONDAMENTAUX
// ============================================================

export const T = {
  // ── Fonds ──
  bg:        '#f8fafc',   // slate-50  — fond global
  card:      '#ffffff',   // blanc     — cartes / panels
  borderLt:  '#f1f5f9',   // slate-100 — fond alternatif / séparateurs légers
  border:    '#e2e8f0',   // slate-200 — bordures standard
  borderMd:  '#cbd5e1',   // slate-300 — bordures appuyées

  // ── Textes ──
  text:      '#0f172a',   // slate-900  — texte principal (contraste AAA)
  textSec:   '#64748b',   // slate-500  — texte secondaire
  muted:     '#94a3b8',   // slate-400  — texte désactivé / placeholders

  // ── Sémantiques ──
  primary:   '#10b981',   // emerald-500 — actions principales, succès
  primaryDk: '#059669',   // emerald-600 — hover / accent
  primaryLt: '#d1fae5',   // emerald-100 — fonds légers
  primaryBg: '#ecfdf5',   // emerald-50  — fonds très légers

  info:      '#3b82f6',   // blue-500  — liens, info
  infoDk:    '#2563eb',   // blue-600  — hover
  infoLt:    '#dbeafe',   // blue-100  — fonds
  infoBg:    '#eff6ff',   // blue-50   — fonds très légers

  warning:   '#f59e0b',   // amber-500 — alertes, en attente
  warningDk: '#d97706',   // amber-600 — hover
  warningLt: '#fef3c7',   // amber-100 — fonds
  warningBd: '#fde68a',   // amber-200 — bordures
  warningBg: '#fffbeb',   // amber-50  — fonds très légers

  danger:    '#ef4444',   // red-500   — erreurs, refus, urgences
  dangerDk:  '#dc2626',   // red-600   — hover
  dangerLt:  '#fee2e2',   // red-100   — fonds
  dangerBd:  '#fecaca',   // red-200   — bordures
  dangerBg:  '#fef2f2',   // red-50    — fonds très légers

  white:     '#ffffff',

  // ── Effets ──
  shadow:    '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
  shadowMd:  '0 4px 14px rgba(0,0,0,.07)',
  shadowLg:  '0 12px 32px rgba(0,0,0,.12)',
  shadowXl:  '0 20px 60px rgba(0,0,0,.15)',

  overlay:   'rgba(0,0,0,.4)',
  overlayLt: 'rgba(0,0,0,.35)',

  // ── Radius ──
  radius:    '16px',      // cartes principales
  radiusSm:  '10px',      // sous-cartes, avatars
  radiusXs:  '8px',       // badges, inputs
  radiusPill: '20px',     // chips, pills

  // ── Transitions ──
  transition: '0.15s ease',
  transitionMd: '0.2s ease',
} as const

// ============================================================
// 👥 COULEURS PAR RÔLE — palette "pharmacie premium"
// ============================================================
// RÈGLE CRITIQUE : Étudiant (rose #ec4899) ≠ Pause (gris #94a3b8)
// Chaque rôle a : bg (plein), text (sur fond plein), light (fond 10%),
// dark (texte sur fond clair), border (bordure tintée).
// ============================================================

export interface RoleColorSet {
  bg: string       // couleur pleine (avatar, badge filled)
  text: string     // texte sur fond plein (toujours blanc sauf exception)
  light: string    // fond léger (~10-15% opacité)
  dark: string     // texte foncé sur fond clair
  border: string   // bordure tintée
}

export const ROLE_PALETTE: Record<EmployeeRole, RoleColorSet> = {
  Pharmacien: {
    bg:     '#6366f1',   // indigo-500
    text:   '#ffffff',
    light:  '#eef2ff',   // indigo-50
    dark:   '#4338ca',   // indigo-700
    border: '#a5b4fc',   // indigo-300
  },
  Preparateur: {
    bg:     '#3b82f6',   // blue-500
    text:   '#ffffff',
    light:  '#eff6ff',   // blue-50
    dark:   '#1d4ed8',   // blue-700
    border: '#93c5fd',   // blue-300
  },
  Conditionneur: {
    bg:     '#f97316',   // orange-500
    text:   '#ffffff',
    light:  '#fff7ed',   // orange-50
    dark:   '#c2410c',   // orange-700
    border: '#fdba74',   // orange-300
  },
  Apprenti: {
    bg:     '#14b8a6',   // teal-500
    text:   '#ffffff',
    light:  '#f0fdfa',   // teal-50
    dark:   '#0f766e',   // teal-700
    border: '#5eead4',   // teal-300
  },
  Etudiant: {
    bg:     '#ec4899',   // pink-500 — DISTINCT de Pause (gris) ✅
    text:   '#ffffff',
    light:  '#fdf2f8',   // pink-50
    dark:   '#be185d',   // pink-700
    border: '#f9a8d4',   // pink-300
  },
}

// ============================================================
// 🎯 COULEURS ACTIVITÉS PLANNING
// ============================================================
// work = couleur du rôle (dynamique)
// pause = TOUJOURS gris neutre (jamais une couleur de rôle)
// congé = rose/rouge
// garde = navy foncé
// ============================================================

export const ACTIVITY_COLORS = {
  pause: {
    bg:     '#94a3b8',   // slate-400  — GRIS NEUTRE ≠ rôles
    text:   '#ffffff',
    light:  '#f1f5f9',   // slate-100
    dark:   '#475569',   // slate-600
    border: '#cbd5e1',   // slate-300
  },
  conge: {
    bg:     '#f43f5e',   // rose-500
    text:   '#ffffff',
    light:  '#ffe4e6',   // rose-100
    dark:   '#9f1239',   // rose-800
    border: '#fda4af',   // rose-300
  },
  garde: {
    bg:     '#1e1b4b',   // indigo-950
    text:   '#ffffff',
    light:  '#e0e7ff',   // indigo-100
    dark:   '#312e81',   // indigo-800
    border: '#6366f1',   // indigo-500
  },
} as const

// ============================================================
// 📊 COULEURS STATUTS (demandes, alertes)
// ============================================================

export const STATUS_COLORS = {
  pending:  { color: T.warning,  bg: T.warningLt, border: T.warningBd, label: 'En attente' },
  approved: { color: T.primary,  bg: T.primaryLt, border: T.primary,   label: 'Approuvée' },
  refused:  { color: T.danger,   bg: T.dangerLt,  border: T.dangerBd,  label: 'Refusée' },
} as const

// ============================================================
// 🔧 TYPE DEMANDE
// ============================================================

export const DEMANDE_TYPES = {
  conge:   { icon: '🏖️', color: T.info,    label: 'Congé' },
  echange: { icon: '🔄', color: '#8b5cf6', label: 'Échange' },  // purple-500
  maladie: { icon: '🏥', color: T.danger,  label: 'Maladie' },
} as const

// ============================================================
// 🌙 TYPES DE GARDE
// ============================================================

export const GARDE_TYPES = {
  soir:     { bg: '#fef3c7', color: '#92400e', border: '#fcd34d', label: 'Soir' },
  nuit:     { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd', label: 'Nuit' },
  dimanche: { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd', label: 'Dimanche' },
} as const

// ============================================================
// 🛠️ FONCTIONS UTILITAIRES
// ============================================================

/** Récupère la palette complète d'un rôle */
export function getRolePalette(role: EmployeeRole): RoleColorSet {
  return ROLE_PALETTE[role] || {
    bg: '#64748b', text: '#ffffff', light: '#f1f5f9', dark: '#334155', border: '#94a3b8',
  }
}

/** Couleur de fond pleine d'un rôle (pour avatars) */
export function getRoleBg(role: EmployeeRole): string {
  return ROLE_PALETTE[role]?.bg || '#64748b'
}

/** Génère les initiales à partir d'un employé (objet ou string) */
export function getEmployeeInitials(employee: { initiales?: string; prenom?: string; nom?: string } | string): string {
  if (typeof employee === 'string') return employee.slice(0, 2).toUpperCase()
  if (employee.initiales) return employee.initiales.toUpperCase()
  const parts = [employee.prenom, employee.nom].filter(Boolean)
  return parts.map(p => p![0]).join('').toUpperCase().slice(0, 2) || '??'
}

/** Génère un fond teinté (couleur + opacité hex) */
export function tint(color: string, opacity: number = 0.1): string {
  // Retourne une version CSS-safe avec opacité
  const hex = Math.round(opacity * 255).toString(16).padStart(2, '0')
  return color + hex
}

// ============================================================
// 🎨 CSS VARIABLES (à injecter dans le layout)
// ============================================================

export const CSS_VARIABLES = `
  :root {
    /* Fonds */
    --bg: ${T.bg};
    --card: ${T.card};
    --border: ${T.border};
    --border-lt: ${T.borderLt};
    --border-md: ${T.borderMd};

    /* Textes */
    --text: ${T.text};
    --text-sec: ${T.textSec};
    --muted: ${T.muted};

    /* Sémantiques */
    --primary: ${T.primary};
    --primary-dk: ${T.primaryDk};
    --primary-lt: ${T.primaryLt};
    --info: ${T.info};
    --info-dk: ${T.infoDk};
    --info-lt: ${T.infoLt};
    --warning: ${T.warning};
    --warning-dk: ${T.warningDk};
    --warning-lt: ${T.warningLt};
    --warning-bd: ${T.warningBd};
    --danger: ${T.danger};
    --danger-dk: ${T.dangerDk};
    --danger-lt: ${T.dangerLt};
    --danger-bd: ${T.dangerBd};

    /* Effets */
    --shadow: ${T.shadow};
    --shadow-md: ${T.shadowMd};
    --shadow-lg: ${T.shadowLg};
    --overlay: ${T.overlay};

    /* Radius */
    --radius: ${T.radius};
    --radius-sm: ${T.radiusSm};
    --radius-xs: ${T.radiusXs};
    --radius-pill: ${T.radiusPill};

    /* Rôles */
    --role-pharmacien: ${ROLE_PALETTE.Pharmacien.bg};
    --role-preparateur: ${ROLE_PALETTE.Preparateur.bg};
    --role-conditionneur: ${ROLE_PALETTE.Conditionneur.bg};
    --role-apprenti: ${ROLE_PALETTE.Apprenti.bg};
    --role-etudiant: ${ROLE_PALETTE.Etudiant.bg};

    /* Activités planning */
    --pause: ${ACTIVITY_COLORS.pause.bg};
    --conge: ${ACTIVITY_COLORS.conge.bg};
    --garde: ${ACTIVITY_COLORS.garde.bg};
  }
`
