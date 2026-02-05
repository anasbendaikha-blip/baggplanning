'use client';

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { MOCK_EMPLOYEES } from '@/lib/mock-data';
import { ROLE_PALETTE, type RoleColorSet } from '@/lib/ui-tokens';
import type { EmployeeRole } from '@/lib/mock-data';
import styles from './header.module.css';

interface UserInfo {
  name: string;
  initials: string;
  role: EmployeeRole;
  roleColor: RoleColorSet;
}

const DEFAULT_USER: UserInfo = {
  name: 'Isabelle MAURER',
  initials: 'IM',
  role: 'Pharmacien' as EmployeeRole,
  roleColor: ROLE_PALETTE.Pharmacien,
};

function getRoleLabel(role: EmployeeRole): string {
  const labels: Record<string, string> = {
    Pharmacien: 'Pharmacien',
    Preparateur: 'Préparateur',
    Conditionneur: 'Conditionneur',
    Apprenti: 'Apprenti',
    Etudiant: 'Étudiant',
  };
  return labels[role] || role;
}

function resolveUser(): UserInfo {
  if (typeof window === 'undefined') return DEFAULT_USER;

  try {
    const raw = localStorage.getItem('baggplanning_session');
    if (!raw) return DEFAULT_USER;

    const session = JSON.parse(raw);

    // Try to find employee in mock data
    const employeeId = session.employeeId;
    if (employeeId && employeeId !== 'titulaire') {
      const emp = MOCK_EMPLOYEES.find(e => e.id === employeeId);
      if (emp) {
        const fullName = `${emp.prenom}${emp.nom ? ' ' + emp.nom : ''}`;
        return {
          name: fullName,
          initials: emp.initiales,
          role: emp.fonction,
          roleColor: ROLE_PALETTE[emp.fonction] || ROLE_PALETTE.Pharmacien,
        };
      }
    }

    // Titulaire fallback — lookup titulaire employee
    if (employeeId === 'titulaire' || session.role === 'titulaire') {
      // Find the titulaire pharmacien (Isabelle MAURER)
      const titulaire = MOCK_EMPLOYEES.find(
        e => e.fonction === 'Pharmacien' && e.initiales === 'IM'
      );
      if (titulaire) {
        return {
          name: `${titulaire.prenom}${titulaire.nom ? ' ' + titulaire.nom : ''}`,
          initials: titulaire.initiales,
          role: titulaire.fonction,
          roleColor: ROLE_PALETTE[titulaire.fonction],
        };
      }
    }

    // Generic fallback from session data
    const name = session.employeeName || session.prenom || 'Utilisateur';
    const initials =
      session.initiales ||
      session.employeeInitials ||
      name
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) ||
      '??';

    return {
      name,
      initials,
      role: 'Pharmacien' as EmployeeRole,
      roleColor: ROLE_PALETTE.Pharmacien,
    };
  } catch {
    return DEFAULT_USER;
  }
}

interface UserMenuProps {
  onLogout: () => void;
}

function UserMenu({ onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserInfo>(DEFAULT_USER);
  const menuRef = useRef<HTMLDivElement>(null);

  // Resolve user from localStorage on mount
  useEffect(() => {
    setUser(resolveUser());
  }, []);

  // Close on click outside / Escape
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const toggleMenu = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    setOpen(false);
    onLogout();
  }, [onLogout]);

  return (
    <div className={styles.userMenuWrapper} ref={menuRef}>
      <button
        className={`${styles.avatarBtn} ${open ? styles.avatarBtnOpen : ''}`}
        style={{ backgroundColor: user.roleColor.bg }}
        onClick={toggleMenu}
        aria-label="Menu utilisateur"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user.initials}
      </button>

      <div
        className={`${styles.userDropdown} ${open ? styles.userDropdownOpen : ''}`}
        role="menu"
        aria-label="Menu utilisateur"
      >
        {/* Header */}
        <div className={styles.userDropdownHeader}>
          <span className={styles.userDropdownName}>{user.name}</span>
          <span className={styles.userDropdownRole}>{getRoleLabel(user.role)}</span>
        </div>

        {/* Items */}
        <div className={styles.userDropdownItems}>
          <button
            className={`${styles.userDropdownItem} ${styles.userDropdownItemDisabled}`}
            role="menuitem"
            disabled
          >
            <span className={styles.userDropdownItemIcon}>👤</span>
            <span>Profil</span>
            <span className={styles.userDropdownBadge}>Bientôt</span>
          </button>

          <button
            className={`${styles.userDropdownItem} ${styles.userDropdownItemDisabled}`}
            role="menuitem"
            disabled
          >
            <span className={styles.userDropdownItemIcon}>⚙️</span>
            <span>Paramètres</span>
            <span className={styles.userDropdownBadge}>Bientôt</span>
          </button>

          <div className={styles.userDropdownSep} />

          <button
            className={`${styles.userDropdownItem} ${styles.userDropdownItemDanger}`}
            role="menuitem"
            onClick={handleLogout}
          >
            <span className={styles.userDropdownItemIcon}>🚪</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export { resolveUser, type UserInfo };
export default memo(UserMenu);
