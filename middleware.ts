import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Routes publiques - laisser passer
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Vérifier si l'utilisateur a un cookie de session Supabase
  const supabaseAuthToken = request.cookies.get('sb-access-token') || 
                            request.cookies.get('sb-refresh-token') ||
                            // Nouveau format des cookies Supabase
                            Array.from(request.cookies.getAll()).find(c => c.name.includes('auth-token'));

  // Routes protégées
  const isProtectedRoute = pathname.startsWith('/titulaire') || pathname.startsWith('/employe');

  // Si pas de cookie et route protégée → rediriger vers login
  if (!supabaseAuthToken && isProtectedRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si sur la racine '/' sans cookie → login
  if (pathname === '/' && !supabaseAuthToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Laisser passer toutes les autres requêtes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};