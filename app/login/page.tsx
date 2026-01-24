'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ============================================================
// 📁 app/login/page.tsx
// ============================================================
// Redirection automatique vers la vraie page de login
// URL: /login → /auth/login
// ============================================================

export default function LoginRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/auth/login')
  }, [router])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <p>Redirection vers la page de connexion...</p>
    </div>
  )
}