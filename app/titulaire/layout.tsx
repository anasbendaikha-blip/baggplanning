'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

// ============================================================
// 📁 app/titulaire/layout.tsx
// ============================================================
// Layout commun pour toutes les pages titulaire
// Inclut le header et la navigation entre sections
// ============================================================

interface TitulaireLayoutProps {
  children: ReactNode
}

const NAV_ITEMS = [
  { href: '/titulaire', label: 'Dashboard', icon: '📊' },
  { href: '/titulaire/equipe', label: 'Équipe', icon: '👥' },
  { href: '/titulaire/disponibilites', label: 'Disponibilités', icon: '📅' },
  { href: '/titulaire/demandes', label: 'Demandes', icon: '📋' },
  { href: '/titulaire/planning', label: 'Planning', icon: '📆' },
]

export default function TitulaireLayout({ children }: TitulaireLayoutProps) {
  const pathname = usePathname()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Logo / Titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>💊</span>
            <div>
              <h1 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#1e293b',
                margin: 0,
              }}>
                BaggPlanning
              </h1>
              <p style={{ 
                fontSize: '12px', 
                color: '#64748b',
                margin: 0,
              }}>
                Espace Titulaire — Isabelle MAURER
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ display: 'flex', gap: '4px' }}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/titulaire' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? '#10b981' : '#64748b',
                    backgroundColor: isActive ? '#ecfdf5' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#10b981',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px',
            }}>
              IM
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px',
      }}>
        {children}
      </main>
    </div>
  )
}
