'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function EmployeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userName, setUserName] = useState('Employé')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('baggplanning_session')
      if (stored) {
        const parsed = JSON.parse(stored)
        setUserName(parsed.employeeName || 'Employé')
      }
    }
  }, [])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('baggplanning_session')
    }
    router.push('/auth/login')
  }

  const navItems = [
    { href: '/employe', label: 'Mon Planning', icon: '📅' },
    { href: '/employe/disponibilites', label: 'Mes Disponibilités', icon: '📋' },
    { href: '/employe/demandes', label: 'Mes Demandes', icon: '📝' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
          }}>📅</div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>BaggPlanning</h1>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Espace Employé</p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '4px' }}>
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                padding: '10px 16px', borderRadius: '8px',
                backgroundColor: isActive ? '#ecfdf5' : 'transparent',
                color: isActive ? '#059669' : '#64748b',
                textDecoration: 'none', fontWeight: isActive ? '600' : '500', fontSize: '14px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span>{item.icon}</span>{item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{userName}</p>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Employé</p>
          </div>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#10b981',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '14px',
          }}>
            {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <button onClick={handleLogout} style={{
            padding: '8px 12px', backgroundColor: '#fee2e2', color: '#dc2626',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '13px',
          }}>Déconnexion</button>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
