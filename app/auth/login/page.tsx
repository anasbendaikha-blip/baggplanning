"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectParam = useMemo(() => {
    const r = searchParams.get("redirect");
    // sécurité minimale : on accepte seulement une route interne
    if (r && r.startsWith("/")) return r;
    return null;
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Si déjà connecté, laisse le middleware gérer / rediriger,
  // mais on évite l’écran bloqué si l’utilisateur revient sur /auth/login
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        // on force un refresh simple côté app, et le middleware fera la redirection
        router.replace("/auth/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      // 1) Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) {
        setError(authError.message);
        return;
      }

      const session = authData.session;
      if (!session?.user?.id) {
        setError("Session introuvable après connexion. Réessaie.");
        return;
      }

      // 2) user_type
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("user_type")
        .eq("id", session.user.id)
        .single();

      if (userError || !userData?.user_type) {
        // fallback (évite blocage)
        const fallback = "/employe";
        router.replace(redirectParam ?? fallback);
        return;
      }

      const fallback =
        userData.user_type === "titulaire" ? "/titulaire" : "/employe";

      // Si redirectParam existe, on l’utilise, sinon on applique la redirection par rôle
      router.replace(redirectParam ?? fallback);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message ?? "Une erreur est survenue");
    } finally {
      // IMPORTANT : ne jamais rester bloqué sur "Connexion en cours..."
      setLoading(false);
    }
  };

  const styles = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; }
    .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e3a5f 100%); padding: 20px; }
    .login-container { width: 100%; max-width: 420px; }
    .login-header { text-align: center; margin-bottom: 32px; }
    .logo { width: 72px; height: 72px; background: linear-gradient(135deg, #34d399, #059669); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; margin: 0 auto 16px; box-shadow: 0 8px 32px rgba(16,185,129,0.4); }
    .title { font-size: 28px; font-weight: 800; color: white; margin-bottom: 8px; }
    .subtitle { color: #94a3b8; font-size: 14px; }
    .login-card { background: white; border-radius: 24px; padding: 32px; box-shadow: 0 25px 50px rgba(0,0,0,0.25); }
    .form-group { margin-bottom: 20px; }
    .form-label { display: block; font-weight: 600; color: #334155; font-size: 14px; margin-bottom: 8px; }
    .form-input { width: 100%; padding: 14px 16px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-family: inherit; color: #1e293b; transition: all 0.2s; }
    .form-input:focus { outline: none; border-color: #10b981; background: white; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
    .form-input::placeholder { color: #94a3b8; }
    .error-message { background: #fee2e2; color: #b91c1c; padding: 12px 16px; border-radius: 10px; font-size: 13px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    .submit-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 12px; color: white; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s; box-shadow: 0 4px 16px rgba(16,185,129,0.3); }
    .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(16,185,129,0.4); }
    .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
    .divider { display: flex; align-items: center; margin: 24px 0; gap: 16px; }
    .divider-line { flex: 1; height: 1px; background: #e2e8f0; }
    .divider-text { color: #94a3b8; font-size: 12px; }
    .demo-accounts { background: #f8fafc; border-radius: 12px; padding: 16px; }
    .demo-title { font-weight: 600; color: #64748b; font-size: 12px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .demo-account { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .demo-account:last-child { border-bottom: none; }
    .demo-role { font-weight: 600; color: #334155; font-size: 14px; }
    .demo-email { color: #64748b; font-size: 12px; }
    .demo-btn { padding: 8px 16px; background: #10b981; border: none; border-radius: 8px; color: white; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .demo-btn:hover { background: #059669; }
    .info-box { background: #eff6ff; border-radius: 10px; padding: 12px 16px; margin-top: 16px; font-size: 12px; color: #1e40af; }
    .small { color: #64748b; font-size: 12px; margin-top: 12px; text-align: center; }
    .chip { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background:#f1f5f9; color:#334155; font-size:12px; }
  `;

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <div className="logo">📅</div>
            <h1 className="title">BaggPlanning</h1>
            <p className="subtitle">Gestion des plannings de la pharmacie</p>
            {redirectParam && (
              <div style={{ marginTop: 12 }}>
                <span className="chip">↪️ Redirection demandée : {redirectParam}</span>
              </div>
            )}
          </div>

          <div className="login-card">
            <form onSubmit={handleLogin}>
              {error && (
                <div className="error-message">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "⏳ Connexion en cours..." : "🔐 Se connecter"}
              </button>

              <div className="small">
                Si tu restes bloqué ici, c’est souvent un problème de redirection
                (middleware / rôle). Ce code évite le blocage côté UI.
              </div>
            </form>

            <div className="divider">
              <div className="divider-line"></div>
              <span className="divider-text">COMPTES DÉMO</span>
              <div className="divider-line"></div>
            </div>

            <div className="demo-accounts">
              <div className="demo-title">Tester l'application</div>

              <div className="demo-account">
                <div>
                  <div className="demo-role">👩‍💼 Titulaire</div>
                  <div className="demo-email">titulaire@pharmacie.fr</div>
                </div>
                <button
                  className="demo-btn"
                  type="button"
                  onClick={() => fillDemo("titulaire@pharmacie.fr", "demo123")}
                >
                  Utiliser
                </button>
              </div>

              <div className="demo-account">
                <div>
                  <div className="demo-role">🎓 Étudiant</div>
                  <div className="demo-email">anas@email.com</div>
                </div>
                <button
                  className="demo-btn"
                  type="button"
                  onClick={() => fillDemo("anas@email.com", "demo123")}
                >
                  Utiliser
                </button>
              </div>
            </div>

            <div className="info-box">
              💡 <strong>Astuce :</strong> Clique sur “Utiliser” pour remplir
              automatiquement les identifiants de démo, puis clique sur “Se
              connecter”.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}