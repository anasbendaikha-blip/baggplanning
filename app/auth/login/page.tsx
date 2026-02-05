'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_EMPLOYEES } from '@/lib/mock-data'

type Role = 'employe' | 'titulaire'

function setCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`
}

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('employe')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [loading, setLoading] = useState(false)

  const employees =
    role === 'titulaire'
      ? MOCK_EMPLOYEES.filter((e) => e.fonction === 'Pharmacien' && e.actif)
      : MOCK_EMPLOYEES.filter((e) => e.actif)

  const handleLogin = () => {
    if (role === 'employe' && !selectedEmployee) {
      alert('Veuillez sélectionner un employé')
      return
    }

    setLoading(true)

    const employeeName =
      role === 'titulaire'
        ? 'Isabelle MAURER (Titulaire)'
        : (() => {
            const emp = MOCK_EMPLOYEES.find((e) => String(e.id) === String(selectedEmployee))
            return emp ? `${emp.prenom} ${emp.nom}` : 'Employé'
          })()

    const session = {
      role,
      employeeId: role === 'titulaire' ? 'titulaire' : String(selectedEmployee),
      employeeName,
      loginTime: new Date().toISOString(),
    }

    localStorage.setItem('baggplanning_session', JSON.stringify(session))
    setCookie('bp_role', role)
    setCookie('bp_employeeId', role === 'titulaire' ? 'titulaire' : String(selectedEmployee))
    router.replace(role === 'titulaire' ? '/titulaire' : '/employe')
  }

  const accentColor = role === 'titulaire' ? '#7c3aed' : '#059669'
  const accentBg = role === 'titulaire' ? '#f5f3ff' : '#ecfdf5'
  const accentLight = role === 'titulaire' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)'
  const canLogin = role === 'titulaire' || selectedEmployee

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0c1220;
          background-image:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16, 185, 129, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 100%, rgba(124, 58, 237, 0.06) 0%, transparent 50%);
          padding: 24px;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .login-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 44px 40px 36px;
          width: 100%;
          max-width: 440px;
          box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.03),
            0 24px 48px -12px rgba(0, 0, 0, 0.18),
            0 4px 12px rgba(0, 0, 0, 0.06);
          animation: cardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .login-logo {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 26px;
          background: linear-gradient(145deg, #059669, #10b981);
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
          transition: background 0.4s ease, box-shadow 0.4s ease;
        }

        .login-logo.titulaire {
          background: linear-gradient(145deg, #7c3aed, #8b5cf6);
          box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
        }

        .login-title {
          text-align: center;
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 6px;
          letter-spacing: -0.3px;
        }

        .login-subtitle {
          text-align: center;
          font-size: 13px;
          color: #9ca3af;
          margin: 0 0 32px;
          font-weight: 400;
        }

        .login-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 10px;
          letter-spacing: 0.01em;
        }

        .role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 28px;
        }

        .role-btn {
          position: relative;
          padding: 20px 16px 16px;
          border-radius: 14px;
          border: 2px solid #e5e7eb;
          background: #fff;
          cursor: pointer;
          text-align: center;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
        }

        .role-btn:hover {
          border-color: #d1d5db;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .role-btn.active-employe {
          border-color: #10b981;
          background: #ecfdf5;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .role-btn.active-titulaire {
          border-color: #8b5cf6;
          background: #f5f3ff;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .role-btn .role-icon {
          font-size: 26px;
          margin-bottom: 8px;
          display: block;
        }

        .role-btn .role-text {
          font-weight: 600;
          font-size: 13px;
          color: #6b7280;
          transition: color 0.2s ease;
        }

        .role-btn.active-employe .role-text { color: #059669; }
        .role-btn.active-titulaire .role-text { color: #7c3aed; }

        .role-btn .role-check {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          opacity: 0;
          transform: scale(0.5);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .role-btn.active-employe .role-check {
          opacity: 1;
          transform: scale(1);
          background: #059669;
          color: white;
        }

        .role-btn.active-titulaire .role-check {
          opacity: 1;
          transform: scale(1);
          background: #7c3aed;
          color: white;
        }

        .select-wrapper {
          position: relative;
          margin-bottom: 28px;
          animation: fadeSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes fadeSlide {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .select-field {
          width: 100%;
          padding: 14px 40px 14px 16px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          color: #111827;
          background-color: #fff;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }

        .select-field:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .select-field option {
          color: #111827;
          background: #fff;
          font-size: 14px;
          padding: 8px;
        }

        .select-field option:disabled {
          color: #9ca3af;
        }

        .select-field:invalid,
        .select-field .placeholder-opt {
          color: #9ca3af;
        }

        .select-arrow {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #9ca3af;
          font-size: 12px;
        }

        .login-btn {
          width: 100%;
          padding: 15px 24px;
          border-radius: 14px;
          border: none;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
          letter-spacing: 0.01em;
        }

        .login-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .login-btn:not(:disabled):active {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .login-btn.employe-btn {
          background: linear-gradient(145deg, #059669, #10b981);
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.25);
        }

        .login-btn.titulaire-btn {
          background: linear-gradient(145deg, #7c3aed, #8b5cf6);
          box-shadow: 0 2px 10px rgba(124, 58, 237, 0.25);
        }

        .login-footer {
          text-align: center;
          font-size: 12px;
          color: #b0b8c4;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .login-footer svg {
          opacity: 0.5;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 32px 24px 28px;
            border-radius: 20px;
          }
        }
      `}</style>

      <div className="login-root">
        <div className="login-card">
          {/* ─── Logo ─── */}
          <div className={`login-logo ${role === 'titulaire' ? 'titulaire' : ''}`}>
            📅
          </div>

          <h1 className="login-title">BaggPlanning</h1>
          <p className="login-subtitle">Connexion démo — Pharmacie Isabelle MAURER</p>

          {/* ─── Rôle ─── */}
          <label className="login-label">Je suis...</label>
          <div className="role-grid">
            <button
              className={`role-btn ${role === 'employe' ? 'active-employe' : ''}`}
              onClick={() => { setRole('employe'); setSelectedEmployee('') }}
            >
              <span className="role-check">✓</span>
              <span className="role-icon">👤</span>
              <span className="role-text">Employé</span>
            </button>

            <button
              className={`role-btn ${role === 'titulaire' ? 'active-titulaire' : ''}`}
              onClick={() => { setRole('titulaire'); setSelectedEmployee('') }}
            >
              <span className="role-check">✓</span>
              <span className="role-icon">👑</span>
              <span className="role-text">Titulaire</span>
            </button>
          </div>

          {/* ─── Sélection employé ─── */}
          {role === 'employe' && (
            <div className="select-wrapper">
              <label className="login-label">Choisir mon profil</label>
              <select
                className="select-field"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="" disabled>
                  — Sélectionner un profil —
                </option>

                <optgroup label="🧑‍⚕️ Pharmaciens">
                  {employees.filter(e => e.fonction === 'Pharmacien').map(e => (
                    <option key={e.id} value={String(e.id)}>{e.prenom} {e.nom}</option>
                  ))}
                </optgroup>

                <optgroup label="💊 Préparateurs">
                  {employees.filter(e => e.fonction === 'Preparateur').map(e => (
                    <option key={e.id} value={String(e.id)}>{e.prenom} {e.nom}</option>
                  ))}
                </optgroup>

                <optgroup label="🎓 Apprentis">
                  {employees.filter(e => e.fonction === 'Apprenti').map(e => (
                    <option key={e.id} value={String(e.id)}>{e.prenom} {e.nom}</option>
                  ))}
                </optgroup>

                <optgroup label="📚 Étudiants">
                  {employees.filter(e => e.fonction === 'Etudiant').map(e => (
                    <option key={e.id} value={String(e.id)}>{e.prenom} {e.nom}</option>
                  ))}
                </optgroup>

                <optgroup label="📦 Conditionneurs">
                  {employees.filter(e => e.fonction === 'Conditionneur').map(e => (
                    <option key={e.id} value={String(e.id)}>{e.prenom} {e.nom}</option>
                  ))}
                </optgroup>
              </select>
              <span className="select-arrow">▼</span>
            </div>
          )}

          {/* ─── Bouton connexion ─── */}
          <button
            className={`login-btn ${role === 'titulaire' ? 'titulaire-btn' : 'employe-btn'}`}
            onClick={handleLogin}
            disabled={loading || !canLogin}
          >
            {loading ? (
              'Connexion...'
            ) : (
              <>
                {role === 'titulaire' ? '👑' : '👤'}
                Se connecter
              </>
            )}
          </button>

          {/* ─── Footer ─── */}
          <div className="login-footer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Mode démo — Pas de mot de passe requis
          </div>
        </div>
      </div>
    </>
  )
}