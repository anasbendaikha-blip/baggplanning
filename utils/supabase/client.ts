// ============================================================
// 📁 utils/supabase/client.ts
// ============================================================
// Client Supabase pour les composants CLIENT (use client)
// À utiliser dans les composants avec "use client"
// ============================================================

import { createBrowserClient } from '@supabase/ssr'


export function createClient() {
  return createBrowserClient (
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Export d'une instance unique pour les cas simples
export const supabase = createClient()
