import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  // Routes publiques
  const publicRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Routes protégées
  const isProtectedRoute =
    pathname.startsWith("/titulaire") || pathname.startsWith("/employe");

  // Pas connecté + route protégée => login
  if (!session && isProtectedRoute) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Connecté + sur /auth/login => rediriger selon rôle
  if (session && pathname.startsWith("/auth/login")) {
    const { data: userData } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", session.user.id)
      .single();

    const userType = userData?.user_type;
    const redirectUrl = userType === "titulaire" ? "/titulaire" : "/employe";
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  // Si route protégée, vérif du rôle
  if (session && isProtectedRoute) {
    const { data: userData } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", session.user.id)
      .single();

    const userType = userData?.user_type;

    if (pathname.startsWith("/titulaire") && userType !== "titulaire") {
      return NextResponse.redirect(new URL("/employe", req.url));
    }
  }

  // Racine => redirect
  if (pathname === "/") {
    if (!session) return NextResponse.redirect(new URL("/auth/login", req.url));

    const { data: userData } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", session.user.id)
      .single();

    const userType = userData?.user_type;
    const redirectUrl = userType === "titulaire" ? "/titulaire" : "/employe";
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};