'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Role = 'titulaire' | 'employe'

export type MockUser = {
  role: Role
  employeeName?: string
}

type AuthContextValue = {
  user: MockUser | null
  loading: boolean
  loginAsTitulaire: () => void
  loginAsEmploye: (employeeName: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const COOKIE_NAME = 'bp_auth' // BaggPlanning Auth

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=Lax`
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`
}

function readLocalUser(): MockUser | null {
  try {
    const raw = localStorage.getItem('bp_user')
    return raw ? (JSON.parse(raw) as MockUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Hydrate depuis localStorage au 1er chargement
    const u = readLocalUser()
    setUser(u)
    setLoading(false)
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      loading,
      loginAsTitulaire: () => {
        const u: MockUser = { role: 'titulaire' }
        localStorage.setItem('bp_user', JSON.stringify(u))
        setCookie(COOKIE_NAME, JSON.stringify(u))
        setUser(u)
      },
      loginAsEmploye: (employeeName: string) => {
        const u: MockUser = { role: 'employe', employeeName }
        localStorage.setItem('bp_user', JSON.stringify(u))
        setCookie(COOKIE_NAME, JSON.stringify(u))
        setUser(u)
      },
      logout: () => {
        localStorage.removeItem('bp_user')
        deleteCookie(COOKIE_NAME)
        setUser(null)
      },
    }
  }, [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}