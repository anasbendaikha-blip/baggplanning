import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'bp_auth'

function isPublicPath(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/auth/login') ||
    pathname === '/'
  )
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Laisser passer les fichiers publics
  if (isPublicPath(pathname)) return NextResponse.next()

  // Lire cookie
  const raw = req.cookies.get(COOKIE_NAME)?.value
  if (!raw) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  let user: { role?: 'titulaire' | 'employe' } | null = null
  try {
    user = JSON.parse(decodeURIComponent(raw))
  } catch {
    user = null
  }

  if (!user?.role) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Protection simple par zone
  if (pathname.startsWith('/titulaire') && user.role !== 'titulaire') {
    const url = req.nextUrl.clone()
    url.pathname = '/employe'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/employe') && user.role !== 'employe') {
    const url = req.nextUrl.clone()
    url.pathname = '/titulaire'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api).*)'], // ne pas bloquer /api
}