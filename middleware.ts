import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // routes publiques
  const isPublic =
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/public')

  if (isPublic) return NextResponse.next()

  const role = req.cookies.get('bp_role')?.value || ''
  const employeeId = req.cookies.get('bp_employeeId')?.value || ''

  // si pas connecté => login
  if (!role) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // accès /titulaire
  if (pathname.startsWith('/titulaire') && role !== 'titulaire') {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // accès /employe
  if (pathname.startsWith('/employe') && role !== 'employe') {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // racine => dashboard selon role
  if (pathname === '/') {
    const url = req.nextUrl.clone()
    url.pathname = role === 'titulaire' ? '/titulaire' : '/employe'
    return NextResponse.redirect(url)
  }

  // sécurité: employé doit avoir un employeeId
  if (role === 'employe' && !employeeId) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api).*)'],
}