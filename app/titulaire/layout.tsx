'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode } from 'react'

const NAV_ITEMS = [
  { href: '/titulaire', label: 'Dashboard', icon: '📊' },
  { href: '/titulaire/equipe', label: 'Équipe', icon: '👥' },
  { href: '/titulaire/disponibilites', label: 'Disponibilités', icon: '📅' },
  { href: '/titulaire/demandes', label: 'Demandes', icon: '📋' },
  { href: '/titulaire/planning', label: 'Planning', icon: '📆' },
]

export default function TitulaireLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('baggplanning_session')
    }
    router.push('/auth/login')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>💊</span>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>BaggPlanning</h1>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Espace Titulaire — Isabelle MAURER</p>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: '4px' }}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/titulaire' && pathname?.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px',
                  fontSize: '14px', fontWeight: isActive ? '600' : '500', color: isActive ? '#10b981' : '#64748b',
                  backgroundColor: isActive ? '#ecfdf5' : 'transparent', textDecoration: 'none',
                }}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#8b5cf6',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '14px',
            }}>IM</div>
            <button onClick={handleLogout} style={{
              padding: '8px 12px', backgroundColor: '#fee2e2', color: '#dc2626',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '13px',
            }}>Déconnexion</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>{children}</main>
    </div>
  )
}
