'use client';

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './header.module.css';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  highlight?: boolean;
}

interface GestionSubItem {
  href: string;
  label: string;
  icon: string;
}

const DIRECT_TABS: NavItem[] = [
  { href: '/titulaire', label: 'Tableau de bord', icon: '📊' },
  { href: '/titulaire/planning', label: 'Planning', icon: '📆' },
  { href: '/titulaire/assistant-planning', label: 'Assistant', icon: '✨', highlight: true },
];

const GESTION_ITEMS: GestionSubItem[] = [
  { href: '/titulaire/equipe', label: 'Équipe', icon: '👥' },
  { href: '/titulaire/disponibilites', label: 'Disponibilités', icon: '📅' },
  { href: '/titulaire/demandes', label: 'Demandes', icon: '📋' },
];

const GESTION_PATHS = GESTION_ITEMS.map(i => i.href);

function NavTabs() {
  const pathname = usePathname();
  const [gestionOpen, setGestionOpen] = useState(false);
  const gestionRef = useRef<HTMLDivElement>(null);

  const isGestionActive = GESTION_PATHS.some(
    p => pathname === p || pathname?.startsWith(p + '/')
  );

  // Close dropdown on route change
  useEffect(() => {
    setGestionOpen(false);
  }, [pathname]);

  // Close on click outside (use 'click' not 'mousedown' to let link clicks complete first)
  useEffect(() => {
    if (!gestionOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (gestionRef.current && !gestionRef.current.contains(e.target as Node)) {
        setGestionOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGestionOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [gestionOpen]);

  const handleGestionToggle = useCallback(() => {
    setGestionOpen(prev => !prev);
  }, []);

  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleGestionMouseEnter = useCallback(() => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    setGestionOpen(true);
  }, []);

  const handleGestionMouseLeave = useCallback(() => {
    // Petit délai pour permettre de traverser le gap bouton → dropdown
    hoverTimeout.current = setTimeout(() => {
      setGestionOpen(false);
    }, 100);
  }, []);

  return (
    <nav className={styles.nav} role="navigation" aria-label="Navigation principale">
      {/* Tableau de bord */}
      {DIRECT_TABS.filter(t => t.href === '/titulaire').map(tab => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.navIcon}>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}

      {/* Gestion dropdown */}
      <div
        className={styles.gestionWrapper}
        ref={gestionRef}
        onMouseEnter={handleGestionMouseEnter}
        onMouseLeave={handleGestionMouseLeave}
      >
        <button
          className={`${styles.gestionBtn} ${isGestionActive ? styles.gestionBtnActive : ''}`}
          onClick={handleGestionToggle}
          aria-expanded={gestionOpen}
          aria-haspopup="true"
        >
          <span className={styles.navIcon}>📁</span>
          <span>Gestion</span>
          <span className={`${styles.gestionChevron} ${gestionOpen ? styles.gestionChevronOpen : ''}`}>
            ▾
          </span>
        </button>

        <div
          className={`${styles.gestionDropdown} ${gestionOpen ? styles.gestionDropdownOpen : ''}`}
          role="menu"
        >
          {GESTION_ITEMS.map(item => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.gestionItem} ${isActive ? styles.gestionItemActive : ''}`}
                role="menuitem"
                onClick={() => setGestionOpen(false)}
              >
                <span className={styles.gestionItemIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Planning + Assistant */}
      {DIRECT_TABS.filter(t => t.href !== '/titulaire').map(tab => {
        const isActive = pathname === tab.href || pathname?.startsWith(tab.href + '/');
        const classNames = [
          styles.navLink,
          isActive ? styles.navLinkActive : '',
          tab.highlight ? styles.navLinkHighlight : '',
        ].filter(Boolean).join(' ');

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={classNames}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.navIcon}>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default memo(NavTabs);
