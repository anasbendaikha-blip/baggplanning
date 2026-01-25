import { redirect } from 'next/navigation'

// ============================================================
// 📁 app/login/page.tsx
// ============================================================
// Redirection automatique vers la vraie page de login
// URL: /login → /auth/login
//
// ✅ Server Component (recommandé)
// - pas de flash UI
// - pas de useEffect
// - pas de boucles liées au client-side routing
//
// Note: on force le rendu dynamique pour éviter toute optimisation
// statique/caching qui pourrait surprendre en prod.
// ============================================================

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function LoginRedirectPage() {
  redirect('/auth/login')
}