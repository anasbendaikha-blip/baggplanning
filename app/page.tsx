"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Pas connecté → rediriger vers login
          router.push('/auth/login');
          return;
        }

        // Connecté → récupérer le type d'utilisateur
        const { data: userData } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (userData?.user_type === 'titulaire') {
          router.push('/titulaire');
        } else {
          router.push('/employe');
        }

      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  const styles = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; }
    .loading-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e3a5f 100%);
      color: white;
    }
    .logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #34d399, #059669);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      margin-bottom: 24px;
      box-shadow: 0 8px 32px rgba(16,185,129,0.4);
      animation: pulse 2s infinite;
    }
    .title {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 14px;
      margin-bottom: 32px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255,255,255,0.1);
      border-top-color: #34d399;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .loading-text {
      margin-top: 16px;
      color: #94a3b8;
      font-size: 14px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `;

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="loading-page">
        <div className="logo">📅</div>
        <h1 className="title">BaggPlanning</h1>
        <p className="subtitle">Gestion des plannings de la pharmacie</p>
        <div className="spinner"></div>
        <p className="loading-text">Chargement...</p>
      </div>
    </div>
  );
}