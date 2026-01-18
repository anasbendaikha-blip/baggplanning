import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Routes publiques
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Routes protégées
  const isProtectedRoute = pathname.startsWith('/titulaire') || pathname.startsWith('/employe');

  // Si pas connecté et route protégée → rediriger vers login
  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si connecté et sur une route protégée, vérifier le rôle
  if (user && isProtectedRoute) {
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    const userType = userData?.user_type;

    if (pathname.startsWith('/titulaire') && userType !== 'titulaire') {
      return NextResponse.redirect(new URL('/employe', request.url));
    }
  }

  // Si connecté et sur la page login → rediriger vers dashboard
  if (user && pathname === '/auth/login') {
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    const redirectUrl = userData?.user_type === 'titulaire' ? '/titulaire' : '/employe';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Si sur la racine '/'
  if (pathname === '/') {
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();

      const redirectUrl = userData?.user_type === 'titulaire' ? '/titulaire' : '/employe';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    } else {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};