'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import './employe.css'

type Session = {
  role?: string
  employeeId?: string
  employeeName?: string
  // various possible keys coming from login/localStorage
  employeeInitials?: string
  initiales?: string
  employeeFunction?: string
  fonction?: string
  job?: string
  firstName?: string
  lastName?: string
  prenom?: string
  nom?: string
}

export default function EmployeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const userBtnRef = useRef<HTMLButtonElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const fullName = useMemo(() => {
    const raw =
      session?.employeeName ||
      [session?.firstName || session?.prenom, session?.lastName || session?.nom].filter(Boolean).join(' ') ||
      session?.nom ||
      ''

    // avoid displaying the literal word "undefined" when a field is missing
    const cleaned = raw
      .replace(/\bundefined\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim()

    return cleaned || 'Employé'
  }, [session])

  const initials = useMemo(() => {
    const explicit = (session?.employeeInitials || session?.initiales || '').trim()
    if (explicit) return explicit.toUpperCase()

    const parts = fullName
      .split(' ')
      .map((p) => p.trim())
      .filter(Boolean)

    const computed = parts
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('')

    return computed || 'EM'
  }, [session, fullName])

  const functionLabel = useMemo(() => {
    const raw = (session?.employeeFunction || session?.fonction || session?.job || '').trim()
    if (raw) return raw
    // fallback (display something nicer than `role: employe`)
    if ((session?.role || '').toLowerCase() === 'employe') return 'Employé'
    return session?.role?.trim() || 'Employé'
  }, [session])

  // onglet actif via URL
  const activeTab = useMemo(() => {
    if (pathname?.startsWith('/employe/disponibilites')) return 'dispos'
    if (pathname?.startsWith('/employe/demandes')) return 'demandes'
    return 'planning'
  }, [pathname])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('baggplanning_session')
      if (!stored) {
        window.location.replace('/auth/login')
        return
      }
      const parsed = JSON.parse(stored) as Session

      const employeeId = parsed?.employeeId
      const employeeName =
        parsed?.employeeName ||
        [parsed?.firstName || parsed?.prenom, parsed?.lastName || parsed?.nom].filter(Boolean).join(' ') ||
        parsed?.nom ||
        ''

      const normalized: Session = {
        ...parsed,
        employeeId,
        employeeName,
        employeeInitials: parsed?.employeeInitials || parsed?.initiales,
        employeeFunction: parsed?.employeeFunction || parsed?.fonction || parsed?.job,
      }

      // Minimal validation
      if (!normalized?.employeeId) {
        window.location.replace('/auth/login')
        return
      }

      setSession(normalized)
    } catch {
      window.location.replace('/auth/login')
    }
  }, [])

  // fermer dropdown quand on change de page
  useEffect(() => {
    setShowUserDropdown(false)
  }, [pathname])

  // fermer dropdown si clic en dehors / touche ESC
  useEffect(() => {
    if (!showUserDropdown) return

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      const btn = userBtnRef.current
      const dd = dropdownRef.current
      if (btn && btn.contains(target)) return
      if (dd && dd.contains(target)) return
      setShowUserDropdown(false)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowUserDropdown(false)
    }

    // capture = true pour éviter les problèmes de z-index/overlay
    document.addEventListener('mousedown', onMouseDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [showUserDropdown])

  const logout = () => {
    try {
      localStorage.removeItem('baggplanning_session')
      localStorage.removeItem('baggplanning_user')
      sessionStorage.clear()
    } catch {}
    window.location.replace('/auth/login')
  }

  if (!session) return null

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <Link href="/" className="logo-section">
            <div className="logo">📅</div>
            <div className="logo-text">
              <h1>BaggPlanning</h1>
              <p>Espace Employé</p>
            </div>
          </Link>

          <div className="user-selector">
            <button
              ref={userBtnRef}
              type="button"
              className="user-btn"
              onClick={() => setShowUserDropdown((v) => !v)}
              aria-expanded={showUserDropdown}
              aria-haspopup="menu"
            >
              <div className="user-avatar">{initials}</div>
              <div className="user-info">
                <div className="user-name">{fullName}</div>
                <div className="user-role">{functionLabel}</div>
              </div>
              <span aria-hidden>▼</span>
            </button>

            <div
              ref={dropdownRef}
              className={`user-dropdown ${showUserDropdown ? 'active' : ''}`}
              role="menu"
            >
              <button
                type="button"
                className="user-option danger"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  logout()
                }}
              >
                <div className="avatar danger">⏻</div>
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-content">
          <div className="tabs">
            <Link className={`tab ${activeTab === 'planning' ? 'active' : ''}`} href="/employe">
              <span>📅</span>
              <span>Planning</span>
            </Link>

            <Link className={`tab ${activeTab === 'dispos' ? 'active' : ''}`} href="/employe/disponibilites">
              <span>✋</span>
              <span>Dispos</span>
            </Link>

            <Link className={`tab ${activeTab === 'demandes' ? 'active' : ''}`} href="/employe/demandes">
              <span>📋</span>
              <span>Demandes</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main container commun */}
      <main className="main">{children}</main>

    </>
  )
}