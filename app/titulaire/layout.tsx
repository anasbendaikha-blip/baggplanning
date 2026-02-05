'use client'

import { ReactNode } from 'react'
import { CSS_VARIABLES } from '@/lib/ui-tokens'
import Header from '@/components/Header/Header'

export default function TitulaireLayout({ children }: { children: ReactNode }) {
  return (
    <div className="tl-shell">
      {/* ── CSS Variables globales ── */}
      <style jsx global>{CSS_VARIABLES}</style>

      <Header />

      <main className="tl-main">{children}</main>

      <style jsx global>{`
        .tl-shell {
          min-height: 100vh;
          background: var(--bg);
        }
        .tl-main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
        }
        @media (max-width: 900px) {
          .tl-main { padding: 16px; }
        }
      `}</style>
    </div>
  )
}
