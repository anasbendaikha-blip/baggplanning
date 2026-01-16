"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Connexion avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Erreur de connexion');
        setLoading(false);
        return;
      }

      // 2. Récupérer le type d'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userData) {
        // Si pas dans la table users, rediriger vers employe par défaut
        console.log('User not found in users table, redirecting to employe');
        router.push('/employe');
        return;
      }

      // 3. Rediriger selon le type
      if (userData.user_type === 'titulaire') {
        router.push('/titulaire');
      } else {
        router.push('/employe');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError('Une erreur est survenue');
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
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
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? '⏳ Connexion en cours...' : '🔐 Se connecter'}
              </button>
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
                <button className="demo-btn" type="button" onClick={() => fillDemo('titulaire@pharmacie.fr', 'demo123')}>
                  Utiliser
                </button>
              </div>
              <div className="demo-account">
                <div>
                  <div className="demo-role">🎓 Étudiant</div>
                  <div className="demo-email">anas@email.com</div>
                </div>
                <button className="demo-btn" type="button" onClick={() => fillDemo('anas@email.com', 'demo123')}>
                  Utiliser
                </button>
              </div>
            </div>

            <div className="info-box">
              💡 <strong>Astuce :</strong> Cliquez sur "Utiliser" pour remplir automatiquement les identifiants de démo, puis cliquez sur "Se connecter".
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}