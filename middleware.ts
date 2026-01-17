import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Récupérer la session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // Routes publiques (pas besoin d'être connecté)
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Routes protégées
  const isProtectedRoute = pathname.startsWith('/titulaire') || pathname.startsWith('/employe');

  // Si pas connecté et route protégée → rediriger vers login
  if (!session && isProtectedRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si connecté et sur une route protégée, vérifier le rôle
  if (session && isProtectedRoute) {
    // Récupérer le type d'utilisateur depuis la base de données
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', session.user.id)
      .single();

    const userType = userData?.user_type;

    // Vérifier les permissions
    if (pathname.startsWith('/titulaire') && userType !== 'titulaire') {
      // Un employé essaie d'accéder à la page titulaire
      return NextResponse.redirect(new URL('/employe', request.url));
    }

    if (pathname.startsWith('/employe') && userType === 'titulaire') {
      // Un titulaire essaie d'accéder à la page employé (optionnel, on peut autoriser)
      // return NextResponse.redirect(new URL('/titulaire', request.url));
    }
  }

  // Si connecté et sur la page login → rediriger vers dashboard
  if (session && pathname === '/auth/login') {
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', session.user.id)
      .single();

    const redirectUrl = userData?.user_type === 'titulaire' ? '/titulaire' : '/employe';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Si sur la racine '/' → rediriger
  if (pathname === '/') {
    if (session) {
      const { data: userData } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      const redirectUrl = userData?.user_type === 'titulaire' ? '/titulaire' : '/employe';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    } else {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return res;
}

// Configurer les routes où le middleware s'applique
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};